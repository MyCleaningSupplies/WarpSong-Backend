const express = require("express");
const router = express.Router();
const Mashup = require("../models/Mashup");
const User = require("../models/User");  // Require the User model
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Save a new mashup
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { name, stemIds, isPublic } = req.body;
    const userId = req.user.id;  // Correct variable name

    if (!name || !stemIds.length) {
      return res.status(400).json({ error: "Mashup name and stems required" });
    }

    const qrCodeId = Math.random().toString(36).substr(2, 8); // Generate unique QR code

    const mashup = new Mashup({
      user: userId, // Assign the user ID
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

    res.json({ message: "Mashup saved!", mashup });
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
