import React, { useState } from 'react';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    profilePhoto: null,
  });
  const [loading,setloading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);  // State for toggling password visibility
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);  // State for confirm password
  const navigate = useNavigate();
  const backend = `https://something-backend.onrender.com`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5 MB.");
        return;
      }
      setSelectedImage(file);
      setFormData({ ...formData, profilePhoto: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, phone, password, confirmPassword, profilePhoto } = formData;
    
    // Basic validations
    if (!username || !email || !phone || !password || !confirmPassword || !profilePhoto) {
      alert("All fields are required.");
      return;
    }
    // Trim and compare passwords
    let trimmedPassword = password.trim();
    let trimmedConfirmPassword = confirmPassword.trim();
    if (trimmedPassword !== trimmedConfirmPassword) {
      alert("Passwords do not match.");
      return;
    }
  
    // Password length validation
    if (trimmedPassword.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }
  setloading(true)
    const formDataToSend = new FormData();
    formDataToSend.append("username", username);
    formDataToSend.append("email", email);
    formDataToSend.append("phone", phone);
    formDataToSend.append("password", trimmedPassword);
    formDataToSend.append("profilePhoto", selectedImage);
    formDataToSend.append("confirmPassword", trimmedConfirmPassword);

    try {
      const response = await axios.post(`${backend}/api/users/signup`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important to set for file upload
        },
      });
      alert(response.data.message);
      navigate("/login");
    } catch (err) {
      // Check if error response contains a message from backend
      alert(err.response?.data?.message || err.message || "Error during signup.");
    }
    setloading(false)
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  return (
    <div className="signup" >
      {loading && (
    <div className="loading-overlay" style={{fontSize:"100px",zIndex:"9999"}}>
      <div className="spinner"></div>
      {/* <i class="fa-solid fa-infinity" style={{background:"transparent"}}></i> */}
    </div>
  )}
      <h1 className="title">Something...<i className="fa-solid fa-infinity"></i></h1>
      <form onSubmit={handleSubmit} className="signup-form" style={{minWidth:"330px"}}>
        <h2 style={{marginTop:"-20px"}}>Signup</h2>
        <input
          type="text"
          name="username"
          placeholder="Username..."
          value={formData.username}
          onChange={handleChange}
        />
        <input
          type="email"
          name="email"
          placeholder="Email..."
          value={formData.email}
          onChange={handleChange}
        />
        <input
          type="text"
          name="phone"
          placeholder="Phone No..."
          value={formData.phone}
          onChange={handleChange}
        />
        
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <input
            type={passwordVisible ? "text" : "password"}
            name="password"
            placeholder="Password..."
            value={formData.password}
            onChange={handleChange}
          />
          <i
            className={`fa-solid ${passwordVisible ? "fa-eye-slash" : "fa-eye"}`}
            onClick={togglePasswordVisibility}
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
          ></i>
        </div>

        <div style={{ position: "relative", marginBottom: "20px" }}>
          <input
            type={confirmPasswordVisible ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm Password..."
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <i
            className={`fa-solid ${confirmPasswordVisible ? "fa-eye-slash" : "fa-eye"}`}
            onClick={toggleConfirmPasswordVisibility}
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
          ></i>
        </div>

        <input
          type="file"
          id="file-input"
          name="profilePhoto"
          onChange={handleFileChange} 
        />
        <label htmlFor="file-input" className="custom-file-label" style={{width:"100%",marginTop:"-20px",marginBottom:"10px"}}>
          Profile Photo
          <i className="fa-solid fa-user" style={{ marginLeft: "10px" }}></i> {/* Upload Icon */}
        </label>
        {selectedImage && (
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="Selected"
          />
        )}
        <button type="submit" className="signupbtn">
          SignUp
        </button>
        <button className='signupbtn' onClick={() => navigate("/login")}>Login ?</button>
      </form>
    </div>
  );
};

export default Signup;
