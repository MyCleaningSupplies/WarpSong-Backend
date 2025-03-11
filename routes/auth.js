const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// ✅ Register endpoint (ensures username is always lowercase)
router.post('/register', async (req, res) => {
  try {
    let { username, password, qrCodeId } = req.body;

    // Convert username to lowercase for consistency
    username = username.toLowerCase();

    // Check if user or QR already exists
    const existingUser = await User.findOne({ $or: [{ username }, { qrCodeId }] });
    if (existingUser) {
      return res.status(400).json({ error: "User or QR already exists" });
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, qrCodeId });
    await user.save();

    res.json({ message: "User created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Login endpoint (Fixed undefined username issue)
router.post('/login', async (req, res) => {
    try {
      let { username, password } = req.body;
  
      // 🔥 Check if username exists before using toLowerCase()
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
  
      // Convert username to lowercase before searching in DB
      username = username.toLowerCase();
  
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
  
      // Validate password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Incorrect password" });
      }
  
      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
  
      res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });

module.exports = router;