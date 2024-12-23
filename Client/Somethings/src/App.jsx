import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Signup from './Something/Signup';
import Login from './Something/Login';
import Something from './Something/Something';
import Post from "./Something/Post.jsx"
import "./App.css"

const ProtectedRoute = ({ element }) => {
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem('user');

  // Redirect to login if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // Render the protected element if logged in
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
