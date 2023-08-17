const mongoose = require("mongoose");
const crypto = require("crypto");
const userSchema = mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please enter the name of the user "],
  },
  email: {
    type: String,
    requird: [true, "Please enter your email address"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Please enter your password"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
  },
  confirmPassword: {
    type: String,
    required: false,
  },
  resettoken: {
    type: String,
  },
  isVerified: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    default: "user",
  },
  shops: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Shop",
      required: true,
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

// Generating Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
  // Generating Token
  const resetTokens = crypto.randomBytes(20).toString("hex");

  // HAsing and adding resetPAsswordToken to userSchema
  this.resettoken = crypto
    .createHash("sha256")
    .update(resetTokens)
    .digest("hex");

  return resetTokens;
};

module.exports = mongoose.model("User", userSchema);
