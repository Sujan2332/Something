import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import "./Something.css";
import logo from "../assets/logo.png"
// import "./style.css"
import axios from "axios";
function ImageUploader() {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [user, setUser] = useState(null);
  const [likesData, setLikesData] = useState({}); // Consolidate likes and isLiked into one state
  const [userId, setUserId] = useState(null);
  const [showModal,setShowModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false); 
  const [currentUploadId,setCurrentUploadId] = useState(null)
  const [newComment,setNewComment] = useState("")
  const [comments,setComments] = useState([])
  const [isLoading, setIsLoading] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({}); // Store updated user data
  const [isEditing, setIsEditing] = useState(false); // Flag for edit mode
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isImageOpen, setImageOpen] = useState(false)
  const [image, setImage] = useState(null)

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  console.log(updatedUser)
  const openModal = () => setModalOpen(true);
  const closeModal = () => 
    {setModalOpen(false);
      setSelectedFile(null)
    }
  const navigate = useNavigate();

  // const backend = import.meta.env.VITE_REACT_BACKEND_URL;
  const backend = `https://something-backend.onrender.com`

  const handleCardClick = (uniqueId) => {
    // Navigate to the post page with the unique ID
    navigate(`/post/${uniqueId}`);
  };

  const handleImageClick = (image)=>{
    setImageOpen(true)
    setImage(image)
  }
  const handleModalClose = ()=>{
    setImageOpen(false)
    setImage(null)
  }

  const handleDownload = ()=>{
    const link = document.createElement("a")
    link.href = image
    link.download = "Something.jpg"
    link.click()
  }
  // Function to get User ID from localStorage
  const getUserId = () => {
    const USERLOG = localStorage.getItem("user");
    if (USERLOG) {
      const parsedUser = JSON.parse(USERLOG); // Assuming 'user' is a JSON string
      return parsedUser?.uniqueId || null; // Get uniqueId if present
    }
    return null; // If no user is logged in, return null
  };

  // Fetch user data and likesData on page load
  useEffect(() => {
    const storedUserId = getUserId(); // Retrieve user ID from localStorage
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.error("User ID is not available in localStorage");
    }

    const storedLikesData = JSON.parse(localStorage.getItem('likesData')) || {};
    setLikesData(storedLikesData);

    if (storedUserId) {
      axios.get(`${backend}/api/users/user/${storedUserId}`)
        .then(response => {
          setUser(response.data.user);
          setUpdatedUser(response.data.user); // Initialize updatedUser with current user details
        })
        .catch(error => console.error("Error fetching user details:", error));
    }
  }, []); // This runs only once when the component mounts

  // Handle profile photo fallback
  const handleProfilePhoto = () => {
    return user.profilephoto ? `${user.profilephoto}` : `${backend}/${user.profilephoto}`;
  };
  console.log("PROFILE:",handleProfilePhoto)

  // Handle input changes for editing
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle toggle between edit and view modes
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Handle submit to update user data
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true)
    // Create a FormData object to send both the user data and the file (profile photo)
    const formData = new FormData();
    const profilephoto = user.profilephoto
    console.log(profilephoto)
    // Append the updated user fields (e.g., username, email, etc.)
    for (const key in updatedUser) {
      formData.append(key, updatedUser[key]);
    }
  console.log("UPDATED PRILFE : ",updatedUser.profilePhoto)
    // Append the profile photo if a new one is selected
    if (updatedUser.profilephoto) {  // Assuming `profilePhoto` holds the file from the input
      formData.append('profilephoto', profilephoto);
    }
  
    // Send a PATCH request to update user data, including the file
    axios.patch(`${backend}/api/users/update/${userId}`, formData)
      .then(response => {
        console.log("Profile updated successfully", response);
        setUser(updatedUser); // Update the user state with the new data
        setIsEditing(false); // Exit edit mode
        setIsLoading(false)
        window.location.reload()
      })
      .catch(error => {
        console.error("Error updating profile:", error);
      });
  }; 

const toggleHeart = async (uniqueId) => {
  if (!userId) {
    console.error("User ID is not available");
    return;
  }

  const currentLikeState = likesData[uniqueId]?.isLiked?.[userId] ?? false;
  const newLikeState = !currentLikeState;

  try {
    // Send updated like state to the backend
    const response = await axios.patch(`${backend}/api/something/upload/${uniqueId}`, {
      userId,
      isLiked: newLikeState,
    });

    // Update the likesData state
    setLikesData((prevState) => {
      const updatedData = {
        ...prevState,
        [uniqueId]: {
          ...prevState[uniqueId],
          isLiked: {
            ...prevState[uniqueId]?.isLiked,
            [userId]: newLikeState,
          },
          likes: response.data.likes,  // Update with the new total likes from backend
        },
      };

      // Save to localStorage (optional)
      localStorage.setItem('likesData', JSON.stringify(updatedData));

      return updatedData;
    });
  } catch (err) {
    console.error("Error updating like:", err);
  }
};

  // Memoized function to fetch user data
  const fetchUserData = useCallback(async () => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    console.log("Logged-in User: ", loggedInUser);  
    if (loggedInUser) {
      setUser((prevUser) => {
        if (prevUser && prevUser._id === loggedInUser._id) {
          return prevUser;
        } else {
          return {
            ...loggedInUser,
            profilephoto: loggedInUser.profilephoto?.replace(/\\/g, "/"), // Normalize path
          };
        }
      });
    }
  }, []);
  
  // Memoized function to fetch uploads
  const fetchUploads = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`${backend}/api/something/getAllUploads`);
      const data = await response.json();
      setUploads(data);

      // Update likesData based on fetched uploads
      const initialLikesState = data.reduce((acc, upload) => {
        acc[upload.uniqueId] = {
          isLiked: upload.likes > 0,
          likes: upload.likes,
        };
        return acc;
      }, {});
      setLikesData(initialLikesState);
    } catch (err) {
      console.log("Error fetching uploads:", err);
    }finally{
      setIsLoading(false)
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchUploads();
  }, [fetchUserData, fetchUploads]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const getFileCategory = (file) => {
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif',"jfif"].includes(fileExtension)) {
      return 'image';
    } else if (['mp4', 'mov', 'avi', 'mkv'].includes(fileExtension)) {
      return 'video';
    } else if (['mp3', 'wav', 'aac'].includes(fileExtension)) {
      return 'audio';
    } else {
      return 'general';
    }
  };

  const uploadFile = async (uploadsData) => {
    try {
      // Get the logged-in user data from localStorage
      const loggedInUser = JSON.parse(localStorage.getItem("user"));
      console.log("Login:", loggedInUser);
      const token = loggedInUser ? loggedInUser.token : null;
      console.log("Token:", token);
  
      // If there's no logged-in user or token, show an alert and exit
      if (!loggedInUser || !token) {
        alert("You must be logged in to upload a post!");
        return;
      }
  
      // Prepare FormData for file upload
      const formData = new FormData();
      formData.append("text", text); // Text to accompany the post
      formData.append("file", selectedFile); // The selected file
      formData.append("category", getFileCategory(selectedFile)); // File category
  
      // Send POST request with Authorization header containing the token
      const uploadResponse = await fetch(
        `${backend}/api/something/addSomething`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`, // Authorization header with the token
          },
          body: formData, // The FormData containing the file and text
        }
      );
  
      // Parse the response from the server
      const uploadData = await uploadResponse.json();
  
      // Check if the response is successful
      if (uploadResponse.ok) {
        alert("Upload successful!");
        setText(""); // Clear the text field
        setSelectedFile(null); // Clear the selected file
        setUploads([...uploadsData, uploadData]); // Add new upload to the UI
        await fetchUploads(); // Re-fetch uploads to update the UI with the new post
      } else {
        throw new Error(uploadData.message || "Error uploading");
      }
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Error uploading! " + (error.message || ""));
    }
  };
  
  const handleUpload = async () => {
    if (text && selectedFile) {
      setIsLoading(true); // Start loading
      try {
        // Fetch current uploads
        const uploadsResponse = await fetch(
          `${backend}/api/something/getAllUploads`
        );
        const uploadsData = await uploadsResponse.json();
  
        // Proceed with the upload
        await uploadFile(uploadsData);
      } catch (error) {
        console.error("Error fetching uploads:", error);
        alert("Error fetching uploads!");
      } finally {
        setIsLoading(false); // Stop loading only after everything is done
      }
    } else {
      alert("Please enter text and select a file!");
    }
  };  

  const handleCommentClick = async (uploadId)=>{
    setCurrentUploadId(uploadId);
    setShowModal(true);
    await fetchComments(uploadId)
    await fetchUploads()
  }

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentUploadId(null);
  };

  const handleCommentSubmit = async () => {
    // Ensure the required states are set properly before submitting the comment
    if (!newComment.trim()) {
      alert("Please enter a comment.");
      return;
    }
  
    const newCommentData = {
      userId: userId,
      comment: newComment,
      username: user ? user.username : "",
      profilePhoto: user ? user.profilephoto : "",
    };
  
    try {
      setIsLoading(true)
      // Sending the PATCH request with the correct uniqueId
      const response = await axios.patch(
        `${backend}/api/something/upload/${currentUploadId}`,  // Make sure this ID is correct
        newCommentData
      );
      
      // Update comments state with the new data
      setComments(response.data.comments);
      setNewComment("");  // Optionally clear the comment input
    } catch (error) {
      console.error("Error submitting comment:", error);  // Log the error to help with debugging
    } finally{
      setIsLoading(false)
    }
  };        

  const fetchComments = useCallback(async (uploadId) => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${backend}/api/something/getPost/${uploadId}`);
      setComments(response.data.comments);  // Assuming you have a state for comments
      console.log(response.data.comments);
  
      // Optionally, you can also fetch other uploads or related data if needed
      await fetchUploads();
    } catch (error) {
      console.error("Error fetching comments:", error);
    }finally{
      setIsLoading(false)
    }
  }, [fetchUploads]);  

  const handleShareClick = (uploadId) => {
  const shareUrl = `/post/${uploadId}`;
  const shareData = {
    title: "Check This Out!",
    text: "Shared from our app",
    url: shareUrl,
  };

  if (navigator.canShare(shareData)) {
    navigator.share(shareData)
      .catch((error) => console.error("Error Sharing:", error));
  } else {
    console.log("Browser does not support sharing this type of data.");
  }
};

  const handleDelete = async (uniqueId) => { 
    setIsLoading(true)
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;

        if (!token) {
            alert("You are not authenticated. Please log in.");
            setIsLoading(false)
            return;
        }

        const response = await axios.delete(`${backend}/api/something/delete/${uniqueId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        // Check response data
        console.log('Response from server:', response.data);

        // Successfully deleted the post
        setUploads(uploads.filter(upload => upload.uniqueId !== uniqueId));
        alert('Post deleted successfully!');
        fetchUploads(); // Refresh the list of uploads
    } catch (err) {
        // Check if there's a custom error message from the server
        const errorMessage = err.response?.data?.message || 'Error deleting post. Please try again.';
        console.error('Error deleting post:', errorMessage);
        alert(errorMessage); // Display the specific error message from the server
    } finally{
      setIsLoading(false)
    }
};  

const formatTextWithLinksAndHashtags = (text) => {
  if (!text) return null;

  return text.split(/\n/).map((line, lineIndex) => (
    <div key={lineIndex} style={{ marginBottom: "10px" }}>
      {line.split(/(\s+)/).map((part, index) => {
        const hashtagRegex = /#\w+/;
        const tagRegex = /@\w+/;
        const urlRegex = /(https?:\/\/[^\s]+)/;

        if (hashtagRegex.test(part)) {
          // Render hashtags in blue
          return (
            <span
              key={index}
              style={{ color: "blue", marginRight: "5px" }}
            >
              {part}
            </span>
          );
        } else if (tagRegex.test(part)) {
          // Render mentions in blue
          return (
            <span
              key={index}
              style={{ color: "blue", marginRight: "5px" }}
            >
              {part}
            </span>
          );
        } else if (urlRegex.test(part)) {
          // Render links in blue and clickable
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "blue",
                textDecoration: "none",
                marginRight: "5px",
              }}
            >
              {part}
            </a>
          );
        } else {
          // Render regular text as it is
          return <span key={index}>{part}</span>;
        }
      })}
    </div>
  ));
};

  const openProfileModal = () => {
    setShowProfileModal(true); // Show profile modal
  };

  // Close Profile Modal
  const closeProfileModal = () => {
    setShowProfileModal(false); // Close profile modal
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
    alert("You have been logged out successfully.");
  };

  const shuffleArray = (array) => {
    const shuffledArray = [...array]; // Make a copy of the array to avoid mutating the original
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Random index from 0 to i
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
    }
    return shuffledArray;
  };

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };
  
  return (
    <div className="something" style={{ textAlign: "center", position: "relative" }}>
     {isLoading && (
    <div className="loading-overlay" style={{fontSize:"100px",zIndex:"9999"}}>
      <div className="spinner"></div>
      {/* <i class="fa-solid fa-infinity" style={{background:"transparent"}}></i> */}
    </div>
  )}

  <div className="uploadModal" > 
        <button className="modal-btn" onClick={openModal} style={{background:"none"}}><i class="fa-solid fa-paper-plane" style={{fontSize:"25px",border:"px solid white",padding:"20px",borderRadius:"50%"}}></i></button>
{/* Modal content */}
{isModalOpen && (
  <div className="modal">
    <div className="modal-content" style={{zIndex:"10000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"680px",width:"500px",marginBottom:"-160px",padding:"-100px"}}>
      <div className="upload" style={{flexDirection:"column",minHeight:"100%",width:"100%",padding:"-100px",marginBottom:"-390px",border:"none"}}>
      <button className="close-btn" onClick={closeModal} style={{background:"white",color:"black",borderRadius:"50%",padding:"13px 25px",fontSize:"18px"}}>X</button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type Something here..."
          style={{
            // position:"relative",
            display: "block",
            maxWidth: "100%",
            height: "100px",
            // margin: "10px auto",
            border:"none",
            fontSize: "20px",
            fontWeight: "600",
            marginBottom:"-6px",
            resize: "none", // Prevent resizing of the textarea
          }}
        />
        <div style={{display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-evenly",paddingTop:"-20px",paddingBottom:"-20px"}}>
        <input
          type="file"
          accept="image/*,video/*,audio/*"
          id="file-input"
          onChange={handleFileChange}
          style={{ marginBottom:"-10px",position:"absolute"}}
        />
        <label htmlFor="file-input" className="custom-file-label" style={{ fontSize: "20px" }}>
          <i className="fa-solid fa-paperclip" style={{fontSize:"28px"}}></i> {/* Upload Icon */}
        </label>
        <button className="uploadbtn" style={{ background: "black", color: "black", fontWeight: "600" }} onClick={handleUpload}>
        <i class="fa-solid fa-paper-plane" style={{fontSize:"25px",background:'none',border:"1px solid white",padding:"15px",borderRadius:"50%"}}></i>
        </button>
        </div>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"space-evenly",alignItems:"center"}}>
      {selectedFile && (
          <div style={{marginBottom:"-290px",width:"100%" }}>
            <p> Selected file: <strong>{selectedFile.name}</strong></p>
            <p style={{marginBottom:"10px"}}>It is a <strong>{getFileCategory(selectedFile)}</strong> right? </p>
            {/* Render file based on type */}
            {getFileCategory(selectedFile) === 'image' && (
              <img src={URL.createObjectURL(selectedFile)} alt="Selected File" style={{ maxWidth: "300px", maxHeight: "200px",borderRadius:"15px" }} />
            )}
            {getFileCategory(selectedFile) === 'video' && (
              <video controls style={{ maxWidth: "400px", maxHeight: "200px",borderRadius:"15px"}}>
                <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                Your browser does not support the video tag.
              </video>
            )}
            {getFileCategory(selectedFile) === 'audio' && (
              <audio controls>
                <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                Your browser does not support the audio tag.
              </audio>
            )}
            {getFileCategory(selectedFile) === 'general' && (
              <div>
                <i className="fa-solid fa-file"></i> {/* General file icon */}
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
        )}
    </div>
      </div>
      
  </div>
  </div>
)}
  </div>
      <div className="heading" >
                {/* *************************************88 */}
      <div className="header-container">
      {/* Menu Button */}
      <div className="menu-button-container" style={{marginTop:"-3px"}}>
        <button className="menu-btn" onClick={toggleMenu}>
          ☰
        </button>
      </div>
      {/* Sidebar Menu */}
      <div className={`sidebar-menu ${isMenuVisible ? "visible" : ""}`}>
        <div className="User" style={{marginTop:"30px"}}>
      {user && (
        <div className="userprofile"  onClick={openProfileModal}> {/* Click to open profile modal */}
          <img
            src={handleProfilePhoto()}
            alt={user.username}
            className="profile-photo"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "3px solid white",
              marginBottom: "5px",
            }}
          />
          <h3>{user.username}</h3>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal">
          <div className="modal-content" style={{height:"800px",marginTop:"-30px",width:"25%",display:"flex",flexDirection:"column",justifyContent:"space-evenly",alignItems:"center",minWidth:"400px"}}>
            <button className="close" onClick={closeProfileModal} style={{borderRadius:"50%"}}>X</button>
            {/* Profile Edit Section */}
            {isEditing ? (
              <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:"30px",alignItems:"center",height:"95%",marginTop:"-30px"}}>
                <form onSubmit={handleSubmit}>
                  <div style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Username:</label> <br />
                    <input
                      type="text"
                      name="username"
                      value={updatedUser.username}
                      onChange={handleChange}
                    />
                  </div>
                  <div  style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Email:</label><br />
                    <input
                      type="email"
                      name="email"
                      value={updatedUser.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Phone:</label><br />
                    <input
                      type="text"
                      name="phone"
                      value={updatedUser.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Password:</label><br />
                    <input
                      type="password"
                      name="password"
                      value={updatedUser.password}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Confirm Password:</label><br />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={updatedUser.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{marginBottom:"6px",display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-evenly"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Profile Photo :</label><br />
                    <input
                      type="file"
                      id="file-input"
                      name="profilephoto"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setSelectedFile(file)
                        setUpdatedUser((prevState) => ({
                          ...prevState,
                          profilephoto: file,
                        }));
                      }}
                    />
                    <label htmlFor="file-input" className="custom-file-label" style={{ fontSize: "10px" }}>
                      <i className="fa-solid fa-paperclip" style={{ fontSize: "28px" }}></i> {/* Upload Icon */}
                    </label>
                    </div>
                    {selectedFile && (
                      <img src={URL.createObjectURL(selectedFile)} alt="" style={{width:"60px", height:"60px",objectFit:"cover", borderRadius:"50%",border:"2px solid white",marginBottom:"1px",marginTop:"2px"}}/>
                    )}
                    <br />
                  
                  <button type="submit" style={{ borderRadius: "15px", padding: "10px"}}>
                    Save Changes
                  </button>
                </form>
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",justifyContent:"space-evenly",alignItems:"center",gap:"20px",height:"70%",width:"80%",marginTop:"-50px"}}>
                <img src={handleProfilePhoto()} width="100px" height="100px" alt="" style={{borderRadius:"50%",border:"2px solid white"}} />
                <h3> <span style={{textDecoration:"underline",marginRight:"10px"}}>Username: </span> <br />{updatedUser.username}</h3>
                <h3><span style={{textDecoration:"underline",marginRight:"10px"}}>Email: </span><br /> {updatedUser.email}</h3>
                <h3><span style={{textDecoration:"underline",marginRight:"10px"}}>Phone No.: </span><br /> {updatedUser.phone}</h3>
                <button onClick={toggleEditMode} style={{ marginTop: '10px' }}>
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      <div className="logout" style={{color:"red"}}>
          <button onClick={handleLogout}>Logout?</button>
        </div>
        <div>
          <ul>
            <li>
              <a href="https://sujan2332.github.io/Youtube-Reactjs/"><i class="fa-brands fa-youtube"></i> Youtube</a>
            </li>
            <li>
              <a href="https://sujan2332.github.io/ChainReaction/"><i class="fa-solid fa-atom"></i> Chain Reaction</a>
            </li>
            <li>
              <a href="https://sujan2332.github.io/TODO/"><i class="fa-solid fa-check"></i> Todo</a>
            </li>
            <li>
              <a href="https://Sujan2332.github.io/IMDB-JS"><i class="fa-solid fa-clapperboard"></i> Movies</a>
            </li>
            <li>
              <a href="https://sujan2332.github.io/WeatherApp/"><i class="fa-solid fa-cloud-bolt"></i> Weather</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
        {/* *************************************88 */}
      {/* <NavBar /> */}
      <div className="menu-container">
      <button onClick={toggleDropdown} className="menu-toggle">
      ☰ 
      {/* <i className={`fa ${isDropdownOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i> */}
      </button>
      {isDropdownOpen && (
        <ul className="dropdown-menu">
          <li>
            <a href="https://sujan2332.github.io/Youtube-Reactjs/">
              <i className="fa-brands fa-youtube"></i> Youtube
            </a>
          </li>
          <li>
            <a href="https://sujan2332.github.io/ChainReaction/">
              <i className="fa-solid fa-atom"></i> Chain Reaction
            </a>
          </li>
          <li>
            <a href="https://sujan2332.github.io/TODO/">
              <i className="fa-solid fa-check"></i> Todo
            </a>
          </li>
          <li>
            <a href="https://Sujan2332.github.io/IMDB-JS">
              <i className="fa-solid fa-clapperboard"></i> Movies
            </a>
          </li>
          <li>
            <a href="https://sujan2332.github.io/WeatherApp/">
              <i className="fa-solid fa-cloud-bolt"></i> Weather
            </a>
          </li>
        </ul>
      )}
    </div>
    <div className="Navbar">
    <div className="HeadTitle">
        <h1 style={{color:"white"}}>
          Something...<i class="fa-solid fa-infinity"></i>
        </h1>
      </div>
    <div className="User" style={{cursor:"pointer"}}>
      {user && (
        <div className="user-profile"  onClick={openProfileModal}> {/* Click to open profile modal */}
          <img
            src={handleProfilePhoto()}
            alt={user.username}
            className="profile-photo"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "3px solid white",
              marginBottom: "-10px",
            }}
          />
          <h3>{user.username}</h3>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal">
          <div className="modal-content" style={{height:"800px",marginTop:"-30px",width:"25%",display:"flex",flexDirection:"column",justifyContent:"space-evenly",alignItems:"center",minWidth:"400px"}}>
            <button className="close" onClick={closeProfileModal} style={{borderRadius:"50%"}}>X</button>
            {/* Profile Edit Section */}
            {isEditing ? (
              <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:"30px",alignItems:"center",height:"95%",marginTop:"-30px"}}>
                <form onSubmit={handleSubmit}>
                  <div style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Username:</label> <br />
                    <input
                      type="text"
                      name="username"
                      value={updatedUser.username}
                      onChange={handleChange}
                    />
                  </div>
                  <div  style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Email:</label><br />
                    <input
                      type="email"
                      name="email"
                      value={updatedUser.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Phone:</label><br />
                    <input
                      type="text"
                      name="phone"
                      value={updatedUser.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Password:</label><br />
                    <input
                      type="password"
                      name="password"
                      value={updatedUser.password}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{marginBottom:"2px"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Confirm Password:</label><br />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={updatedUser.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{marginBottom:"6px",display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-evenly"}}>
                    <label style={{marginRight:"10px",textDecoration:"underline"}}>Profile Photo :</label><br />
                    <input
                      type="file"
                      id="file-input"
                      name="profilephoto"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setSelectedFile(file)
                        setUpdatedUser((prevState) => ({
                          ...prevState,
                          profilephoto: file,
                        }));
                      }}
                    />
                    <label htmlFor="file-input" className="custom-file-label" style={{ fontSize: "10px" }}>
                      <i className="fa-solid fa-paperclip" style={{ fontSize: "28px" }}></i> {/* Upload Icon */}
                    </label>
                    </div>
                    {selectedFile && (
                      <img src={URL.createObjectURL(selectedFile)} alt="" style={{width:"60px", height:"60px", borderRadius:"50%",border:"2px solid white",marginBottom:"1px",marginTop:"2px"}}/>
                    )}
                    <br />
                  
                  <button type="submit" style={{ borderRadius: "15px", padding: "10px"}}>
                    Save Changes
                  </button>
                </form>
              </div>
            ) : (
              <div className="editprofile" style={{display:"flex",flexDirection:"column",justifyContent:"space-evenly",alignItems:"center",gap:"20px",height:"70%",width:"80%",marginTop:"-50px"}}>
                <img src={handleProfilePhoto()} width="80px" height="80px" alt="" style={{borderRadius:"50%",marginTop:"-20px",border:"2px solid white",marginBottom:"15px"}} />
                <h3> <span style={{textDecoration:"underline",marginRight:"10px"}}>Username: </span> <br />{updatedUser.username}</h3>
                <h3><span style={{textDecoration:"underline",marginRight:"10px"}}>Email: </span><br /> {updatedUser.email}</h3>
                <h3><span style={{textDecoration:"underline",marginRight:"10px"}}>Phone No.: </span><br /> {updatedUser.phone}</h3>
                <button onClick={toggleEditMode} style={{ marginTop: '10px' }}>
                  Edit Profile
                </button>
                <div>
        <button onClick={handleLogout} style={{ marginTop: '10px',color:"red", fontSize:"18px",fontWeight:"600" }}>
          Logout ?
        </button>
            </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
      
      </div>
      <div className="MainSection" >
      <div className="upload" >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type Something here..."
          style={{
            position:"relative",
            display: "block",
            width: "500px",
            height: "200px",
            margin: "10px auto",
            border:"none",
            fontSize: "20px",
            fontWeight: "600",
            resize: "none", // Prevent resizing of the textarea
          }}
        />
        <input
          type="file"
          accept="image/*,video/*,audio/*"
          id="file-input"
          onChange={handleFileChange}
          style={{ marginBottom: "10px" ,position:"absolute"}}
        />
        <label htmlFor="file-input" className="custom-file-label" style={{ fontSize: "20px" }}>
          <i className="fa-solid fa-paperclip" style={{fontSize:"28px"}}></i> {/* Upload Icon */}
        </label>
        <button className="uploadbtn" style={{ background: "black", color: "black", fontWeight: "600" }} onClick={handleUpload}>
        <i class="fa-solid fa-paper-plane" style={{fontSize:"25px",background:'none',border:"1px solid white",padding:"20px",borderRadius:"50%"}}></i>
        </button>
      </div>
      {selectedFile && (
          <div style={{ marginBottom: "10px" }}>
            <p style={{width:"600px"}}> Selected file: <br /> <strong>{selectedFile.name}</strong></p>
            <p style={{marginBottom:"10px"}}>It is a <strong>{getFileCategory(selectedFile)}</strong> right? </p>
            {/* Render file based on type */}
            {getFileCategory(selectedFile) === 'image' && (
              <img src={URL.createObjectURL(selectedFile)} alt="Selected File" style={{ maxWidth: "500px", maxHeight: "200px",margin:"20px",borderRadius:"15px" }} />
            )}
            {getFileCategory(selectedFile) === 'video' && (
              <video controls style={{ maxWidth: "500px", maxHeight: "300px" ,margin:"20px",borderRadius:"15px"}}>
                <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                Your browser does not support the video tag.
              </video>
            )}
            {getFileCategory(selectedFile) === 'audio' && (
              <audio controls>
                <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                Your browser does not support the audio tag.
              </audio>
            )}
            {getFileCategory(selectedFile) === 'general' && (
              <div>
                <i className="fa-solid fa-file"></i> {/* General file icon */}
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
        )}

      <h2>Feeds...</h2>
      <div className="feeds">
        {uploads.length > 0 ? (
           [...uploads].reverse().map((upload, index) => (
          // shuffleArray(uploads).map((upload, index) => (
            <div className="card" key={index} onClick={() => handleCardClick(upload.uniqueId)} style={{cursor:"pointer"}}>              
              <div style={{display:"flex",alignItems:"end",justifyContent:"end",width:"100%",background:"transparent",marginBottom:"20px",marginTop:"10px"}}>
              <div style={{background:"transparent",display:"flex",alignItems:"center",justifyContent:"left",width:"80%",height:"50px"}}>
                <img src={upload.profilePhoto ? `${upload.profilePhoto}` : `${backend}/${upload.profilePhoto}` } alt={upload.username} width="60px" height="60px" style={{borderRadius:"50%",margin:"none",border:"2px solid black",width:"60px",height:"60px"}}/>
                <h4 style={{background:"transparent",margin:"none",textDecoration:"underline"}}>{upload.username}</h4>
                <span style={{margin:"0px 10px",background:"none"}}>•</span>
                <h5 style={{background:"none"}}>
                {upload.createdAt && !isNaN(new Date(upload.createdAt).getTime())
                ? (new Date() - new Date(upload.createdAt) < 60000 // Check if within 1 minute
                ? "Just now"
                : formatDistanceToNow(new Date(upload.createdAt), { addSuffix: true })
                .replace("about ", "")
                .replace("less than ", ""))
                : "Just now"}
                </h5>
                </div>
              <select
  name="actionOptions"
  id="options"
  style={{cursor:"pointer",background:"black",color:"white",marginBottom:"10px",borderRadius:"15px",border:"1px solid white",padding:"5px",marginRight:"4px"}}
  onClick={(e)=> {e.stopPropagation(); e.preventDefault() }}
  onChange={(e) => {
    if (e.target.value === "delete") {
      handleDelete(upload.uniqueId);
    } else if (e.target.value === "like") {
      toggleHeart(upload.uniqueId);
    } else if (e.target.value === "comment") {
      handleCommentClick(upload.uniqueId);
    } else if (e.target.value === "share") {
      handleShareClick(upload.uniqueId);
    } else {
      e.target.value = ""; // Reset the input if no valid option is selected
    }
  }}
>
  <option value="">Options ♾️</option>
  <option value="like">Like <span>💖</span></option>
  <option value="retweet">ReShare 🔁</option>
  <option value="comment">Comment 💬</option>
  <option value="share">Share 📩</option>
  <option value="delete">Delete 🗑️<i className="delete fa-regular fa-trash-can" style={{fontSize:"25px",marginBottom:"15px",background:"black",color:"black"}}></i></option>
</select>
                </div>
                <h4
  style={{
    width: "100%",
    maxWidth: "100%",
    height: "auto",
    padding: "20px",
    wordWrap: "break-word",
    borderRadius: "15px",
    textAlign:"left"
  }}
>
  {formatTextWithLinksAndHashtags(upload.text)}
</h4>
              {/* <h4 style={{width:"100%",maxWidth:"100%",height:"auto",padding:"10px",wordWrap:"break-word",borderRadius:"15px",padding:"10px"}}>{upload.text}</h4> */}
              {upload.imageFile && <img src={upload.imageFile} style={{margin:"20px",borderRadius:"15px",width:"100%"}} alt={upload.imageFile} className="upload-image" onClick={(e) =>{ e.stopPropagation(); handleImageClick(upload.imageFile)}}/>}
              {isImageOpen && image && (<div style={{position:"fixed", top:0,left:0,width:"100%",height:"100%",background:"rgba(0, 0, 0, 0.09)",display:"flex",justifyContent:"center",alignItems:"center",zIndex:1000}} onClick={(e) =>{ e.stopPropagation(); handleModalClose()}}>
                <button onClick={handleDownload} style={{position:"absolute",top:30,right:"0",transform:"translate(-50%)",padding:"10px 20px",background:"white",color:"red",border:"none",borderRadius:"5px",cursor:"pointer",fontSize:"16px"}}><i class="fa-solid fa-download" style={{background:"none",color:"blue",fontSize:"20px",padding:"5px 0px"}}></i></button>
                <div style={{position:"relative",borderRadius:"15px",display:"flex",justifyContent:"center",marginTop:"30px",alignItems:"center",padding:"10px",width:"85%",height:"85%",background:"none"}}>
                  <img src={image} alt="Full Screen View" style={{minWidth:"30%",maxWidth:"100%",maxHeight:"100%",borderRadius:"10px",boxShadow:"8px 6px 8px rgba(255, 255, 255, 0.2),2px 8px 20px rgba(255, 255, 255, 0.19)"}} />
                </div>
              </div> )}
              {upload.videoFile && <video src={upload.videoFile} style={{margin:"20px",borderRadius:"15px", width:"100%"}}controls className="upload-video"  onClick={(e)=>{e.stopPropagation()}}/>}
              {/* {upload.audioFile && <audio src={upload.audioFile} style={{margin:"20px",borderRadius:"15px"}} controls />} */}
              {upload.audioFile && (<div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "20px", padding: "20px", borderRadius: "15px", background: "#1E1E1E",  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.4)",width: "100%", transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",}} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}  >
                <audio onClick={(e)=>{e.stopPropagation()}} src={upload.audioFile} controls style={{width: "100%", borderRadius: "10px", background: "#333", padding: "5px",outline: "none",marginBottom: "15px", }} />
                <div style={{ color: "#fff", fontSize: "16px", textAlign: "center", marginTop: "10px",borderRadius:"15px" ,padding:"10px"}}>
                <strong >{upload.fileName || "Untitled Track"}</strong>
                </div>
                </div>
              )}
              {upload.documentFile && <div style={{width:"100%",padding:"10px",display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-evenly",fontSize:"20px",marginTop:"10px",borderRadius:"15px",paddingLeft:"10px",paddingRight:"10px",marginBottom:"10px"}}><h5><i class="fa-regular fa-file" style={{marginRight:"10px"}}></i>{upload.fileName || "Untitled Document"}</h5>  <a href={`/uploads/${upload.documentFile}`} download style={{textDecoration:"none",fontWeight:"600",color:"red",border:"1px solid white",padding:"5px",borderRadius:"15px",margin:"10px",background:"white"}} onClick={(e)=>{e.stopPropagation()}}>Download</a></div> }
              <div className="like-section" style={{width:"100%",background:"transparent",display:"flex",flexDirection:"row",justifyContent:"center",alignItems:"center",marginTop:"10px",marginBottom:"10px"}} onClick={(e) => e.stopPropagation()}>
              <i onClick={() => toggleHeart(upload.uniqueId)} className="fa-solid fa-heart" style={{ cursor: 'pointer', fontSize: '24px', background: 'transparent', color: likesData[upload.uniqueId]?.isLiked? 'red' : 'gray'}}></i>
              <span style={{ background: 'transparent', marginRight: '80px', marginLeft: '10px' }}>
              {likesData[upload.uniqueId]?.likes} {/* Display total likes */}
              </span>
                <i class="fa-solid fa-repeat" style={{color:"rgb(7, 237, 3)",fontSize:"25px",background:"transparent"}}></i> <span style={{marginRight:"80px",marginLeft:"10px",background:"transparent"}}>0</span>
                <i class="fa-solid fa-comment" onClick={()=>handleCommentClick(upload.uniqueId)} style={{ cursor: 'pointer', fontSize: '24px',background:"transparent"}}></i>
                <span style={{background:"transparent",marginRight:"80px",marginLeft:"10px"}}>{upload.commentsno}</span>
                <i class="fa-solid fa-share" onClick={()=>handleShareClick(upload.uniqueId)} style={{ cursor: 'pointer', fontSize: '24px',background:"transparent"}}></i>
              </div>
            </div>
          ))
        ) : (
          <p>No uploads yet...</p>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <button className="close" onClick={handleCloseModal} style={{borderRadius:"50%"}}>X</button>
            <textarea value={newComment} onChange={(e)=>setNewComment(e.target.value)} placeholder="Add a Comment..." className="comment-textarea" style={{minHeight:"100px",marginBottom:"-40px",marginTop:"-20px",textAlign:"center"}}></textarea>
            <button className="submit-comment" onClick={handleCommentSubmit} style={{background:"none",border:"1px solid white",borderRadius:"50%",paddingTop:"11px",paddingBottom:"11px",marginBottom:"-30px",marginTop:"20px"}}><i style={{fontSize:"20px",marginTop:"7px",marginBottom:"8px"}} class="fa-regular fa-paper-plane"></i></button>
            <h3 style={{marginBottom:"-30px",marginTop:"10px"}}>Comments</h3>
            
            <div
  className="comments-section"
  style={{
    width: "100%",
    maxHeight: "400px", // Set a fixed height for the comment section
    overflowY: "auto", // Enables vertical scrolling when content overflows
    padding: "10px", // Optional, adds padding inside the scrollable area
    borderRadius: "8px", // Optional, rounds the corners for smoother edges
    backgroundColor: "#f1f1f1",
  }}
>
{comments.length > 0 ? (
  comments.map((comment, index) => (
    <div
      key={index}
      style={{
        width: "90%",
        border: "1px solid white",
        borderRadius: "15px",
        padding: "10px",
        margin: "10px",
      }}
      className="comment-item"
    >
      {/* Render the username, profile photo, and comment text */}
      <div style={{ display: "flex", alignItems: "center",flexDirection:"row",marginBottom:"0px",marginTop:"-10px" }}>
      <img
  src={comment.profilePhoto ? `${comment.profilePhoto}` : `${backend}/${comment.profilePhoto}`} // Ensure profile photo URL is absolute
  alt={comment.username}
  style={{ width: "45px", height: "45px", borderRadius: "50%", marginRight: "" }}
/>
        <p style={{marginTop:"-10px",textDecoration:"none"}}>{comment.username}</p>
      </div>
      <hr style={{marginTop:"-10px",marginBottom:"10px"}}/>
      <p style={{ textAlign: "left", width: "100%",textAlign:"center" }}>
      {formatTextWithLinksAndHashtags(comment.text)} {/* Assuming 'text' is the field name for the comment */}
      </p>
    </div>
  ))
) : (
  <p>No comments yet...</p>
)}
</div>
    </div>
  </div>
)}
</div>
    </div>
  );
}

export default ImageUploader;
