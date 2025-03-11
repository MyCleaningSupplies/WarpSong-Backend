const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // No auth header, continue without setting req.user
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      // No token, continue without setting req.user
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user ID if token is valid
    req.user = { id: decoded.id };
    console.log("✅ Optional Auth: User ID assigned to req.user:", req.user);
    
    next();
  } catch (err) {
    // Invalid token, continue without setting req.user
    console.log("⚠️ Optional Auth: Invalid token, continuing as unauthenticated");
    next();
  }
};
