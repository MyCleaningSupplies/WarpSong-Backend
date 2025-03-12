// routes/gamification.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Mashup = require("../models/Mashup");
const authMiddleware = require("../middleware/authMiddleware");

// Level thresholds configuration
const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4000, 6000, 8500, 11500, 15000, 20000];

// Achievement definitions
const ACHIEVEMENTS = {
  MASHUP_MASTER: 'mashup_master',
  COLLAB_KING: 'collab_king',
  STEM_COLLECTOR: 'stem_collector',
  REMIX_ADDICT: 'remix_addict',
  STREAK_MASTER: 'streak_master'
};

// Get user's gamification stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Calculate current level XP and next level XP for progress bar
    const currentLevelXP = user.level > 1 ? LEVEL_THRESHOLDS[user.level - 1] : 0;
    const nextLevelXP = LEVEL_THRESHOLDS[user.level] || LEVEL_THRESHOLDS[user.level - 1];
    
    console.log(`✅ Fetched gamification stats for user ${user.username}`);
    
    res.json({
      xp: user.xp,
      level: user.level,
      currentLevelXP,
      nextLevelXP,
      streak: user.streak,
      achievements: user.achievements || []
    });
  } catch (error) {
    console.error("❌ Error fetching gamification stats:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update XP
router.post("/update-xp", authMiddleware, async (req, res) => {
  try {
    const { action, amount = 0 } = req.body;
    
    // Define XP values for different actions
    const XP_VALUES = {
      'scan_qr': 50,
      'save_mashup': 100,
      'join_session': 25,
      'contribute_stem': 75,
      'receive_like': 10,
      'custom': amount
    };
    
    if (!action || !XP_VALUES[action]) {
      return res.status(400).json({ error: "Invalid action" });
    }
    
    const xpToAdd = action === 'custom' ? amount : XP_VALUES[action];
    
    // Get user and current level
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const oldLevel = user.level;
    
    // Update XP
    user.xp += xpToAdd;
    
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
    
    const leveledUp = newLevel > oldLevel;
    
    console.log(`✅ User ${user.username} earned ${xpToAdd} XP for ${action}. New XP: ${user.xp}, Level: ${user.level}`);
    
    res.json({
      xp: user.xp,
      level: user.level,
      leveledUp,
      xpGained: xpToAdd
    });
  } catch (error) {
    console.error("❌ Error updating XP:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Check and update achievements
router.post("/check-achievements", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Initialize achievements array if it doesn't exist
    if (!user.achievements) {
      user.achievements = [];
    }
    
    const newAchievements = [];
    
    // Check Mashup Master achievement (10 mashups)
    const mashupCount = await Mashup.countDocuments({ user: req.user.id });
    if (mashupCount >= 10 && !user.achievements.includes(ACHIEVEMENTS.MASHUP_MASTER)) {
      user.achievements.push(ACHIEVEMENTS.MASHUP_MASTER);
      newAchievements.push(ACHIEVEMENTS.MASHUP_MASTER);
    }
    
    // Check Stem Collector achievement (20 stems)
    if (user.stems.length >= 20 && !user.achievements.includes(ACHIEVEMENTS.STEM_COLLECTOR)) {
      user.achievements.push(ACHIEVEMENTS.STEM_COLLECTOR);
      newAchievements.push(ACHIEVEMENTS.STEM_COLLECTOR);
    }
    
    // Note: You'll need to implement session and play tracking for the other achievements
    
    await user.save();
    
    if (newAchievements.length > 0) {
      console.log(`✅ User ${user.username} earned new achievements: ${newAchievements.join(', ')}`);
    }
    
    res.json({
      achievements: user.achievements,
      newAchievements
    });
  } catch (error) {
    console.error("❌ Error checking achievements:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get leaderboard
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find({})
      .select('username level xp streak')
      .sort({ xp: -1 })
      .limit(10);
    
    console.log("✅ Fetched leaderboard data");
    
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching leaderboard:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
