import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = `https://something-backend.onrender.com`; // Temporary hardcoded value
// const API_BASE_URL = `http://localhost:5000`; // Temporary hardcoded value

const Login = () => {
  const [email, setEmail] = useState("");
  const [loading,setloading] =useState(false)
  const [password, setPassword] = useState("");
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const togglePasswordVisibility = (setter) => setter((prev) => !prev);

  const handleLoginSubmit = async (e) => {
    setloading(true)
    e.preventDefault();
    console.log("Login form submitted");
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/login`, {
        email,
        password,
      });
  
      console.log("Login Response:", response.data);
  
      // Corrected data extraction
      const userData = response.data.data;  // Access 'data' instead of 'user'
      if (!userData) {
        console.error('No user data found in the response');
        return;
      }
  
      console.log('User Data:', userData);
  
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      console.log('Stored User Data:', localStorage.getItem("user"));
      alert(response.data.message);
      navigate("/", { state: { user: userData } });
    } catch (err) {
      alert(err.response?.data?.message || err.message || "An Error Occurred");
      console.error('Login Error:', err);
    } finally{
      setloading(false)
    }
  };  

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setloading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/forgot-password`, {
        email,
      });
      setMessage(response.data.message);
      setloading(false)
      setTimeout(() => setMessage(""), 3000);

      setIsForgotPasswordModalOpen(false);
      setIsResetPasswordModalOpen(true);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "An Error Occurred. Please Try Again");
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    try {
    setloading(true);
    const token = localStorage.getItem("resetToken");
      const response = await axios.post(`${API_BASE_URL}/api/users/reset-password/${resetToken}`, {
        password: newPassword,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,  // Send the token in the Authorization header
        },
      });
      setMessage(response.data.message);
      setNewPassword("");
      setConfirmPassword("");
      alert("Password changed successfully!");
      setIsResetPasswordModalOpen(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || err.message || "An Error Occurred. Please Try Again.");
    } finally{
      setloading(false)
    }
  };

  return (
    <div className="login">

{loading && (
    <div className="loading-overlay" style={{fontSize:"100px",zIndex:"9999"}}>
      <div className="spinner"></div>
      {/* <i class="fa-solid fa-infinity" style={{background:"transparent"}}></i> */}
    </div>
  )}

      <h1 className="title" style={{ textAlign: "center",marginTop:"-60px" }}>
        Something...<i className="fa-solid fa-infinity"></i>
      </h1>

      <form onSubmit={handleLoginSubmit} className="loginform" style={{minWidth:"330px"}}>
        <h2 className="loginheading" >Login</h2>
        <input
          type="email"
          placeholder="Email..."
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div  className="passdiv" style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password..."
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility(setShowPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              fontSize: "18px",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {showPassword ? <i className="fa-solid fa-eye-slash"></i> : <i className="fa-solid fa-eye"></i>}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            padding: "10px",
            width:"auto",
            marginTop: "-30px",
            height: "200px",
          }}
          className="loginbtns"
        >
          <button type="submit" className="signupbtn">
            Login
          </button>
          <button type="button" onClick={() => navigate("/signup")} className="signupbtn">
            SignUp ?
          </button>
        </div>

        <button
          style={{ background:"none",border: "none", color: "blue", fontSize: "20px", textDecoration: "underline" }}
          type="button"
          className="link-button"
          onClick={() => setIsForgotPasswordModalOpen(true)}
        >
          Forgot Password ?
        </button>
      </form>

      {isForgotPasswordModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Forgot Password</h2>
            <form onSubmit={handleForgotPasswordSubmit}>
              <input
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="btns">
                <button type="submit">Send Reset Link</button>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordModalOpen(false)}
                  className="close"
                  style={{
                    borderRadius: "50px",
                    fontWeight: "600",
                  }}
                >
                  X
                </button>
              </div>
            </form>
            {message && <p className="message">{message}</p>}
          </div>
        </div>
      )}

      {isResetPasswordModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPasswordSubmit}>
              {message && <p className="message" style={{ marginBottom: "10px" }}>{message}</p>}
              <input
                type="text"
                placeholder="Enter Reset Token..."
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(setShowNewPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showNewPassword ? <i style={{ position: "absolute", marginTop: "-18px" }} className="fa-solid fa-eye-slash"></i> : <i style={{ position: "absolute", marginTop: "-18px" }} className="fa-solid fa-eye"></i>}
                </button>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(setShowConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showConfirmPassword ? <i style={{ position: "absolute", marginTop: "-18px" }} className="fa-solid fa-eye-slash"></i> : <i style={{ position: "absolute", marginTop: "-18px" }} className="fa-solid fa-eye"></i>}
                </button>
              </div>
              <div className="btns">
                <button type="submit">Reset Password</button>
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="close"
                  style={{
                    borderRadius: "50px",
                    fontWeight: "600",
                  }}
                >
                  X
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
