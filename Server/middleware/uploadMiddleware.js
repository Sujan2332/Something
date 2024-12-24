const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const User = require('../models/user.model'); // Assuming you have a User model

// Setup AWS S3 Client using AWS SDK v3
const s3 = new S3Client({
  region: process.env.AWS_REGION, // Replace with your AWS region (e.g., 'us-west-1')
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Replace with your AWS access key
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Replace with your AWS secret key
  },
});

// Setup multer-s3 for file uploads to AWS S3
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME, // Replace with your bucket name
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname }); // Attach metadata for the uploaded file
    },
    key: async (req, file, cb) => {
      try {
        // Check if this operation is for user signup
        const isSignup = req.path.includes("signup") || req.body.isSignup;

        if (isSignup) {
          // Generate a temporary file path for new user signups
          const tempFilePath = `uploads/temp/${Date.now()}-${file.originalname}`;
          return cb(null, tempFilePath); // Temporary path for signup
        }

        // For profile updates, ensure `uniqueId` is provided
        const uniqueId = req.params.uniqueId || req.body.uniqueId;

        if (!uniqueId) {
          return cb(new Error("The uniqueId is required to upload a file."));
        }

        // Fetch the user by uniqueId
        const user = await User.findOne({ uniqueId });

        if (!user) {
          return cb(new Error(`User with uniqueId '${uniqueId}' not found.`));
        }

        // If user found, use their username for the file path
        const username = user.username;
        const filePath = `uploads/${username}/profile/profile-photo.jpg`; // Fixed file name to overwrite existing photo

        cb(null, filePath); // Set the S3 file path
      } catch (err) {
        console.error("Error in upload middleware:", err.message); // Log the error
        cb(new Error("Internal server error while processing the upload."));
      }
    }
  }),
  limits: { fileSize: 6 * 1024 * 1024 }, // Optional: limit file size to 5MB
  fileFilter: (req, file, cb) => {
    // Optional: restrict to specific file types (e.g., JPEG and PNG images)
    const allowedMimeTypes = ["image/jpeg", "image/png","image/jpg","image/jfif","image/gif"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Only JPEG, JPG, GIF, JFIF and PNG are allowed."));
    }
    cb(null, true); // Accept file
  }
});

module.exports = upload;
