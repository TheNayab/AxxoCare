const mongoose = require("mongoose");

const RiderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "please Enter rider name"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Please Enter rider Phone Number"],
  },
  address: {
    type: String,
    required: [true, "Please Enter rider Address"],
  },
  Cnic: {
    type: String,
    required: true,
  },
  Images: {
    data: Buffer,
    contentType: String,
  },
  orders: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Order",
    },
  ],
  location: {
    Latitude: {
      type: Number,
    },
    Longitude: {
      type: Number,
    },
  },
});

module.exports = mongoose.model("Rider", RiderSchema);
