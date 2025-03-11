const express = require('express');
const router = express.Router();
const Stem = require('../models/Stem');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // ✅ Ensure this is correctly imported
const upload = require('../middleware/upload'); // ✅ Import the Cloudinary upload middleware

router.post('/upload', upload.single('stemFile'), async (req, res) => {
    try {
      console.log("📩 Incoming Upload Request:", req.body);
      console.log("📂 Uploaded File Data:", req.file);
  
      if (!req.file) {
        console.error("❌ No file received in request!");
        return res.status(400).json({ error: "No file uploaded" });
      }
  
      // Create new stem entry in database
      const newStem = new Stem({
        identifier: req.body.identifier,
        artist: req.body.artist,
        type: req.body.type,
        bpm: req.body.bpm,
        key: req.body.key,
        fileUrl: req.file.path // Cloudinary File URL
      });
  
      await newStem.save();
      console.log("✅ Stem saved successfully:", JSON.stringify(newStem, null, 2));
      res.json({ message: "Stem uploaded successfully!", stem: newStem });
  
    } catch (error) {
      console.error("❌ Upload Error:", JSON.stringify(error, null, 2));
      res.status(500).json({ error: "Server error", details: error.message });
    }
  });
  
  

// ✅ Route: Scan QR Code to Collect Stem
router.post('/scan', authMiddleware, async (req, res) => {
    try {
        console.log("📩 Incoming request for /scan:", req.headers);
        console.log("👤 Extracted User from Token:", req.user);

        if (!req.user || !req.user.id) {
            console.error("❌ Token exists, but req.user.id is undefined!");
            return res.status(401).json({ error: "Invalid user ID in token" });
        }

        const userId = req.user.id;
        console.log("✅ User ID Extracted:", userId);

        const { qrIdentifier } = req.body;

        // ✅ Find the stem using the identifier
        const stem = await Stem.findOne({ identifier: qrIdentifier });
        if (!stem) {
            return res.status(404).json({ error: "Stem not found" });
        }

        // ✅ Fetch user
        const user = await User.findById(userId);
        if (!user) {
            console.error("❌ User not found in database!");
            return res.status(404).json({ error: "User not found" });
        }

        // ✅ Ensure the `stems` array expects ObjectIds
        const stemId = stem._id.toString(); // Convert ObjectId to string if needed

        // ✅ Check if user already has the stem
        if (user.stems.includes(stemId)) {
            console.warn(`⚠️ User ${user.username} already has the stem '${qrIdentifier}'!`);
            return res.status(400).json({ error: "You already have this stem" });
        }

        // ✅ Push the ObjectId of the stem
        user.stems.push(stem._id);
        await user.save();

        console.log("✅ Stem added to user:", user.username, user.stems);

        res.json({
            message: `Stem '${stem.identifier}' collected successfully!`,
            userStems: user.stems
        });

    } catch (err) {
        console.error("❌ Error in /scan:", err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;