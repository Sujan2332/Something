const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// AWS S3 Client Initialization
const s3 = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
});

// Ensure AWS Configuration is Correct
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME || !process.env.AWS_REGION) {
    throw new Error("AWS configuration is incomplete. Please check your environment variables.");
}

// Determine Folder Path for S3 based on file type
const getFolderPath = (fileExtension) => {
    if (['.jpg', '.jpeg', '.png', '.gif', ".jfif"].includes(fileExtension)) {
        return 'images/';
    } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(fileExtension)) {
        return 'videos/';
    } else if (['.mp3', '.wav', '.aac'].includes(fileExtension)) {
        return 'audio/';
    } else if (['.pdf', '.docx', '.txt', '.pptx'].includes(fileExtension)) {
        return 'documents/';
    } else {
        return 'general/';
    }
};

// File Filter for Valid File Types
const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg',".jfif", '.png', '.gif', '.mp4', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.aac', '.pdf', '.docx', '.txt', '.pptx'];

    if (validExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error("This File is not Accepted"), false);
    }
};

// Multer-S3 Configuration
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: "private", // Default to private
        key: (req, file, cb) => {
            const username = req.user.username || req.params.username; // Get username from request
            if (!username) {
                return cb(new Error("Username is required"));
            }

            // Generate unique postId using uuidv4
            const uniquePostId = uuidv4();

            const fileExtension = path.extname(file.originalname).toLowerCase();
            const folderPath = getFolderPath(fileExtension);

            // Construct the S3 path using the format: uploads/Username/uniquePostId/images/file
            const filePath = `uploads/${username}/${uniquePostId}/${folderPath}${uuidv4()}${fileExtension}`;
            cb(null, filePath);  // Store file in the defined path
        },
    }),
    fileFilter: fileFilter,
    limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB Limit
});

module.exports = upload;
