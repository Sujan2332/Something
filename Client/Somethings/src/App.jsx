import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Signup from './Something/Signup';
import Login from './Something/Login';
import Something from './Something/Something';
import Post from "./Something/Post.jsx";
import "./App.css";

// CustomAlert Component
export const CustomAlert = ({ message, onClose }) => {
  return (
    <div className="custom-alert">
      <p>{message}</p>
      <button onClick={onClose}><i class="fa-solid fa-circle-xmark"></i></button>
    </div>
  );
};

// ProtectedRoute for routes that require login
const ProtectedRoute = ({ element }) => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('user');
  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);
  return isLoggedIn ? element : null;
};

const App = () => {
  const [alertMessage, setAlertMessage] = useState("");
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Override the default alert globally
    window.alert = (message) => {
      setAlertMessage(message);
      setShowAlert(true);

      // Automatically hide the alert and reset the message after 5 seconds
      setTimeout(() => {
        setShowAlert(false);
        setAlertMessage(""); // Clear the message so subsequent alerts can trigger
      }, 5000);
    };
  }, []);

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage("");
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<ProtectedRoute element={<Something />} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/post/:uniqueId" element={<Post />} />
        </Routes>

        {/* Custom Alert */}
        {showAlert && <CustomAlert message={alertMessage} onClose={closeAlert} />}
      </div>
    </Router>
  );
};

// Default export
export default App;
