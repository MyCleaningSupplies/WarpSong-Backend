// routes/qrcode.js
const express = require("express");
const router = express.Router();
const Stem = require("../models/Stem");
const User = require("../models/User");
const jwt = require("jsonwebtoken"); // Make sure to import jwt

// Lookup a QR code - public endpoint that works differently for logged-in users
router.get("/lookup", async (req, res) => {
  try {
    const { qrCodeId } = req.query;
    
    if (!qrCodeId) {
      return res.status(400).json({ error: "QR Code ID is required" });
    }
    
    console.log(`🔍 Looking up QR code: ${qrCodeId}`);
    
    // Find the stem associated with this QR code
    const stem = await Stem.findOne({ identifier: qrCodeId });
    
    if (!stem) {
      console.log(`❌ QR Code not found: ${qrCodeId}`);
      return res.status(404).json({ error: "QR Code not recognized" });
    }
    
    // Check if this QR code has been claimed by any user
    const existingClaim = await User.findOne({ qrCodeId });
    const isQrClaimed = !!existingClaim;
    
    // Get user information if token is provided
    let user = null;
    const token = req.headers.authorization?.split(" ")[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id);
      } catch (err) {
        // Token invalid, but we'll still return stem info
        console.log("Invalid token provided, continuing as guest");
      }
    }
    
    // Return different responses based on authentication status
    if (user) {
      // For logged-in users, include whether they already have this stem
      const hasStem = user.stems.includes(stem._id);
      
      // Check if this user is the one who claimed the QR code
      const isClaimedByUser = isQrClaimed && existingClaim._id.toString() === user._id.toString();
      
      return res.json({
        stem: {
          stemId: stem._id,
          name: stem.name,
          artist: stem.artist,
          type: stem.type,
          bpm: stem.bpm,
          key: stem.key,
          fileUrl: stem.fileUrl
        },
        userHasStem: hasStem,
        isAuthenticated: true,
        isQrClaimed,
        isClaimedByUser
      });
    } else {
      // For non-authenticated users, just return stem info
      return res.json({
        stem: {
          stemId: stem._id,
          name: stem.name,
          artist: stem.artist,
          type: stem.type,
          bpm: stem.bpm,
          key: stem.key
          // Don't include fileUrl for non-authenticated users
        },
        isAuthenticated: false,
        isQrClaimed
      });
    }
  } catch (err) {
    console.error("❌ Error looking up QR code:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
