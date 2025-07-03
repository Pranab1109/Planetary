import jwt from 'jsonwebtoken'

function authMiddleware(req, res, next) {
    let token;
    console.log("Inside Middleware")
    // Check if Authorization header is present and starts with 'Bearer'
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Extract the token (remove 'Bearer ' prefix)
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ status: 'fail', message: 'Not authenticated. No token provided.' });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        req.userId = decoded.id;

        next();

    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'fail', message: 'Token has expired. Please log in again.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'fail', message: 'Invalid token. Please log in again.' });
        }
        console.error('JWT verification error:', err);
        return res.status(500).json({ status: 'error', message: 'Authentication failed.' });
    }
}

export default authMiddleware;