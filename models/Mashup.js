const mongoose = require("mongoose");

const mashupSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  stems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Stem" }],
  createdAt: { type: Date, default: Date.now },
  qrCodeId: { type: String, unique: true },
  public: { type: Boolean, default: false } // ✅ Public mashups can be shared
});

module.exports = mongoose.model("Mashup", mashupSchema);