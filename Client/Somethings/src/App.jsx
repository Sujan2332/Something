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
  const [isDarkTheme,setIsDarkTheme] =useState(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(()=>{
    document.body.classList.add('loading');
    const loadStyles = (theme)=>{
      const head = document.head
      Array.from(document.querySelectorAll("link[data-them")).forEach((link)=>
        head.removeChild(link)
      )
      const stylesheets =
      theme === "dark"
      ? [
        "../Post.css",
        "../Login.css",
        "../Signup.css",
        "../Something.css",
      ] :
      [
        "../PostLight.css",
        "../LoginLight.css",
        "../SignupLight.css",
        "../style.css",
      ]

      stylesheets.forEach((href)=>{
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href=href
        link.setAttribute("data-theme",theme)
        head.appendChild(link)
      })
    }

    const theme = isDarkTheme ? 'dark' : 'light';
    loadStyles(theme);

    // Save the theme to localStorage
    localStorage.setItem('theme', theme);

    const timer = setTimeout(() => {
      document.body.classList.remove('loading');
    }, 500); // Same time as the transition duration


    return ()=>{
      clearTimeout(timer);
      Array.from(document.querySelectorAll("link[data-theme]")).forEach((link)=>
      document.head.removeChild(link)
      )
    }
  },[isDarkTheme])

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
    <div>
      <span className={isDarkTheme ? "dark-theme":"light-theme"}>
        <button onClick={()=>setIsDarkTheme((prev)=>!prev)} className='theme-toggle-btn'>
        {isDarkTheme ? <i class="fa-solid fa-moon"></i> :<i class="fa-solid fa-sun"></i>}
        </button>
      </span>
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
    </div>
    
  );
};

// Default export
export default App;
