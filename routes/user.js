const router = require("express").Router();
const User = require("../models/User");
const Stem = require("../models/Stem");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Add a stem to user's collection
router.post("/add-stem", authMiddleware, async (req, res) => {
    try {
      const { stemId } = req.body;
      
      if (!stemId) {
        return res.status(400).json({ error: "Stem ID is required" });
      }
      
      // Find the user
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if stem exists
      const stem = await Stem.findById(stemId);
      if (!stem) {
        return res.status(404).json({ error: "Stem not found" });
      }
      
      // Check if user already has this stem
      if (user.stems.includes(stemId)) {
        return res.status(400).json({ error: "Stem already in collection" });
      }
      
      // Add stem to user's collection
      user.stems.push(stemId);
      await user.save();
      
      console.log(`✅ Added stem ${stemId} to user ${user.username}'s collection`);
      
      res.json({
        message: "Stem added to collection",
        user: {
          id: user._id,
          stems: user.stems
        }
      });
    } catch (err) {
      console.error("❌ Error adding stem to collection:", err);
      res.status(500).json({ error: "Server error" });
    }
  });
  

router.get("/my-stems", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("stems");
        if (!user) return res.status(404).json({ error: "User not found" });

        console.log("✅ User's stems:", user.stems);
        res.json(user.stems);
    } catch (error) {
        console.error("❌ Error fetching stems:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Route for uploading user profile photo
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    console.log("📸 Photo upload request received", req.body);
    
    if (!req.file) {
      console.log("❌ No file uploaded");
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.body.userId;
    if (!userId) {
      console.log("❌ No user ID provided");
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`🔍 Looking for user with ID: ${userId}`);
    
    // Find user and update photo field
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User with ID ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Save the file path relative to the server
    const photoUrl = `/uploads/${req.file.filename}`;
    user.photo = photoUrl;
    await user.save();

    console.log(`✅ Photo uploaded successfully for user ${user.username}: ${photoUrl}`);
    
    res.json({ 
      message: 'Photo uploaded successfully', 
      photoUrl: photoUrl 
    });
  } catch (err) {
    console.error('❌ Error uploading photo:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Get User Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
      const user = await User.findById(req.user.id).populate("stems");
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json({
          username: user.username,
          level: user.level,
          xp: user.xp,
          streak: user.streak,
          rank: user.rank,
          achievements: user.achievements,
          stemsCollected: user.stems.length,
          createdAt: user.createdAt
      });
  } catch (error) {
      console.error("❌ Error fetching profile:", error);
      res.status(500).json({ error: "Server error" });
  }
});

router.post("/daily-login", authMiddleware, async (req, res) => {
  try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });

      const today = new Date().setHours(0, 0, 0, 0);
      const lastLogin = user.lastLogin ? new Date(user.lastLogin).setHours(0, 0, 0, 0) : null;

      if (lastLogin && today === lastLogin) {
          return res.json({ message: "Already logged in today!", streak: user.streak });
      }

      if (lastLogin && today - lastLogin === 86400000) {
          user.streak += 1; // ✅ Increase streak if logged in on consecutive days
      } else {
          user.streak = 1; // ✅ Reset streak if missed a day
      }

      user.lastLogin = new Date();
      await user.save();

      res.json({ message: "Daily streak updated!", streak: user.streak });
  } catch (error) {
      console.error("❌ Error updating streak:", error);
      res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
