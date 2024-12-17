const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

let somethingSchema = new mongoose.Schema({
    uniqueId: {
        type: String,
        default: () => uuidv4(), // Generates a unique ID
        unique: true
    },
    text: {
        type: String,
        // required: true
    },
    fileName:{
        type: String,
    },
    imageFile: {
        type: String, // Stores the image file URL/path
    },
    videoFile: {
        type: String, // Stores the video file URL/path
    },
    audioFile: {
        type: String, // Stores the audio file URL/path
    },
    documentFile:{
        type: String,
    },
    generalFile: {
        type: String, // Stores any other file URL/path
    },
    likes: {
        type: Number,
        default: 0 // Default value for likes
    },
    comments: [{
        text: String ,
        userId: String ,
        username:String ,
        profilePhoto: String
      }],
    commentsno: {
        type: Number,
        default: 0 // Default value for comments
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, ref: 'User' 
    }, // Assuming the User model exists
    username: {
        type : String,
    },
    profilePhoto:{
        type: String
    }
},{ timestamps: true } );

module.exports = mongoose.model("Something", somethingSchema);
