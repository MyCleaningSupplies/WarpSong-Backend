const mongoose = require('mongoose');
require('dotenv').config();

// Get the MongoDB URI from your environment variables
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

console.log('Using MongoDB URI:', MONGO_URI);

async function resetIndexes() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Define the User model
    const userSchema = new mongoose.Schema({
      username: { type: String, unique: true, required: true },
      password: { type: String, required: true },
      qrCodeId: { type: String, unique: true, sparse: true },
      favoriteGenre: { type: String },
      photo: { type: String },
      stems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stem" }],
      createdAt: { type: Date, default: Date.now }
    });
    
    const User = mongoose.model('User', userSchema);
    
    try {
      // Try to drop the problematic index
      await User.collection.dropIndex('qrCodeId_1');
      console.log('Successfully dropped qrCodeId index');
    } catch (indexErr) {
      console.log('Index might not exist or other error:', indexErr.message);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error:', err);
  }
}

resetIndexes();
