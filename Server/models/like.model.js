const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    uploadId: {
      type: String, // Changed from ObjectId to String to accommodate uniqueId
      required: true,
    },
    isLiked: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true } // Optional: for tracking createdAt and updatedAt
);

module.exports = mongoose.model("Like", LikeSchema);
