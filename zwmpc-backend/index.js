const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

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

// --- REGISTRATION ROUTE ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'User registered successfully!' });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// --- LOGIN ROUTE ---
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    
    db.query(sql, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate Token
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
});

// ... [Keep all your existing imports and db setup] ...
const { verifyToken, requireRole } = require('./middleware'); // ADD THIS

// Update your LOGIN route to include branch_id in the token!
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Include branch_id and role in the token
        const token = jwt.sign(
            { id: user.id, role: user.role, branch_id: user.branch_id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        res.json({ 
            token, 
            user: { id: user.id, username: user.username, role: user.role, branch_id: user.branch_id } 
        });
    });
});

// --- BRANCH MANAGEMENT ROUTES ---

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

// --- ADVANCED ADMIN SYSTEM STORAGE MONITOR ---
app.get('/api/system/storage', verifyToken, requireRole(['admin']), (req, res) => {
    // 1. Get Total, Used, and Free space in bytes
    const dfCmd = `df -B1 / | tail -1 | awk '{print $2, $3, $4}'`;
    
    // 2. Get the size of just your application files in bytes
    const duCmd = `du -sb /opt/render/project/src 2>/dev/null | awk '{print $1}'`;
    
    // 3. Get top 20 largest files: Size (bytes) | Path | Date Modified
    const findCmd = `find /opt/render/project/src -type f -printf '%s|%p|%TY-%Tm-%Td %TH:%TM\\n' 2>/dev/null | sort -rn | head -n 20`;

    // Run all commands
    exec(`${dfCmd} && echo "---SEP---" && ${duCmd} && echo "---SEP---" && ${findCmd}`, (error, stdout, stderr) => {
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
            const otherUsedBytes = usedBytes - appBytes;

            // Parse File List
            const fileLines = parts[2].trim().split('\n').filter(line => line);
            const files = fileLines.map(line => {
                const [size, fullPath, modified] = line.split('|');
                // Clean up the path so it looks like the screenshot (e.g. "backups/file.sql")
                const shortPath = fullPath.replace('/opt/render/project/src/', '');
                return { size: parseInt(size), path: shortPath, modified };
            });

            res.json({
                disk: { totalBytes, usedBytes, freeBytes },
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));