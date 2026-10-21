const jwt = require('jsonwebtoken');

// Middleware to verify JWT tokens
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = verified; // Contains { id, role, branch_id }
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid Token' });
    }
};

// Middleware to check specific roles (e.g., only Admin can create branches)
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' });
        }
        next();
    };
};

module.exports = { verifyToken, requireRole };