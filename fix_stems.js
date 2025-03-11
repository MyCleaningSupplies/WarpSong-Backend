const mongoose = require("mongoose");
const User = require("./models/User");
const Stem = require("./models/Stem");

// Replace with your actual MongoDB connection string
const MONGO_URI =
  "mongodb+srv://abdelouzzine:PMzVqeTUUG8j5s8y@cluster0.jjgec.mongodb.net/warpSongDB?retryWrites=true&w=majority";

async function migrateUserStems() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const users = await User.find({});
    for (const user of users) {
      console.log(`🔄 Checking user: ${user.username}`);

      // Debugging output
      console.log(`ℹ️ Type of user.stems: ${typeof user.stems}`);
      console.log(`ℹ️ user.stems content:`, user.stems);

      if (!Array.isArray(user.stems)) {
        console.warn(`⚠️ Skipping user ${user.username} - stems field is not an array.`);
        continue;
      }

      if (user.stems.length === 0) {
        console.warn(`⚠️ No valid stems found for ${user.username} - Keeping empty.`);
        continue;
      }

      // Find matching stems in the database
      const stemDocs = await Stem.find({ identifier: { $in: user.stems } });

      if (stemDocs.length === 0) {
        console.warn(`⚠️ No matching stems found for ${user.username}.`);
        continue;
      }

      // Convert stem identifiers to ObjectIds
      user.stems = stemDocs.map((stem) => stem._id);

      await user.save();
      console.log(`✅ Updated user ${user.username} stems:`, user.stems);
    }

    console.log("🎉 Migration completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    mongoose.disconnect();
  }
}

migrateUserStems();