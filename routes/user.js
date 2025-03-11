const router = require("express").Router();
const User = require("../models/User");
const Stem = require("../models/Stem");
const authMiddleware = require("../middleware/authMiddleware");

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

module.exports = router;