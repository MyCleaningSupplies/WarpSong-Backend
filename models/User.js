const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  qrCodeId: { type: String, unique: true },
  stems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stem" }],  // ✅ Ensure it's an array of ObjectId
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);