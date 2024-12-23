const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path")
require("dotenv").config(); // Load environment variables

const userRoutes = require("./routes/user.routes");
const somethingRoutes = require("./routes/something.routes");

const PORT = process.env.PORT || 5000; // Default to 5000 if not specified
const app = express();

// Enable CORS
app.use(cors());

// Body parsing middleware
app.use(express.json()); // Built-in middleware for parsing JSON

// Serve static files (uploaded files, for example)
app.use("/uploads", express.static(path.join(__dirname,"uploads")));

// API routes
app.use("/api/users", userRoutes);
app.use("/api/something", somethingRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

// MongoDB connection
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("MongoDB URI not provided. Please set the MONGODB_URI environment variable.");
  process.exit(1); // Exit if MongoDB URI is missing
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

// Global error handler (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: "Something went wrong!",
    details: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
