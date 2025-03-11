const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.error("❌ No authorization header found");
      return res.status(401).json({ error: 'No authorization header found' });
    }

    console.log("✅ Auth Header Received:", authHeader);

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error("❌ No token provided");
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log("🔎 Token Extracted:", token);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token Decoded:", decoded);

    // Ensure req.user has id explicitly
    req.user = { id: decoded.id }; // ✅ FIX: Ensuring req.user.id is set properly

    console.log("✅ User ID Assigned to req.user:", req.user);

    next();
  } catch (err) {
    console.error("❌ Token verification failed:", err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};