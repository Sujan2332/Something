import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Signup from './Something/Signup';
import Login from './Something/Login';
import Something from './Something/Something';
import Post from "./Something/Post.jsx"
import "./App.css"

const ProtectedRoute = ({ element }) => {
  const navigate = useNavigate();
  
  // Check if user is logged in by checking localStorage
  const isLoggedIn = localStorage.getItem('user');

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]); // Run effect on isLoggedIn change

  // If logged in, render the element
  return isLoggedIn ? element : null;
};

const App = () => {
  return (
    <Router>
      <div className='App'>
        <Routes>
          {/* Set /something as the main root */}
          <Route path="/" element={<ProtectedRoute element={<Something />} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/post/:uniqueId" element={<Post />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
