const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  qrCodeId: { type: String, unique: true },
  stems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stem" }],
  mashups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Mashup" }],
  isAdmin: { type: Boolean, default: false }, // Add this line
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  rank: { type: Number, default: 9999 },
  achievements: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
