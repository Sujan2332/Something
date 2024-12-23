import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Post = () => {
  const { uniqueId } = useParams();
  const navigate = useNavigate();
  // States
  const [post, setPost] = useState(null); // To store the fetched post data
  const [user, setUser] = useState(null); // To store the logged-in user's data
  const [userId, setUserId] = useState(null); // To store the user's unique ID
  const [likesData, setLikesData] = useState({}); // To manage likes
  const [image, setImage] = useState(null); // To store the currently selected image
  const [isImageOpen, setIsImageOpen] = useState(false); // To toggle image modal
  const [newComment, setNewComment] = useState(''); // To store the new comment input
  const [comments, setComments] = useState([]); // To store the list of comments
  const [uploads, setUploads] = useState([]); // To store all uploads
  const [isLoading, setIsLoading] = useState(false); // To manage loading state
  const [updatedUser, setUpdatedUser] = useState(null); // For updating user details
  const [currentUploadId, setCurrentUploadId] = useState(uniqueId); // For managing the current upload ID

  // const backend = import.meta.env.VITE_REACT_BACKEND_URL ;
  const backend = `https://something-backend.onrender.com`
  // const backend = `http://localhost:5000`

  // Fetch post data on component load
  useEffect(() => {
    fetch(`${backend}/api/something/getPost/${uniqueId}`)
      .then(response => response.json())
      .then(data => {
        setPost(data);
        setComments(data.comments || []);
      })
      .catch(error => {
        console.error('Error fetching post:', error);
      });
  }, [uniqueId]);

  // Fetch user and likes data on load
  useEffect(() => {
    const storedUserId = getUserId();
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
          setUpdatedUser(response.data.user);
        })
        .catch(error => console.error("Error fetching user details:", error));
    }
  }, []);

  // Utility to get user ID from localStorage
  const getUserId = () => {
    const USERLOG = localStorage.getItem("user");
    if (USERLOG) {
      const parsedUser = JSON.parse(USERLOG);
      return parsedUser?.uniqueId || null;
    }
    return null;
  };

  const toggleHeart = async (uniqueId) => {
    if (!userId) {
      console.error("User ID is not available");
      return;
    }

    const currentLikeState = likesData[uniqueId]?.isLiked?.[userId] ?? false;
    const newLikeState = !currentLikeState;

    try {
      const response = await axios.patch(`${backend}/api/something/upload/${uniqueId}`, {
        userId,
        isLiked: newLikeState,
      });

      setLikesData((prevState) => {
        const updatedData = {
          ...prevState,
          [uniqueId]: {
            ...prevState[uniqueId],
            isLiked: {
              ...prevState[uniqueId]?.isLiked,
              [userId]: newLikeState,
            },
            likes: response.data.likes,
          },
        };
        localStorage.setItem('likesData', JSON.stringify(updatedData));
        return updatedData;
      });
    } catch (err) {
      console.error("Error updating like:", err);
    }
  };

  const handleShareClick = (uploadId) => {
    const shareUrl = `/post/${uploadId}`;
    navigator.share({
      title: "Check This Out!",
      url: shareUrl,
    }).catch((error) => console.error("Error Sharing:", error));
  };

  const handleDelete = async (uniqueId) => {
    setIsLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
  
      if (!token) {
        alert("You are not authenticated. Please log in.");
        setIsLoading(false);
        return;
      }

      if (user._id !== post.user) {
        alert("You are not authorized to delete this post.");
        setIsLoading(false);
        return;
      }

      const response = await axios.delete(`${backend}/api/something/delete/${uniqueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status === 200 || response.status === 204) {
        setUploads(uploads.filter(upload => upload.uniqueId !== uniqueId));
        alert('Post deleted successfully!');
        navigate("/");
      }
    } finally {
      setIsLoading(false);
    }
  };  

  const handleImageClick = (imageSrc) => {
    setImage(imageSrc);
    setIsImageOpen(true);
  };

  const formatTextWithLinksAndHashtags = (text) => {
    if (!text) return null;

    return text.split(/(\s+)/).map((part, index) => {
      const hashtagRegex = /#\w+/;
      const tagRegex = /@\w+/;
      const urlRegex = /(https?:\/\/[^\s]+)/;

      if (hashtagRegex.test(part)) {
        return (
          <span
            key={index}
            style={{ color: "blue", display: "block", marginBottom: "5px" }}
          >
            {part}
          </span>
        );
      } else if (tagRegex.test(part)) {
        return (
          <span key={index} style={{ color: "blue", display: "block", marginBottom: "5px" }}>
            {part}
          </span>
        );
      } else if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "blue",
              display: "block",
              textDecoration: "none",
              marginBottom: "5px",
            }}
          >
            {part}
          </a>
        );
      } else {
        return <span key={index}>{part}</span>;
      }
    });
  };

  const handleModalClose = () => {
    setIsImageOpen(false);
    setImage(null);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image;
    link.download = 'image.jpg';
    link.click();
  };

  const handleCommentSubmit = async () => {
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
      setIsLoading(true);
      const response = await axios.patch(
        `${backend}/api/something/upload/${currentUploadId}`,
        newCommentData
      );

      setComments(response.data.comments);
      setNewComment("");
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Early return in case post is still loading
  if (!post) {
    return (
        <div className="loading-overlay" style={{fontSize:"100px",zIndex:"9999",background:"black"}}>
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div style={{display:'flex',flexDirection:"column",justifyContent:"space-between",alignItems:"center"}}>
       {isLoading && (
    <div className="loading-overlay" style={{fontSize:"100px",zIndex:"9999"}}>
      <div className="spinner"></div>
      {/* <i class="fa-solid fa-infinity" style={{background:"transparent"}}></i> */}
    </div>
  )}
      <nav style={{padding:"30px",width:"100%"}}>
      <h1 style={{fontSize:"35px",textDecoration:"underline",marginLeft:"20px"}}><i class="fa-solid fa-arrow-left" style={{marginRight:"20px",cursor:"pointer"}} onClick={()=>{navigate("/")}}></i> Post</h1>
      </nav>
    <div className="card" style={{width:"70%"}}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'transparent', marginBottom: '20px', marginTop: '10px'}}>
        <div style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'left', width: '80%', height: '50px'}}>
          <img src={post.profilePhoto ? `${post.profilePhoto}` : `${backend}/${post.profilePhoto}`} alt={post.username} width="60px" height="60px" style={{ borderRadius: '50%', margin: 'none', border: '2px solid black', width: '60px', height: '60px' }} />
          <h4 style={{ background: 'transparent', margin: 'none', textDecoration: 'underline' }}>{post.username}</h4>
          <span style={{ margin: '0px 10px', background: 'none' }}>•</span>
          <h5 style={{ background: 'none' }}>
            {post.createdAt && !isNaN(new Date(post.createdAt).getTime())
              ? new Date() - new Date(post.createdAt) < 60000
                ? 'Just now'
                : formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }).replace('about ', '').replace('less than ', '')
              : 'Just now'}
          </h5>
        </div>
        <select
          name="actionOptions"
          id="options"
          style={{ background: 'black', color: 'white', marginBottom: '10px', borderRadius: '15px', border: '1px solid white', padding: '5px', marginRight: '4px' }}
          onChange={(e) => {
            if (e.target.value === 'delete') {
              handleDelete(post.uniqueId);
            } else if (e.target.value === 'like') {
              toggleHeart(post.uniqueId);
            } else if (e.target.value === 'comment') {
              handleCommentClick(post.uniqueId);
            } else if (e.target.value === 'share') {
              handleShareClick(post.uniqueId);
            }
          }}
        >
          <option value="">Options ♾️</option>
          <option value="like">Like 💖</option>
          <option value="retweet">ReShare 🔁</option>
          <option value="comment">Comment 💬</option>
          <option value="share">Share 📩</option>
          <option value="delete">Delete 🗑️</option>
        </select>
      </div>

      <h4 style={{ width: '100%', maxWidth: '100%', height: 'auto', padding: '20px', wordWrap: 'break-word', borderRadius: '15px', textAlign: 'left' }}>
        {formatTextWithLinksAndHashtags(post.text)}
      </h4>
      {post.imageFile && <img src={post.imageFile} style={{ margin: '20px', borderRadius: '15px', width: '100%' }} alt={post.imageFile} onClick={() => handleImageClick(post.imageFile)} />}
      {isImageOpen && image && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0, 0, 0, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={handleModalClose}>
          <button onClick={handleDownload} style={{ position: 'absolute', top: 30, right: '0', transform: 'translate(-50%)', padding: '10px 20px', background: 'white', color: 'red', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
            <i className="fa-solid fa-download" style={{ background: 'none', color: 'blue', fontSize: '20px', padding: '5px 0px' }}></i>
          </button>
          <div style={{ position: 'relative', borderRadius: '15px', display: 'flex', justifyContent: 'center', marginTop: '30px', alignItems: 'center', padding: '10px', width: '85%', height: '85%', background: 'none' }}>
            <img src={image} alt="Full Screen View" style={{ minWidth: '30%', maxWidth: '100%', maxHeight: '100%', borderRadius: '10px', boxShadow: '8px 6px 8px rgba(255, 255, 255, 0.2),2px 8px 20px rgba(255, 255, 255, 0.19)' }} />
          </div>
        </div>
      )}

      {post.videoFile && <video src={post.videoFile} style={{ margin: '20px', borderRadius: '15px', width: '100%' }} controls />}
      {post.audioFile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px', padding: '20px', borderRadius: '15px', background: '#1E1E1E', boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)', width: '100%' }}>
          <audio src={post.audioFile} controls style={{ width: '100%', borderRadius: '10px', background: '#333', padding: '5px', outline: 'none', marginBottom: '15px' }} />
          <div style={{ color: '#fff', fontSize: '16px', textAlign: 'center', marginTop: '10px', borderRadius: '15px', padding: '10px' }}>
            <strong>{post.fileName || 'Untitled Track'}</strong>
          </div>
        </div>
      )}

      {post.documentFile && (
        <div style={{ width: '100%', padding: '10px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly', fontSize: '20px', marginTop: '10px', borderRadius: '15px' }}>
          <h5>
            <i className="fa-regular fa-file" style={{ marginRight: '10px' }}></i>
            {post.fileName || 'Untitled Document'}
          </h5>
          <a href={`/uploads/${post.documentFile}`} download style={{ textDecoration: 'none', fontWeight: '600', color: 'red', border: '1px solid white', padding: '5px', borderRadius: '15px', margin: '10px', background: 'white' }}>
            Download
          </a>
        </div>
      )}

<div className="like-section" style={{width:"100%",background:"transparent",display:"flex",flexDirection:"row",justifyContent:"center",alignItems:"center",marginTop:"10px",marginBottom:"10px" }} onClick={(e)=>{e.stopPropagation()}}>
              <i onClick={() => toggleHeart(post.uniqueId)} className="fa-solid fa-heart" style={{ cursor: 'pointer', fontSize: '24px', background: 'transparent', color: likesData[post.uniqueId]?.isLiked? 'red' : 'gray'}}></i>
              <span style={{ background: 'transparent', marginRight: '80px', marginLeft: '10px' }}>
              {likesData[post.uniqueId]?.likes} {/* Display total likes */}
              </span>
                <i class="fa-solid fa-repeat" style={{color:"rgb(7, 237, 3)",fontSize:"25px",background:"transparent"}}></i> <span style={{marginRight:"80px",marginLeft:"10px",background:"transparent"}}>0</span>
                <i class="fa-solid fa-comment postcomment" onClick={()=>handleCommentClick(upload.uniqueId)} style={{ cursor: 'pointer', fontSize: '24px',background:"transparent"}}></i>
                <span style={{background:"transparent",marginRight:"80px",marginLeft:"10px"}}>{post.commentsno}</span>
                <i class="fa-solid fa-share" onClick={()=>handleShareClick(post.uniqueId)} style={{ cursor: 'pointer', fontSize: '24px',background:"transparent"}}></i>
              </div>
      <div style={{ marginTop: '20px',width:"100%",padding:"20px",borderRadius:"50px" }}>
      <h1 style={{marginLeft:"10px",textDecoration:"underline"}}>Comments :</h1>
          <div style={{ padding: '10px'}}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows="4"
          style={{ width: '100%', padding: '10px', borderRadius: '15px', border: '1px solid #ccc', fontSize: '14px', marginBottom: '10px' }}
        />
        <button onClick={handleCommentSubmit} style={{ background: 'blue', color: 'white', padding: '10px 15px', borderRadius: '15px', cursor: 'pointer' }}>
        
        <h4 style={{background:"none"}}>Submit Comment <i class="fa-solid fa-paper-plane" style={{background:"none",marginLeft:"10px"}}></i></h4>
        </button>
      </div>
      {comments.length > 0 && (
        <div style={{ marginTop: '0px',width:"100%",padding:"20px",borderRadius:"50px" }}>
          <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px',marginBottom:"10px" }}>
            {comments.map((comment, index) => (
              <div key={index} style={{ marginBottom:"10px",display: 'flex', alignItems: 'flex-start',flexDirection:"column",border:"1px solid white",borderRadius:"50px",paddingLeft:"20px" }}>
                <div style={{display:"flex",flexDirection:"row",alignItems:"center",padding:"0px 10px",marginTop:"15px"}}>
                <img src={comment.profilePhoto} alt={comment.username} style={{ width: '50px', height: '50px', borderRadius: '50%', marginRight: '10px',border:"1px solid white",marginLeft:"1px",margin:"0px 10px" }} />
                <h4 style={{textDecoration:"underline"}}>{comment.username}</h4>
                </div>
                <div style={{marginLeft :"80px",marginBottom:"10px"}}>
        <h4 style={{marginRight:"60px",textAlign:"left"}}>{formatTextWithLinksAndHashtags(comment.text)}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
    </div>
  );
};

export default Post;
