const router = require("express").Router();
const multer = require("multer");
const Stem = require("../models/Stem");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const cloudinary = require("cloudinary").v2;

// ✅ Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer Storage Setup (for file uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Helper Function to Upload to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "video", folder: "warpSong_stems" },
      (error, result) => {
        if (error) {
          console.error("❌ Cloudinary upload error:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer); // Send file buffer to Cloudinary
  });
};

// ✅ Get all stems
router.get("/get-stems", authMiddleware, async (req, res) => {
    try {
      console.log("✅ API hit: /get-stems"); // Debugging log
      const stems = await Stem.find({});
      res.json(stems);
    } catch (error) {
      console.error("❌ Error fetching stems:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  router.post("/add-stem", authMiddleware, upload.single("file"), async (req, res) => {
    try {
      const { identifier, artist, bpm, key, type, name } = req.body;
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
      // Capitalize first letter of type
      const formattedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  
      console.log("✅ Received stem data:", {
        identifier,
        artist,
        bpm,
        key,
        type: formattedType,
        name
      });
  
      // 🔍 Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
      console.log("✅ Cloudinary Upload Success:", cloudinaryResult.secure_url);
  
      // 🔍 Save to MongoDB
      const newStem = new Stem({
        identifier,
        artist,
        bpm,
        key,
        type: formattedType,
        name,
        fileUrl: cloudinaryResult.secure_url,
      });
  
      await newStem.save();
      console.log("✅ Stem saved to MongoDB:", newStem);
  
      res.status(201).json(newStem);
    } catch (error) {
      console.error("❌ Error uploading stem:", error);
      res.status(500).json({ 
        error: "Server error", 
        details: error.message 
      });
    }
  });
  
// Add this new route for deleting stems
// Update the delete-stem route
router.delete('/delete-stem/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      console.log("❌ Unauthorized delete attempt by user:", req.user.id);
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }

    const stemId = req.params.id;
    
    // Find the stem to get its Cloudinary public_id
    const stem = await Stem.findById(stemId);
    
    if (!stem) {
      return res.status(404).json({ error: "Stem not found" });
    }
    
    // Delete from Cloudinary if fileUrl exists
    if (stem.fileUrl) {
      try {
        // Extract public_id from the Cloudinary URL
        const publicId = stem.fileUrl.split('/').pop().split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(`warpSong_stems/${publicId}`, { resource_type: 'video' });
          console.log(`✅ Deleted file from Cloudinary: ${publicId}`);
        }
      } catch (cloudinaryError) {
        console.error("❌ Error deleting from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }
    
    // Delete from database
    await Stem.findByIdAndDelete(stemId);
    
    // Also remove references to this stem from all users
    await User.updateMany(
      { stems: stemId },
      { $pull: { stems: stemId } }
    );
    
    console.log(`✅ Stem deleted successfully: ${stemId}`);
    res.json({ message: "Stem deleted successfully" });
    
  } catch (error) {
    console.error("❌ Error deleting stem:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;