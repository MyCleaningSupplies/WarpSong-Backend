const mongoose = require("mongoose");

const stemSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    unique: true,
  },
  artist: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: {
      values: ['Drums', 'Bass', 'Melodie', 'Vocals'],
      message: '{VALUE} is not a valid stem type'
    },
    set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() // Capitalize first letter
  },
  bpm: {
    type: Number,
    required: true,
  },
  key: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Stem", stemSchema);
