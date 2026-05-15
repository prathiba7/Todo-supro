const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Token comes in the Authorization header as:
  // "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. No token provided.'
    });
  }

  // Extract just the token part (after "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // This throws if the token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request so route handlers can use it
    req.user = decoded; // { id, email, iat, exp }

    next(); // Continue to the actual route handler
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please login again.' });
    }
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

module.exports = verifyToken;
