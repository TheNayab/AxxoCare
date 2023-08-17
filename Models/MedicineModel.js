const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  Medicinename: {
    type: String,
    required: [true, "please Enter product name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter product Description"],
  },
  price: {
    type: Number,
    required: [true, "Please Enter product price"],
    maxLength: [8, "Price cannot exceed 8 character"],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  Images: {
    data: Buffer,
    contentType: String,
  },
  category: {
    type: String,
    required: [true, "Please Enter the product category"],
  },
  stock: {
    type: Number,
    required: [true, "please Enter the product stock"],
    maxLength: [4, "Stock cannot exceed 4 characters"],
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      name: {
        type: String,
      },
      rating: {
        type: Number,
      },
      comment: {
        type: String,
      },
    },
  ],
  shops: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Shop",
      required: true,
    },
  ],
  createAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Medicine", MedicineSchema);
