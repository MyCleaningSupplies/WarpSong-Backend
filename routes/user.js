const router = require("express").Router();
const User = require("../models/User");
const Stem = require("../models/Stem");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer');
const fs = require('fs');
const path = require('path');

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

module.exports = router;
