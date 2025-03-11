// models/RemixSession.js
const mongoose = require("mongoose");

const RemixSessionSchema = new mongoose.Schema({
  sessionCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  users: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    max: 4 
  }],
  stems: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    stem: { type: mongoose.Schema.Types.ObjectId, ref: "Stem" }
  }],
  bpm: { 
    type: Number, 
    default: 130 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 86400 // Sessions expire after 24 hours
  }
});

module.exports = mongoose.model("RemixSession", RemixSessionSchema);
