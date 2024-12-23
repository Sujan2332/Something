const path = require("path");
const Something = require("../models/something.model");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const fs = require('fs');
const User = require('../models/user.model'); 
const Like = require("../models/like.model");

const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({
    region: process.env.AWS_REGION, // Your AWS region
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log("Authorization Header:", req.headers.authorization); // Log the entire header for debugging
    if (!token) {
        return res.status(401).json({ error: true, message: 'Authentication token missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); 
        console.log("Decoded Token:", decoded); // Log decoded token to see its structure

        const loggedInUser = await User.findById(decoded.userId);
        console.log(`LOgged in user : ${loggedInUser}`)

        if (!loggedInUser) {
            return res.status(404).json({ error: true, message: 'User not found' });
        }

        req.user = {
            _id: loggedInUser._id,
            username: loggedInUser.username,
            email: loggedInUser.email,
        };

        next();
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ error: true, message: 'Invalid or expired token' });
    }
};

// Add new post
let addSomething = async (req, res) => { 
    try {
        let { text } = req.body;
        let filePath = null;
        let fileType = null;
        let fileName = null; // Variable to store the file name

        const loggedInUser = req.user;

        if (!loggedInUser || !loggedInUser._id) {
            return res.status(401).json({ error: true, message: "Unauthorized: User not authenticated" });
        }

        const user = await User.findById(loggedInUser._id);
        let profilePhoto = user.profilephoto.replace(/\\/g, '/');

        if (req.file) {
            const fileExtension = path.extname(req.file.originalname).toLowerCase();
            const s3FileUrl = req.file.location;
            fileName = req.file.originalname; // Extracting file name from the uploaded file

            if (['.jpg', '.jpeg', '.png', '.gif',".jfif"].includes(fileExtension)) {
                filePath = s3FileUrl;
                fileType = 'image';
            } else if (['.mp4', '.mov', '.avi', '.mkv'].includes(fileExtension)) {
                filePath = s3FileUrl;
                fileType = 'video';
            } else if (['.mp3', '.wav', '.aac'].includes(fileExtension)) {
                filePath = s3FileUrl;
                fileType = 'audio';
            } else if (['.pdf', '.docx', '.txt', '.pptx'].includes(fileExtension)) {
                filePath = s3FileUrl;
                fileType = 'document';
            } else {
                filePath = s3FileUrl;
                fileType = 'general';
            }
        }

        if (!text && !filePath) {
            return res.status(400).json({ error: true, message: "No text or file provided" });
        }

        // Create a new document with the text, file URL, file name, and other necessary info
        const newUpload = new Something({
            text,
            user: loggedInUser._id,
            username: loggedInUser.username,
            profilePhoto: profilePhoto,
            [`${fileType}File`]: filePath,
            fileName: fileName, // Save the file name in the database
        });

        await newUpload.save();

        res.status(201).json({
            error: false,
            message: "Something uploaded successfully",
            data: {
                ...newUpload.toObject(),
                profilePhoto,
                file: filePath,
                fileName: fileName, // Send back the file name in the response
            },
        });
    } catch (err) {
        console.error("Error while uploading:", err);
        res.status(500).json({ error: true, message: "Error uploading data", details: err.message });
    }
};

// Get all uploads (formatted with S3 URLs)
let getAllUploads = async (req, res) => {
    try {
        const uploads = await Something.find();
        res.json(uploads.map(upload => ({
            ...upload.toObject(),
            imageFile: upload.imageFile ? upload.imageFile : null,
            videoFile: upload.videoFile ? upload.videoFile : null,
            audioFile: upload.audioFile ? upload.audioFile : null,
            generalFile: upload.generalFile ? upload.generalFile : null,
        })));
    } catch (err) {
        res.status(500).json({ error: true, message: "Error fetching uploads", details: err.message });
    }
};

// Get single upload by uniqueId (formatted with S3 URLs)
const getSingleUpload = async (req, res) => {
    try {
      const { uniqueId } = req.params;
  
      if (!uniqueId) {
        return res.status(400).json({ error: true, message: "Unique ID is required" });
      }
  
      const upload = await Something.findOne({ uniqueId });
  
      if (!upload) {
        return res.status(404).json({ error: true, message: "Upload not found" });
      }
  
      // Send the JSON response first
      res.status(200).json({
        ...upload.toObject(),
        imageFile: upload.imageFile ? upload.imageFile : null,
        videoFile: upload.videoFile ? upload.videoFile : null,
        audioFile: upload.audioFile ? upload.audioFile : null,
        generalFile: upload.generalFile ? upload.generalFile : null,
      });
  
      // After sending the response, then redirect (this might cause the error you are seeing)
      // It's best not to send both a JSON response and redirect in the same request
      // res.redirect(frontendUrl); // Remove this if not needed
  
    } catch (err) {
      console.error("Error fetching upload by uniqueId:", err);
      res.status(500).json({ error: true, message: "Error fetching upload", details: err.message });
    }
  };  

// Update likes and comments on a post
const updateLikesAndComments = async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const { userId, isLiked, comment, username, profilePhoto } = req.body;

        if (userId !== undefined && isLiked !== undefined) {
            let likeRecord = await Like.findOne({ userId, uploadId: uniqueId });

            if (likeRecord) {
                likeRecord.isLiked = isLiked;
                await likeRecord.save();
            } else {
                await Like.create({ userId, uploadId: uniqueId, isLiked });
            }

            const totalLikes = await Like.countDocuments({ uploadId: uniqueId, isLiked: true });

            const post = await Something.findOne({ uniqueId });
            if (post) {
                post.likes = totalLikes;
                await post.save();
            } else {
                return res.status(404).json({ message: "Post not found" });
            }
        }

        if (comment !== undefined && comment.trim() !== "") {
            const post = await Something.findOne({ uniqueId });
            if (post) {
                post.comments.push({
                    text: comment,
                    userId: userId,
                    username: username,
                    profilePhoto: profilePhoto
                });
                post.commentsno += 1;
                await post.save();
            } else {
                return res.status(404).json({ message: "Post not found" });
            }
        }

        const updatedUpload = await Something.findOne({ uniqueId });
        if (updatedUpload) {
            res.status(200).json(updatedUpload);
        } else {
            res.status(404).json({ message: "Post not found" });
        }
    } catch (error) {
        console.error("Error updating likes and comments:", error);
        res.status(500).json({ message: "Internal server error", details: error.message });
    }
};

const deleteSingleUpload = async (req, res) => {
    try {
        const { uniqueId } = req.params;
        const loggedInUserId = req.user?._id;

        if (!uniqueId) {
            return res.status(400).json({ error: true, message: "Unique ID is required" });
        }

        const upload = await Something.findOne({ uniqueId });
        if (!upload) {
            return res.status(404).json({ error: true, message: "Post not found" });
        }

        if (!upload.user || upload.user.toString() !== loggedInUserId.toString()) {
            return res.status(403).json({ error: true, message: "Unauthorized access" });
        }

        // Collect file paths (full keys) from the database
        const fileTypes = ['imageFile', 'videoFile', 'audioFile', 'generalFile'];
        const fileDeletionPromises = fileTypes.map((type) => {
            if (upload[type]) {
                const fullPath = upload[type]; // Use full key/path from DB
                console.log(`Deleting file at path: ${fullPath}`);
                return deleteFileFromS3(fullPath); // Pass the full path
            }
            return Promise.resolve();
        });

        // Wait for all file deletions
        await Promise.all(fileDeletionPromises.map((p) => p.catch((err) => {
            console.error(`Error deleting a file: ${err.message}`);
        })));

        // Delete the post from the database
        await Something.deleteOne({ uniqueId });

        res.status(200).json({
            error: false,
            message: "Post and associated files deleted successfully",
            deletedFiles: fileTypes.filter((type) => upload[type]),
            data: upload,
        });
    } catch (err) {
        console.error("Error deleting upload:", err);
        res.status(500).json({ error: true, message: "Error deleting upload", details: err.message });
    }
};

// Helper function: Pass the full path to S3
const deleteFileFromS3 = async (filePath) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
        Key: filePath,  // Use the full file key/path
    };

    try {
        console.log(`Attempting to delete file from S3: ${filePath}`);
        
        // Create a DeleteObjectCommand
        const command = new DeleteObjectCommand(params);

        // Use s3.send() to execute the command
        await s3.send(command);  
        
        console.log(`File ${filePath} deleted from S3 successfully.`);
    } catch (err) {
        console.error(`Error deleting file ${filePath} from S3:`, err);
        throw new Error(`Error deleting file from S3: ${err.message}`);
    }
};

module.exports = { authenticateToken, addSomething, getAllUploads, getSingleUpload, updateLikesAndComments, deleteSingleUpload };
