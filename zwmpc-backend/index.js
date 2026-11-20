const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const { verifyToken, requireRole } = require('./middleware');

require('dotenv').config();

const app = express();

// Allow both the main production URL and any Vercel preview URL
app.use(cors({
    origin: [
        'https://zwmpc.vercel.app', // Your main production URL
        /\.vercel\.app$/            // Allows ANY url ending in .vercel.app (for previews)
    ],
    credentials: true
}));
app.use(express.json());

// Database Connection (Aiven requires SSL)
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false } // Required for Aiven
});

// --- UPDATED REGISTRATION (Pending Approval) ---
app.post('/api/register', async (req, res) => {
    const { username, email, password, role } = req.body; 
    
    // Super Admin check (still enforce only one - even if UI hides it)
    if (role === 'super_admin') {
        db.query('SELECT id FROM users WHERE role = "super_admin"', async (err, results) => {
            if (results.length > 0) return res.status(400).json({ message: 'A Super Admin already exists.' });
            proceed();
        });
    } else { proceed(); }

    async function proceed() {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length > 0) return res.status(400).json({ message: 'Email already in use' });

            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Notice: is_approved is set to FALSE by default, branch_id is NULL
                const sql = 'INSERT INTO users (username, email, password_hash, role, is_approved) VALUES (?, ?, ?, ?, FALSE)';
                db.query(sql, [username, email, hashedPassword, role], (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(201).json({ message: 'Registration successful! Please wait for Admin approval.' });
                });
            } catch (error) {
                res.status(500).json({ error: 'Server error during registration' });
            }
        });
    }
});

// --- UPDATED LOGIN (Check Approval & Branch Assignment) ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // 1. CHECK APPROVAL STATUS
        if (!user.is_approved) {
            return res.status(403).json({ message: 'Account pending approval. Please contact your administrator.' });
        }

        // 2. CHECK BRANCH ASSIGNMENT (Super Admin is exempt)
        if (user.role !== 'super_admin' && !user.branch_id) {
            return res.status(403).json({ message: 'Account is approved but not assigned to a branch. Please contact the Super Admin.' });
        }

        // 3. GENERATE TOKEN
        const token = jwt.sign({ id: user.id, role: user.role, branch_id: user.branch_id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // 4. LOG THE SUCCESSFUL LOGIN
        logAction(user.id, 'LOGIN', `User ${user.username} logged in.`);

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                username: user.username, 
                role: user.role, 
                branch_id: user.branch_id,
                contact_number: user.contact_number, // Added
                profile_picture: user.profile_picture // Added
            } 
        });
    });
});

// --- GET PENDING USERS (For Super Admin & Admin) ---
app.get('/api/users/pending', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    let sql = 'SELECT id, username, email, role, created_at FROM users WHERE is_approved = FALSE';
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- APPROVE USER ---
app.post('/api/users/approve', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    let { user_id, branch_id } = req.body;
    
    // 1. If an Admin is approving, force the branch to be their own
    if (req.user.role === 'admin') {
        branch_id = req.user.branch_id; 
    }

    // 2. VALIDATION: Ensure a branch is actually provided (for Super Admin)
    if (!branch_id) {
        return res.status(400).json({ message: 'A branch must be assigned before this user can be approved.' });
    }

    // 3. Update the user
    const sql = 'UPDATE users SET is_approved = TRUE, branch_id = ? WHERE id = ?';
    
    db.query(sql, [branch_id, user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Log the action for the Audit Trail
        logAction(req.user.id, 'APPROVE_USER', `Approved user ID ${user_id} and assigned to branch ID ${branch_id}.`);
        
        res.json({ message: 'User approved and assigned successfully.' });
    });
});

// --- REJECT USER ---
app.delete('/api/users/reject/:id', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    const targetUserId = req.params.id;
    const sql = 'DELETE FROM users WHERE id = ? AND is_approved = FALSE';
    
    db.query(sql, [targetUserId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Log the rejection for the Audit Trail
        logAction(req.user.id, 'REJECT_USER', `Rejected and deleted registration request for user ID ${targetUserId}.`);
        
        res.json({ message: 'User request rejected and deleted.' });
    });
});

// --- EDIT/UPDATE USER (Super Admin Only) ---
app.put('/api/users/:id', verifyToken, requireRole(['super_admin']), (req, res) => {
    const targetId = req.params.id;
    const { role, branch_id } = req.body;

    // Prevent Super Admin from accidentally changing their own role/branch
    if (parseInt(targetId) === req.user.id) {
        return res.status(400).json({ message: 'You cannot edit your own Super Admin account.' });
    }

    // Require a branch if the role is not super_admin
    if (role !== 'super_admin' && !branch_id) {
        return res.status(400).json({ message: 'A branch must be assigned for Admin and Staff roles.' });
    }

    // If the user is super_admin, branch_id should be null
    const finalBranchId = role === 'super_admin' ? null : branch_id;

    const sql = 'UPDATE users SET role = ?, branch_id = ? WHERE id = ?';
    
    db.query(sql, [role, finalBranchId, targetId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        
        logAction(req.user.id, 'EDIT_USER', `Updated user ID ${targetId} to role ${role}.`);
        
        res.json({ message: 'User account updated successfully.' });
    });
});

// ==========================================
// USER MANAGEMENT (GET ALL & DELETE)
// ==========================================

// 1. Get ALL users (Super Admin sees everyone, Admin sees their branch)
app.get('/api/users/all', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    let sql = `
        SELECT u.id, u.username, u.email, u.role, u.is_approved, u.created_at, b.branch_name
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
    `;
    let params = [];

    // If an Admin logs in, they only see users from their branch
    if (req.user.role === 'admin') {
        sql += ' WHERE u.branch_id = ?';
        params.push(req.user.branch_id);
    }
    
    sql += ' ORDER BY u.is_approved ASC, u.created_at DESC'; // Pending users show first

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. Delete a user (ONLY Super Admin can do this)
app.delete('/api/users/:id', verifyToken, requireRole(['super_admin']), (req, res) => {
    const userIdToDelete = req.params.id;

    // Safety check: Prevent Super Admin from deleting their own account
    if (parseInt(userIdToDelete) === req.user.id) {
        return res.status(400).json({ message: 'You cannot delete your own Super Admin account.' });
    }

    const sql = 'DELETE FROM users WHERE id = ?';
    db.query(sql, [userIdToDelete], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        logAction(req.user.id, 'DELETE_USER', `Deleted user ID ${userIdToDelete}.`);
        res.json({ message: 'User deleted successfully.' });
    });
});

// --- PUBLIC ROUTE TO FETCH BRANCHES FOR REGISTRATION ---
app.get('/api/public/branches', (req, res) => {
    db.query('SELECT id, branch_name FROM branches', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- BRANCH MANAGEMENT ROUTES ---

// Create a Branch (Super Admin & Admin)
app.post('/api/branches', verifyToken, requireRole(['super_admin']), (req, res) => {
    const { branch_name, location } = req.body;
    const sql = 'INSERT INTO branches (branch_name, location) VALUES (?, ?)';
    
    db.query(sql, [branch_name, location], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Branch created successfully', branchId: result.insertId });
    });
});

// Get All Branches
app.get('/api/branches', verifyToken, (req, res) => {
    db.query('SELECT * FROM branches', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- ADVANCED ADMIN SYSTEM STORAGE MONITOR ---
app.get('/api/system/storage', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    const dfCmd = `df -B1 / | tail -1 | awk '{print $2, $3, $4}'`;
    const duCmd = `du -sb /opt/render/project/src 2>/dev/null | awk '{print $1}'`;
    const inodeCmd = `df -i / | tail -1 | awk '{print $1, $2, $3}'`;
    const findCmd = `du -ab /opt/render/project/src 2>/dev/null | sort -rn | head -n 21 | tail -n +2`;

    exec(`${dfCmd} && echo "---SEP---" && ${duCmd} && echo "---SEP---" && ${inodeCmd} && echo "---SEP---" && ${findCmd}`, (error, stdout) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to execute system commands' });
        }

        try {
            const parts = stdout.split('---SEP---\n');
            
            const diskStats = parts[0].trim().split(' ');
            const totalBytes = parseInt(diskStats[0]) || 0;
            const usedBytes = parseInt(diskStats[1]) || 0;
            const freeBytes = parseInt(diskStats[2]) || 0;

            const appBytes = parseInt(parts[1].trim()) || 0;
            const otherUsedBytes = Math.max(0, usedBytes - appBytes);

            const inodeStats = parts[2].trim().split(' ');
            const inodeTotal = parseInt(inodeStats[0]) || 0;
            const inodeUsed = parseInt(inodeStats[1]) || 0;
            const inodeFree = parseInt(inodeStats[2]) || 0;

            const fileLines = parts[3].trim().split('\n').filter(line => line);
            const files = fileLines.map(line => {
                const tabIndex = line.indexOf('\t');
                const size = parseInt(line.substring(0, tabIndex));
                const fullPath = line.substring(tabIndex + 1);
                const shortPath = fullPath.replace('/opt/render/project/src/', '');
                const pathParts = shortPath.split('/');
                const isFolder = !pathParts[pathParts.length - 1].includes('.');
                
                return { size, path: shortPath, isFolder };
            });

            res.json({
                disk: { totalBytes, usedBytes, freeBytes },
                inodes: { total: inodeTotal, used: inodeUsed, free: inodeFree },
                appSize: appBytes,
                otherUsed: otherUsedBytes,
                files
            });

        } catch (err) {
            console.error("Parse error:", err);
            res.status(500).json({ error: 'Failed to parse system data' });
        }
    });
});

// Helper for asynchronous exec
const execPromise = (cmd) => new Promise((resolve) => {
    exec(cmd, (error, stdout) => resolve(stdout || ''));
});

// --- RAW TERMINAL COMMANDS ROUTE ---
app.get('/api/system/raw-storage', verifyToken, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const appPath = '/opt/render/project/src';

        const dfH = await execPromise('df -h');
        const dfI = await execPromise('df -i');
        const duSh = await execPromise(`du -sh ${appPath}/* 2>/dev/null`);
        const duSort = await execPromise(`du -ah ${appPath} 2>/dev/null | sort -rh | head -n 15`);
        const findLarge = await execPromise(`find ${appPath} -type f -size +10M -exec ls -lh {} + 2>/dev/null`);

        res.json({ dfH, dfI, duSh, duSort, findLarge });
    } catch (error) {
        res.status(500).json({ error: 'Failed to execute terminal commands' });
    }
});

// ==========================================
// WEEK 3: PRODUCT & INVENTORY MANAGEMENT
// ==========================================

// Get Products (Super Admin sees all, Admin sees only their branch)
app.get('/api/products', verifyToken, async (req, res) => {
    let sql = `
        SELECT p.*, b.branch_name 
        FROM products p 
        JOIN branches b ON p.branch_id = b.id
    `;
    let params = [];

    // If the user is an Admin, restrict them to their assigned branch
    if (req.user.role === 'admin') {
        sql += ' WHERE p.branch_id = ?';
        params.push(req.user.branch_id);
    } else if (req.user.role === 'staff') {
        // Staff can only see products for their branch
        sql += ' WHERE p.branch_id = ?';
        params.push(req.user.branch_id);
    }
    
    sql += ' ORDER BY p.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Add a New Product (Super Admin and Admin only)
app.post('/api/products', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    const { name, sku, category, price, stock_quantity } = req.body;
    
    // Super Admin can select a branch. Admin is forced to their own branch.
    const branch_id = req.user.role === 'super_admin' ? req.body.branch_id : req.user.branch_id;

    if (!branch_id) {
        return res.status(400).json({ message: 'Branch ID is required.' });
    }

    const sql = 'INSERT INTO products (branch_id, name, sku, category, price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [branch_id, name, sku, category, price, stock_quantity], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'SKU already exists' });
            return res.status(500).json({ error: err.message });
        }
        logAction(req.user.id, 'ADD_PRODUCT', `Added product ${name} (SKU: ${sku}).`);
        res.status(201).json({ message: 'Product added successfully!', productId: result.insertId });
    });
});

// Update Stock Quantity (Admins and Staff can do this)
app.put('/api/products/:id/stock', verifyToken, (req, res) => {
    const { stock_quantity } = req.body;
    const productId = req.params.id;

    const sql = 'UPDATE products SET stock_quantity = ? WHERE id = ?';
    db.query(sql, [stock_quantity, productId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Stock updated successfully.' });
    });
});

// ==========================================
// WEEK 4: MERCHANDISING TRANSACTIONS
// ==========================================

// Get Transaction History
app.get('/api/transactions', verifyToken, (req, res) => {
    let sql = `
        SELECT t.*, p.name AS product_name, u.username AS cashier_name, b.branch_name
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        JOIN users u ON t.user_id = u.id
        JOIN branches b ON t.branch_id = b.id
    `;
    let params = [];

    // Filter by branch if not Super Admin
    if (req.user.role !== 'super_admin') {
        sql += ' WHERE t.branch_id = ?';
        params.push(req.user.branch_id);
    }
    sql += ' ORDER BY t.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Process a New Transaction (Sale or Restock)
app.post('/api/transactions', verifyToken, requireRole(['super_admin', 'admin', 'staff']), (req, res) => {
    const { product_id, quantity, transaction_type } = req.body;
    const user_id = req.user.id;
    const branch_id = req.user.branch_id; // Staff/Admin are locked to their branch

    // Super admin processing for a specific branch would need branch_id in req.body, 
    // but for simplicity, let's assume Super Admin uses the app like a staff member for now.

    if (!branch_id) return res.status(400).json({ message: 'User is not assigned to a branch.' });

    // 1. Get the current product price and stock
    db.query('SELECT price, stock_quantity FROM products WHERE id = ? AND branch_id = ?', [product_id, branch_id], (err, productResults) => {
        if (err) return res.status(500).json({ error: err.message });
        if (productResults.length === 0) return res.status(404).json({ message: 'Product not found in this branch.' });

        const product = productResults[0];
        let newStock = product.stock_quantity;
        let total_price = 0;

        // 2. Calculate new stock and total price
        if (transaction_type === 'SALE') {
            if (product.stock_quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient stock for this sale.' });
            }
            newStock -= quantity;
            total_price = product.price * quantity;
        } else if (transaction_type === 'RESTOCK') {
            newStock += quantity;
            total_price = product.price * quantity; // Cost of restocking
        }

        // 3. Use SQL Transaction (Atomic operation) to update stock and insert record
        db.beginTransaction((err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Update Product Stock
            db.query('UPDATE products SET stock_quantity = ? WHERE id = ?', [newStock, product_id], (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json({ error: err.message }));
                }

                // Insert Transaction Record
                const insertSql = 'INSERT INTO transactions (branch_id, product_id, user_id, quantity, transaction_type, total_price) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(insertSql, [branch_id, product_id, user_id, quantity, transaction_type, total_price], (err) => {
                    if (err) {
                        return db.rollback(() => res.status(500).json({ error: err.message }));
                    }
                    
                    // Commit both changes to the database
                    db.commit((err) => {
                        if (err) return db.rollback(() => res.status(500).json({ error: err.message }));
                        res.status(201).json({ message: 'Transaction processed successfully!' });
                    });
                });
            });
        });
    });
});

// ==========================================
// WEEK 5: DASHBOARD ANALYTICS & REPORTS
// ==========================================

// 1. Get Dashboard Summary Stats
app.get('/api/dashboard/stats', verifyToken, (req, res) => {
    const branchFilter = req.user.role === 'super_admin' ? '' : ' AND branch_id = ?';
    const params = req.user.role === 'super_admin' ? [] : [req.user.branch_id];

    const statsSql = `
        SELECT 
            (SELECT COUNT(*) FROM products WHERE 1=1 ${branchFilter}) AS total_products,
            (SELECT COUNT(*) FROM products WHERE stock_quantity <= 10 ${branchFilter}) AS low_stock_count,
            (SELECT IFNULL(SUM(total_price), 0) FROM transactions WHERE transaction_type = 'SALE' AND DATE(created_at) = CURDATE() ${branchFilter}) AS todays_sales,
            (SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURDATE() ${branchFilter}) AS todays_transactions
    `;

    db.query(statsSql, [...params, ...params, ...params, ...params], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
});

// 2. Get Analytics for Charts
app.get('/api/dashboard/analytics', verifyToken, (req, res) => {
    const branchFilter = req.user.role === 'super_admin' ? '' : ' AND t.branch_id = ?';
    const params = req.user.role === 'super_admin' ? [] : [req.user.branch_id];

    // Top 5 Selling Products
    const topProductsSql = `
        SELECT p.name, SUM(t.quantity) as total_sold 
        FROM transactions t JOIN products p ON t.product_id = p.id 
        WHERE t.transaction_type = 'SALE' ${branchFilter}
        GROUP BY p.id ORDER BY total_sold DESC LIMIT 5
    `;

    // Sales Trend (Last 7 Days)
    const salesTrendSql = `
        SELECT DATE(created_at) as date, SUM(total_price) as revenue 
        FROM transactions 
        WHERE transaction_type = 'SALE' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ${branchFilter}
        GROUP BY DATE(created_at) ORDER BY date ASC
    `;

    db.query(topProductsSql, params, (err, topProducts) => {
        if (err) return res.status(500).json({ error: err.message });
        
        db.query(salesTrendSql, params, (err, salesTrend) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ topProducts, salesTrend });
        });
    });
});

// 3. Get Filtered Reports
app.get('/api/reports/transactions', verifyToken, (req, res) => {
    const { startDate, endDate } = req.query;
    let sql = `
        SELECT t.*, p.name AS product_name, u.username AS cashier_name, b.branch_name
        FROM transactions t
        JOIN products p ON t.product_id = p.id
        JOIN users u ON t.user_id = u.id
        JOIN branches b ON t.branch_id = b.id
        WHERE t.created_at BETWEEN ? AND ?
    `;
    let params = [`${startDate} 00:00:00`, `${endDate} 23:59:59`];

    if (req.user.role !== 'super_admin') {
        sql += ' AND t.branch_id = ?';
        params.push(req.user.branch_id);
    }
    sql += ' ORDER BY t.created_at DESC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==========================================
// WEEK 6: SYSTEM AUDIT TRAIL & ANALYTICS
// ==========================================

// Helper function to log actions
const logAction = (userId, action, details) => {
    const sql = 'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)';
    db.query(sql, [userId, action, details], (err) => {
        if (err) console.error("Failed to write audit log:", err);
    });
};

// Get Audit Logs (Super Admin Only)
app.get('/api/audit-logs', verifyToken, requireRole(['super_admin']), (req, res) => {
    const sql = `
        SELECT a.*, u.username 
        FROM audit_logs a 
        LEFT JOIN users u ON a.user_id = u.id 
        ORDER BY a.created_at DESC LIMIT 100
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get Branch Analytics (Super Admin Only)
app.get('/api/analytics/branches', verifyToken, requireRole(['super_admin']), (req, res) => {
    const sql = `
        SELECT b.branch_name, IFNULL(SUM(t.total_price), 0) as total_revenue, COUNT(t.id) as total_transactions
        FROM branches b
        LEFT JOIN transactions t ON b.id = t.branch_id AND t.transaction_type = 'SALE'
        GROUP BY b.id
        ORDER BY total_revenue DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==========================================
// USER PROFILE MANAGEMENT
// ==========================================

// Get Current User Profile
app.get('/api/users/profile/me', verifyToken, (req, res) => {
    const sql = 'SELECT id, username, email, role, contact_number, profile_picture, branch_id FROM users WHERE id = ?';
    db.query(sql, [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(results[0]);
    });
});

// Update Profile
app.put('/api/users/profile/me', verifyToken, async (req, res) => {
    const { username, email, contact_number, profile_picture, password } = req.body;
    const userId = req.user.id;

    try {
        let sql = 'UPDATE users SET username = ?, email = ?, contact_number = ?, profile_picture = ?';
        let params = [username, email, contact_number, profile_picture];

        // If the user provided a new password, hash it and add to query
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            sql += ', password_hash = ?';
            params.push(hashedPassword);
        }

        sql += ' WHERE id = ?';
        params.push(userId);

        db.query(sql, params, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Username or Email already in use.' });
                return res.status(500).json({ error: err.message });
            }
            
            logAction(userId, 'UPDATE_PROFILE', `User updated their profile details.`);
            
            // Return the updated user data so frontend can update localStorage
            db.query('SELECT id, username, email, role, contact_number, profile_picture, branch_id FROM users WHERE id = ?', [userId], (err, results) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ message: 'Profile updated successfully!', user: results[0] });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error while updating profile' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});