const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  name: {
    required: true,
    type: String,
  },
  Cnic: {
    required: true,
    type: String,
  },
  Pharmacyname: {
    required: true,
    type: String,
  },
  Pharmacyaddress: {
    required: true,
    type: String,
  },
  licences: {
    required: true,
    type: String,
  },
  isapproved: {
    required: true,
    type: String,
    default: false,
  },
  Image: {
    data: Buffer,
    ContentType: String,
  },
  Medicines: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Medicine",
    },
  ],
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    requied: true,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  location: {
    Latitude: {
      type: Number,
    },
    Longitude: {
      type: Number,
    },
  },
});

module.exports = mongoose.model("Shop", ShopSchema);
