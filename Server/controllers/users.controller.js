const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken")
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
// Add User Function
let addUser = async (req, res) => {
  try {
    const { username, email, phone, password, confirmPassword } = req.body;

    // Handle file upload via multer middleware
    const imagePath = req.file ? req.file.location : null; // Get the S3 URL

    if (!imagePath) {
      return res.status(400).json({ error: true, message: "No Profile photo uploaded" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: true, message: "Passwords do not match" });
    }

    const passwordStrengthRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordStrengthRegex.test(password)) {
      return res.status(400).json({ error: true, message: "Password is not strong enough" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: true, message: "User with this email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      phone,
      password: hashedPassword,
      profilephoto: imagePath, // Store the S3 URL in the database
      userId: uuidv4(),  // Generate unique ID for the user
      postsno: 0,  // Initialize posts count to 0
    });

    await newUser.save();

    res.status(201).json({
      error: false,
      message: "User Registered Successfully",
      user: {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        profilephoto: newUser.profilephoto, // Return the S3 URL
      },
    });
  } catch (err) {
    console.error("Error while registering User:", err);
    res.status(500).json({
      error: true,
      message: "Error Registering User",
      details: err.message,
    });
  }
};

// Login User Function
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: true, 
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        error: true, 
        message: "User not found" 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: true, 
        message: "Incorrect password" 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id, // User ID from DB
        email: user.email, // Email for reference
      },
      process.env.JWT_SECRET_KEY, // Secret key from environment variables
      { expiresIn: '30d' } // Token expiration time
    );

    // Respond with user data and token (excluding sensitive info like password)
    const { password: _, ...userData } = user.toObject(); // Remove password from the response

    res.status(200).json({
      error: false,
      message: "Login successful",
      data: { ...userData, token }, // Send token along with user data
    });
  } catch (err) {
    console.error("Error while logging in:", err);
    res.status(500).json({
      error: true,
      message: "Internal server error",
      details: err.message,
    });
  }
};

// Forgot Password Function
let forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: true, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found!" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = Date.now() + 15 * 60 * 1000;

    user.resetToken = resetToken;
    user.tokenExpiry = tokenExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
      <div style="background-color: black;text-align:center;height:400px;">
        <div style="font-family: Arial, sans-serif;background-color: black; color: white; font-size: 16px; color: #333;font-style: italic;margin:30px;padding:20px">
          <div style="background-color: black; color: white; text-align: center;">
            <h1>Something...</h1>
          </div>
          <h2 style="font-style: italic;color: white; ">Password Reset Request</h2>
          <p style="color: white; ">You requested a password reset. Use the token below to reset your password:</p>
          <h1><strong style="font-size: 18px; color: white;text-decoration :underline ;font-style:none;">${resetToken}</strong></h1>
          <p style="color: white; ">This token will expire in 15 minutes.</p>
        </div>
        </div>
      `,
    };
    

    await transporter.sendMail(mailOptions);

    res.status(200).json({ error: false, message: "Reset token sent to your email." });
  } catch (err) {
    console.error("Error in Forgot Password:", err);
    res.status(500).json({ error: true, message: "Error processing request", details: err.message });
  }
};

// Reset Password Function
let resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: true, message: "Password is required" });
    }

    const user = await User.findOne({
      resetToken: token,
      tokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: true, message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.tokenExpiry = undefined;

    await user.save();

    res.status(200).json({ error: false, message: "Password reset successfully" });
  } catch (err) {
    console.error("Error in Reset Password:", err);
    res.status(500).json({ error: true, message: "Error processing request", details: err.message });
  }
};

// Get All Users
let getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: true, message: "Error fetching users", details: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    // Log the entire req.params to check what data is available
    console.log("Request parameters:", req.params);

    const { uniqueId } = req.params;  // Extract uniqueId from the URL path
    
    // Log the uniqueId to ensure it's correctly extracted
    console.log("Received uniqueId:", uniqueId);

    if (!uniqueId) {
      return res.status(400).json({
        error: true,
        message: "User uniqueId is required",
      });
    }

    const user = await User.findOneAndDelete({ uniqueId });

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "User not found",
      });
    }

    return res.status(200).json({
      error: false,
      message: "User and associated data deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({
      error: true,
      message: "Error deleting user",
      details: err.message,
    });
  }
};

// Get User by ID Function
let getUserByUniqueId = async (req, res) => {
  try {
    const { uniqueId } = req.params;  // Extract uniqueId from the URL path

    if (!uniqueId) {
      return res.status(400).json({ error: true, message: "User uniqueId is required" });
    }

    const user = await User.findOne({ uniqueId }); // Search for user by uniqueId

    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    // Exclude sensitive information like password
    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      error: false,
      message: "User details fetched successfully",
      user: userData,
    });
  } catch (err) {
    console.error("Error fetching user by uniqueId:", err);
    res.status(500).json({ error: true, message: "Error fetching user by uniqueId", details: err.message });
  }
};

let updateUserDetails = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    let updatedData = req.body;

    // Validate required inputs
    if (!uniqueId) {
      return res.status(400).json({ error: true, message: "User uniqueId is required" });
    }

    if (!updatedData || Object.keys(updatedData).length === 0) {
      return res.status(400).json({ error: true, message: "No data provided to update" });
    }

    // Fetch the user document
    const user = await User.findOne({ uniqueId });
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    console.log("User document before update:", user);

    if (updatedData.password) {
      // Hash the new password before updating the user
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(updatedData.password, salt);
      console.log("Password hashed successfully");
    }

    // Handle profile photo update if a file is uploaded
    if (req.file) {
      console.log("Uploaded file details:", req.file);
      updatedData.profilephoto = req.file.location;

      if (user.profilephoto) {
        const oldPhotoKey = user.profilephoto.split('/').pop();

        const deleteParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: oldPhotoKey,
        };

        try {
          const command = new DeleteObjectCommand(deleteParams);
  await s3Client.send(command);
  console.log("Object deleted successfully");
        } catch (deleteErr) {
          console.error("Error deleting old profile photo from S3:", deleteErr);
        }
      }
    } else {
      // Ensure profilephoto is not accidentally overwritten
      if (updatedData.profilephoto) {
        delete updatedData.profilephoto;
      }
    }

    console.log("Updated data before cleaning:", updatedData);

    // Remove null or undefined fields
    Object.keys(updatedData).forEach((key) => {
      if (updatedData[key] == null) delete updatedData[key];
    });

    console.log("Cleaned updated data:", updatedData);

    // Validate profilephoto format
    if (updatedData.profilephoto && typeof updatedData.profilephoto !== "string") {
      return res.status(400).json({ error: true, message: "Invalid profilephoto format" });
    }

    // Update the user in the database
    const updatedUser = await User.findOneAndUpdate(
      { uniqueId },
      { $set: updatedData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(500).json({ error: true, message: "Failed to update user details" });
    }

    // Exclude sensitive data from the response
    const { password, ...userData } = updatedUser.toObject();

    return res.status(200).json({
      error: false,
      message: "User details updated successfully",
      user: userData,
    });
  } catch (err) {
    console.error("Error updating user details:", err.message);
    return res.status(500).json({
      error: true,
      message: "An error occurred while updating user details",
      details: err.message,
    });
  }
};


module.exports = { addUser, loginUser, forgotPassword, resetPassword, getAllUsers, deleteUser, getUserByUniqueId , updateUserDetails};
