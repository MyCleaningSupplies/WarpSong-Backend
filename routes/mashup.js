const express = require("express");
const router = express.Router();
const Mashup = require("../models/Mashup");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// Level thresholds configuration
const LEVEL_THRESHOLDS = [0, 500, 1200, 2500, 4000, 6000, 8500, 11500, 15000, 20000];

// ✅ Save a new mashup
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { name, stemIds, isPublic } = req.body;
    const userId = req.user.id;

    if (!name || !stemIds.length) {
      return res.status(400).json({ error: "Mashup name and stems required" });
    }

    const qrCodeId = Math.random().toString(36).substr(2, 8); // Generate unique QR code

    const mashup = new Mashup({
      user: userId,
      name,
      stems: stemIds,
      qrCodeId,
      public: isPublic
    });

    await mashup.save();

    // ✅ Add the new mashup to the user's mashups array
    const user = await User.findById(userId);
    if (user) {
      user.mashups.push(mashup._id);
      await user.save();
    } else {
      console.warn(`User with ID ${userId} not found when trying to add mashup.`);
    }

    // ✅ Award XP for saving a mashup
    let xpUpdate = null;
    try {
      // Update XP directly in the database
      const oldLevel = user.level;
      user.xp += 100; // 100 XP for saving a mashup
      
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
        xpGained: 100
      };
      
      console.log(`✅ User ${user.username} earned 100 XP for saving a mashup. New XP: ${user.xp}, Level: ${user.level}`);
    } catch (xpError) {
      console.error("❌ Error updating XP:", xpError);
      // Continue with the response even if XP update fails
    }

    res.json({ 
      message: "Mashup saved!", 
      mashup,
      gamification: xpUpdate
    });
  } catch (error) {
    console.error("❌ Error saving mashup:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Fetch user's mashups
router.get("/my-mashups", authMiddleware, async (req, res) => {
  try {
    const mashups = await Mashup.find({ user: req.user.id }).populate("stems");
    res.json(mashups);
  } catch (error) {
    console.error("❌ Error fetching mashups:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Fetch public mashups
router.get("/public", async (req, res) => {
  try {
    const mashups = await Mashup.find({ public: true }).populate("stems");
    res.json(mashups);
  } catch (error) {
    console.error("❌ Error fetching public mashups:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
