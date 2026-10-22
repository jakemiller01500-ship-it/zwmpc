const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const { verifyToken, requireRole } = require('./middleware');

require('dotenv').config();

const app = express();
app.use(cors({
    origin: 'https://zwmpc.vercel.app' 
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
    
    // Super Admin check (still enforce only one)
    if (role === 'super_admin') {
        db.query('SELECT id FROM users WHERE role = "super_admin"', async (err, results) => {
            if (results.length > 0) return res.status(400).json({ message: 'A Super Admin already exists.' });
            proceed();
        });
    } else { proceed(); }

    async function proceed() {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
            if (results.length > 0) return res.status(400).json({ message: 'Email already in use' });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Notice: is_approved is set to FALSE by default, branch_id is NULL
            const sql = 'INSERT INTO users (username, email, password_hash, role, is_approved) VALUES (?, ?, ?, ?, FALSE)';
            db.query(sql, [username, email, hashedPassword, role], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ message: 'Registration successful! Please wait for Admin approval.' });
            });
        });
    }
});

// --- UPDATED LOGIN (Check Approval) ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // CHECK APPROVAL STATUS
        if (!user.is_approved) {
            return res.status(403).json({ message: 'Account pending approval. Please contact your administrator.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role, branch_id: user.branch_id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, branch_id: user.branch_id } });
    });
});

// --- GET PENDING USERS (For Super Admin & Admin) ---
app.get('/api/users/pending', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    let sql = 'SELECT id, username, email, role, created_at FROM users WHERE is_approved = FALSE';
    let params = [];

    // If an Admin logs in, only show pending users (they haven't been assigned a branch yet by SA)
    if (req.user.role === 'admin') {
        // In this logic, admins see users who requested to be staff, but we'll let Super Admin assign the branch
        // For simplicity, admins see all unapproved users too, but Super Admin is the only one who can assign branches.
        // You can customize this to filter by branch if you add "requested_branch_id" to registration.
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- APPROVE/REJECT USER ---
app.post('/api/users/approve', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    const { user_id, branch_id } = req.body;
    
    let sql = 'UPDATE users SET is_approved = TRUE, branch_id = ? WHERE id = ?';
    
    // Super Admin can assign a branch. Admin can only approve users for their OWN branch.
    if (req.user.role === 'admin') {
        sql = 'UPDATE users SET is_approved = TRUE, branch_id = ? WHERE id = ?';
        branch_id = req.user.branch_id; // Force the Admin's branch ID
    }

    db.query(sql, [branch_id || null, user_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User approved successfully.' });
    });
});

app.delete('/api/users/reject/:id', verifyToken, requireRole(['super_admin', 'admin']), (req, res) => {
    const sql = 'DELETE FROM users WHERE id = ? AND is_approved = FALSE';
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User request rejected and deleted.' });
    });
});

// --- BRANCH MANAGEMENT ROUTES ---
// --- PUBLIC ROUTE TO FETCH BRANCHES FOR REGISTRATION ---
app.get('/api/public/branches', (req, res) => {
    db.query('SELECT id, branch_name FROM branches', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Create a Branch (Only Admins)
app.post('/api/branches', verifyToken, requireRole(['admin']), (req, res) => {
    const { branch_name, location } = req.body;
    const sql = 'INSERT INTO branches (branch_name, location) VALUES (?, ?)';
    
    db.query(sql, [branch_name, location], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Branch created successfully', branchId: result.insertId });
    });
});

// Get All Branches (Admin, Manager, Staff can view)
app.get('/api/branches', verifyToken, (req, res) => {
    db.query('SELECT * FROM branches', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// --- ADVANCED ADMIN SYSTEM STORAGE MONITOR (WITH INODES & FOLDERS) ---
app.get('/api/system/storage', verifyToken, requireRole(['admin']), (req, res) => {
    // 1. Get Disk Space (Total, Used, Free)
    const dfCmd = `df -B1 / | tail -1 | awk '{print $2, $3, $4}'`;
    
    // 2. Get App Size (Bytes)
    const duCmd = `du -sb /opt/render/project/src 2>/dev/null | awk '{print $1}'`;
    
    // 3. Get Inode Usage (Total, Used, Free)
    const inodeCmd = `df -i / | tail -1 | awk '{print $1, $2, $3}'`;
    
    // 4. Get Top 20 Largest Files AND Folders (excluding the root 'src' folder itself)
    const findCmd = `du -ab /opt/render/project/src 2>/dev/null | sort -rn | head -n 21 | tail -n +2`;

    exec(`${dfCmd} && echo "---SEP---" && ${duCmd} && echo "---SEP---" && ${inodeCmd} && echo "---SEP---" && ${findCmd}`, (error, stdout) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            return res.status(500).json({ error: 'Failed to execute system commands' });
        }

        try {
            const parts = stdout.split('---SEP---\n');
            
            // Parse Disk Stats
            const diskStats = parts[0].trim().split(' ');
            const totalBytes = parseInt(diskStats[0]) || 0;
            const usedBytes = parseInt(diskStats[1]) || 0;
            const freeBytes = parseInt(diskStats[2]) || 0;

            // Parse App Size
            const appBytes = parseInt(parts[1].trim()) || 0;
            const otherUsedBytes = Math.max(0, usedBytes - appBytes);

            // Parse Inodes
            const inodeStats = parts[2].trim().split(' ');
            const inodeTotal = parseInt(inodeStats[0]) || 0;
            const inodeUsed = parseInt(inodeStats[1]) || 0;
            const inodeFree = parseInt(inodeStats[2]) || 0;

            // Parse File/Folder List
            const fileLines = parts[3].trim().split('\n').filter(line => line);
            const files = fileLines.map(line => {
                const tabIndex = line.indexOf('\t');
                const size = parseInt(line.substring(0, tabIndex));
                const fullPath = line.substring(tabIndex + 1);
                const shortPath = fullPath.replace('/opt/render/project/src/', '');
                // Check if it's likely a folder (no dot in the last segment)
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
app.get('/api/system/raw-storage', verifyToken, requireRole(['admin']), async (req, res) => {
    try {
        // Render's project path
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));