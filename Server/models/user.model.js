const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      required: true,
      unique: true,
      default: () => `user_${Math.random().toString(36).substr(2, 9)}`, // Unique ID generation
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    profilephoto: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[a-zA-Z0-9._%+-]+@[a-zAZ0-9.-]+\.[a-zA-Z]{2,4}$/,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^[0-9]{10,15}$/,
    },
    password: {
      type: String,
      required: true,
    },
    friends: {
      type: String,
    },
    posts: {
      type: String,
    },
    postsno: {
      type: Number,
    },
    resetToken: { type: String },
    tokenExpiry: { type: Date },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

module.exports = mongoose.model("User", userSchema);
