const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const User = require('../models/User');
const Stem = require('../models/Stem');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store image in memory before upload
const upload = multer({ storage });

// Update in routes/auth.js
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

    // If QR code is provided, validate it
    if (qrCodeId) {
      // Check if QR code exists in stems
      const stemExists = await Stem.findOne({ identifier: qrCodeId });
      if (!stemExists) {
        console.log("❌ Invalid QR code:", qrCodeId);
        return res.status(400).json({ error: "Invalid QR code" });
      }
      
      // Check if QR code is already assigned to another user
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

    // Create user object
    const userData = {
      username,
      password: hashedPassword,
      favoriteGenre,
      photo
    };
    
    // Only add qrCodeId if it's provided and valid
    if (qrCodeId) {
      userData.qrCodeId = qrCodeId;
      
      // Find the stem associated with this QR code to add to user's collection
      const stem = await Stem.findOne({ identifier: qrCodeId });
      if (stem) {
        userData.stems = [stem._id];
      }
    } else {
      userData.stems = [];
    }

    // Create new user
    const user = new User(userData);
    await user.save();
    console.log("✅ New user created:", user);

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Include token in response
    res.json({ 
      message: "User created successfully", 
      user: {
        id: user._id,
        username: user.username,
        qrCodeId: user.qrCodeId,
        favoriteGenre: user.favoriteGenre,
        stems: user.stems
      }, 
      token 
    });

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