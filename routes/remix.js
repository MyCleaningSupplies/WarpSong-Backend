const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const RemixSession = require("../models/RemixSession");
const generateSessionCode = require('../utils/generateSessionCode'); // Import the utility function

// Create a new remix session
router.post("/create", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    let sessionCode = generateSessionCode(); // Generate a unique session code

    // Ensure the generated code is unique by checking if it already exists
    while (await RemixSession.exists({ sessionCode })) {
      sessionCode = generateSessionCode();
    }

    const session = await RemixSession.create({
      sessionCode,
      users: [userId],
    });

    console.log(`✅ Session created with code: ${sessionCode}`);
    res.status(200).json({ sessionCode }); // Send the session code back to the client
  } catch (err) {
    console.error("❌ Error in /remix/create:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Join or create a remix session
// Join or create a remix session
router.post("/join", auth, async (req, res) => {
  try {
    const { sessionCode } = req.body;
    const userId = req.user.id;

    let session = await RemixSession.findOne({ sessionCode })
      .populate("users stems.stem");

    if (session) {
      // Add the console log here
      console.log(`Checking if user ${userId} is in session with users:`, 
        session.users.map(u => typeof u === 'object' ? u._id.toString() : u.toString())
      );
      
      // Check if user is already in the session by comparing IDs
      const userExists = session.users.some(user => 
        user._id?.toString() === userId || user.toString() === userId
      );
      
      console.log(`User exists in session: ${userExists}`);
      
      if (!userExists && session.users.length < 4) {
        console.log(`Adding user ${userId} to session ${sessionCode}`);
        session.users.push(userId);
        await session.save();
      } else {
        console.log(`User ${userId} already in session or session full`);
      }
    } else {
      console.log(`Creating new session with code ${sessionCode} for user ${userId}`);
      session = await RemixSession.create({
        sessionCode,
        users: [userId]
      });
    }

    res.json(session);
  } catch (err) {
    console.error("❌ Error in /remix/join:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// Select a stem in a session
router.post("/select-stem", auth, async (req, res) => {
  try {
    const { sessionCode, stemId } = req.body;
    const userId = req.user.id;

    const session = await RemixSession.findOne({ sessionCode });
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const existingEntry = session.stems.find(
      (s) => s.user.toString() === userId
    );
    
    if (existingEntry) {
      existingEntry.stem = stemId;
    } else {
      session.stems.push({ user: userId, stem: stemId });
    }

    await session.save();
    res.json(session);
  } catch (err) {
    console.error("❌ Error in /remix/select-stem:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get session info
router.get("/:sessionCode", auth, async (req, res) => {
  try {
    const session = await RemixSession.findOne({
      sessionCode: req.params.sessionCode,
    }).populate("users stems.stem");

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(session);
  } catch (err) {
    console.error("❌ Error in GET /remix/:sessionCode:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
