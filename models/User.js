const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  qrCodeId: { type: String, unique: true },
  stems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stem" }],
  mashups: [{ type: mongoose.Schema.Types.ObjectId, ref: "Mashup" }],  // <--- Add This

  level: { type: Number, default: 1 }, // ✅ New: Leveling system
  xp: { type: Number, default: 0 }, // ✅ XP for leveling
  streak: { type: Number, default: 0 }, // ✅ Daily streak
  rank: { type: Number, default: 9999 }, // ✅ User ranking
  achievements: [{ type: String }], // ✅ Array of completed achievement IDs
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
