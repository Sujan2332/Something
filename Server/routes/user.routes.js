const express = require("express");
const upload = require("../middleware/uploadMiddleware");  // Import the file upload middleware
const { addUser, loginUser, forgotPassword, resetPassword, getAllUsers, deleteUser,getUserByUniqueId, updateUserDetails } = require("../controllers/users.controller");
const router = express.Router();

// Route for user signup (uploading profile photo along with user data)
router.post("/signup", upload.single("profilePhoto"), addUser);

// Route for user login
router.post("/login", loginUser);

// Forgot password route
router.post("/forgot-password", forgotPassword);

// Reset password route
router.post("/reset-password/:token", resetPassword);

// Route to get all users
router.get("/users", getAllUsers);

// Serve uploaded files statically (optional for serving images)
router.use("/uploads", express.static("uploads"));

router.delete("/delete/:uniqueId",deleteUser)

router.get('/user/:uniqueId', getUserByUniqueId);

router.patch("/update/:uniqueId",upload.single("profilephoto"),updateUserDetails)

module.exports = router;
