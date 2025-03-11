const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  qrCodeId: { type: String, unique: true, sparse: true }, // Add sparse: true
  favoriteGenre: { type: String },
  photo: { type: String },
  stems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stem" }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
