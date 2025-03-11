const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store image in memory before upload
const upload = multer({ storage });

router.post('/register', async (req, res) => {
  try {
    let { username, password, qrCodeId, favoriteGenre, photo } = req.body;

    // Validate required fields
    if (!username) {
      console.log("❌ Missing username!");
      return res.status(400).json({ error: "Username is required" });
    }

    // Convert username to lowercase for consistency
    username = username.toLowerCase();

    console.log("📥 Incoming registration:", { username, qrCodeId, favoriteGenre });

    // First check if username exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log("❌ Username already exists:", existingUsername.username);
      return res.status(400).json({ error: "Username already exists" });
    }

    // Only check for QR code if one is provided
    if (qrCodeId) {
      const existingQR = await User.findOne({ qrCodeId });
      if (existingQR) {
        console.log("❌ QR code already assigned:", qrCodeId);
        return res.status(400).json({ error: "QR code already assigned to another user" });
      }
    }

    // Ensure password exists (Backend validation)
    if (!password) {
      console.log("❌ Missing password!");
      return res.status(400).json({ error: "Password is required" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({ 
      username, 
      password: hashedPassword, 
      qrCodeId, 
      favoriteGenre, 
      photo 
    });

    await user.save();
    console.log("✅ New user created:", user);

    // Generate JWT token - ADD THIS PART
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Include token in response - MODIFY THIS PART
    res.json({ message: "User created successfully", user, token });

  } catch (err) {
    console.error("❌ Server Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Login endpoint
router.post('/login', async (req, res) => {
    try {
      let { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }
  
      // Convert username to lowercase
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