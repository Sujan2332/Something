// routes/something.routes.js

const express = require('express');
const router = express.Router();
const upload = require("../middleware/fileUpload"); // Import the file upload middleware
const { addSomething, getAllUploads,getSingleUpload,deleteSingleUpload, updateLikesAndComments, authenticateToken} = require("../controllers/something.controller");

// Define routes and attach middleware
router.post("/addSomething", authenticateToken,upload.single('file'), addSomething); // Use file upload middleware
router.get("/getAllUploads", getAllUploads);
router.get("/getPost/:uniqueId", getSingleUpload);
router.delete("/delete/:uniqueId",authenticateToken,deleteSingleUpload);
router.patch('/upload/:uniqueId', updateLikesAndComments);

module.exports = router;
