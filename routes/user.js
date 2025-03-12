const router = require("express").Router();
const User = require("../models/User");
const Stem = require("../models/Stem");
const Mashup = require("../models/Mashup");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Level thresholds configuration
const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4000, 6000, 8500, 11500, 15000, 20000];

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

      // Award XP for collecting a stem
      let xpUpdate = null;
      try {
        const oldLevel = user.level;
        user.xp += 50; // 50 XP for collecting a stem
        
        // Check if user leveled up
        let newLevel = oldLevel;
        for (let i = oldLevel; i < LEVEL_THRESHOLDS.length; i++) {
          if (user.xp >= LEVEL_THRESHOLDS[i]) {
            newLevel = i + 1;
          } else {
            break;
          }
        }
        
        user.level = newLevel;
        await user.save();
        
        xpUpdate = {
          xp: user.xp,
          level: user.level,
          leveledUp: newLevel > oldLevel,
          xpGained: 50
        };
        
        console.log(`✅ User ${user.username} earned 50 XP for collecting a stem. New XP: ${user.xp}, Level: ${user.level}`);
      } catch (xpError) {
        console.error("❌ Error updating XP:", xpError);
      }

      console.log(`✅ Added stem ${stemId} to user ${user.username}'s collection`);

      res.json({
        message: "Stem added to collection",
        user: {
          id: user._id,
          stems: user.stems
        },
        gamification: xpUpdate
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

// ✅ Get User Profile with gamification data
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("stems")
      .populate("mashups");

    if (!user) return res.status(404).json({ error: "User not found" });

    // Calculate current level XP and next level XP for progress bar
    const currentLevelXP = user.level > 1 ? LEVEL_THRESHOLDS[user.level - 1] : 0;
    const nextLevelXP = LEVEL_THRESHOLDS[user.level] || LEVEL_THRESHOLDS[user.level - 1];

    res.json({
      username: user.username,
      level: user.level,
      xp: user.xp,
      currentLevelXP,
      nextLevelXP,
      streak: user.streak,
      rank: user.rank,
      achievements: user.achievements || [],
      stems: user.stems,
      mashups: user.mashups,
      stemsCollected: user.stems.length,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Enhanced daily login with rewards
router.post("/daily-login", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().setHours(0, 0, 0, 0);
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).setHours(0, 0, 0, 0) : null;

    if (lastLogin && today === lastLogin) {
      return res.json({ 
        message: "Already logged in today!", 
        streak: user.streak 
      });
    }

    let reward = null;

    if (lastLogin && today - lastLogin === 86400000) {
      user.streak += 1; // ✅ Increase streak if logged in on consecutive days
      
      // Check for streak rewards
      if (user.streak === 3) {
        reward = { 
          type: 'premium_stem', 
          message: 'You unlocked a free premium stem!' 
        };
      } else if (user.streak === 7) {
        // Award 500 XP bonus for 7-day streak
        user.xp += 500;
        reward = { 
          type: 'xp_bonus', 
          amount: 500, 
          message: 'You earned a 500 XP bonus!' 
        };
        
        // Check if user leveled up from the XP bonus
        const oldLevel = user.level;
        let newLevel = oldLevel;
        for (let i = oldLevel; i < LEVEL_THRESHOLDS.length; i++) {
          if (user.xp >= LEVEL_THRESHOLDS[i]) {
            newLevel = i + 1;
          } else {
            break;
          }
        }
        user.level = newLevel;
        
        if (newLevel > oldLevel) {
          reward.levelUp = {
            oldLevel,
            newLevel
          };
        }
      } else if (user.streak === 14) {
        // Award streak master achievement
        if (!user.achievements) {
          user.achievements = [];
        }
        
        if (!user.achievements.includes('streak_master')) {
          user.achievements.push('streak_master');
          reward = { 
            type: 'achievement', 
            achievement: 'streak_master', 
            message: 'You earned the Streak Master badge!' 
          };
        }
      }
    } else {
      user.streak = 1; // ✅ Reset streak if missed a day
    }

    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ User ${user.username} updated daily streak: ${user.streak} days`);
    if (reward) {
      console.log(`✅ User ${user.username} received reward: ${reward.type}`);
    }

    res.json({ 
      message: "Daily streak updated!", 
      streak: user.streak,
      reward
    });
  } catch (error) {
    console.error("❌ Error updating streak:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add this new route to verify admin status
router.get("/verify-admin", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ isAdmin: user.isAdmin || false });
  } catch (error) {
    console.error("Error verifying admin status:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add a simple endpoint to make a user an admin (you should secure this in production)
router.post("/make-admin", async (req, res) => {
  try {
    const { username, secretKey } = req.body;
    
    // Simple security check - you should use a more secure method in production
    if (secretKey !== "warpsong_admin_secret") {
      return res.status(403).json({ error: "Invalid secret key" });
    }
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    user.isAdmin = true;
    await user.save();
    
    console.log(`✅ User ${username} is now an admin`);
    res.json({ message: `User ${username} is now an admin` });
  } catch (error) {
    console.error("❌ Error making user admin:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
