require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Stem = require('./models/Stem');

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
}

// Convert stems from string identifiers to ObjectId references
async function convertStems() {
    try {
        const users = await User.find();
        console.log(`🔍 Found ${users.length} users. Processing...`);

        for (let user of users) {
            if (!user.stems || user.stems.length === 0) continue; // Skip users with no stems

            const updatedStems = [];

            for (let stemIdentifier of user.stems) {
                const stem = await Stem.findOne({ identifier: stemIdentifier });
                if (stem) {
                    updatedStems.push(stem._id);
                } else {
                    console.warn(`⚠️ Stem not found for identifier: ${stemIdentifier}`);
                }
            }

            // Update user if stems were found
            if (updatedStems.length > 0) {
                await User.updateOne({ _id: user._id }, { $set: { stems: updatedStems } });
                console.log(`✅ Updated user: ${user.username} (${user._id})`);
            } else {
                console.warn(`🚨 No valid stems found for user: ${user.username}`);
            }
        }

        console.log("🎉 Conversion Complete!");
    } catch (error) {
        console.error("❌ Error updating stems:", error);
    } finally {
        mongoose.connection.close();
        console.log("🔌 Disconnected from MongoDB");
    }
}

// Run the script
async function run() {
    await connectDB();
    await convertStems();
}

run();