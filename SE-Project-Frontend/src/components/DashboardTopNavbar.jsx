import React, { useState, useEffect, useRef } from 'react'; // React hooks
import { Link, useNavigate } from 'react-router-dom'; // Navigation hooks
import './DashboardLayout.css';
import ConfirmPopup from './ConfirmPopup'; // Confirmation modal
import { useTheme } from '../contexts/ThemeContext'; // Custom theme context

import {  FiBook, FiUser, FiHome, FiLogOut, FiSun, FiMoon } from 'react-icons/fi'; // Feather icons
import { IoLibraryOutline } from 'react-icons/io5'; // Ionicons
import { BsChatHeart } from "react-icons/bs"; // Bootstrap icon

export default function DashboardTopNavbar() {
  const navigate = useNavigate(); // Hook for navigation
  const navRef = useRef(null); // Ref for the navbar element
  const [user, setUser] = useState(null); // State for current user data
  const [dropdownOpen, setDropdownOpen] = useState(false); // State for dropdown visibility
  const profileMenuRef = useRef(null); // Ref to detect clicks outside the profile menu
  const [showConfirm, setShowConfirm] = useState(false); // State for logout confirmation popup
  const { theme, toggleTheme } = useTheme(); // Access theme state and toggle function

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const storedUser = localStorage.getItem('user'); // Get regular user data
    const storedCounsellor = localStorage.getItem('counsellor'); // Get counsellor data

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (storedCounsellor) {
      const parsedCounsellor = JSON.parse(storedCounsellor);
      setUser(parsedCounsellor);
      // Also fetch fresh data to ensure we have latest profilePic
      const token = localStorage.getItem('token');
      if (token) {
        (async () => { // IIFE for async fetch
          try {
            const res = await fetch(`${API_URL}/api/counsellors/profile`, { // Fetch latest counsellor profile
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.counsellor) {
                localStorage.setItem('counsellor', JSON.stringify(data.counsellor)); // Update local storage
                setUser(data.counsellor);
              }
            }
          } catch (e) { /* ignore */ }
        })();
      }
    } else {
      navigate('/'); // Redirects if no user is found
    }
  }, [navigate]); // Dependency array includes navigate

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const setVar = () => document.documentElement.style.setProperty('--navbar-height', `${el.offsetHeight}px`); // Set CSS variable for navbar height
    setVar();
    window.addEventListener('resize', setVar);
    return () => window.removeEventListener('resize', setVar); // Cleanup function
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setDropdownOpen(false); // Close dropdown on outside click
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside); // Cleanup function
  }, []);

  const handleLogout = () => {
    setShowConfirm(true); // Show confirmation popup
  };

  const confirmLogout = () => {
    try {
      if (window.socket) { // Disconnect socket connection if it exists
        try { window.socket.disconnect(); } catch (e) {}
        try { window.socket = null; } catch (e) {}
      }
    } catch (e) {}
    localStorage.removeItem('user'); // Clear user data
    localStorage.removeItem('token'); // Clear auth token
    localStorage.removeItem('counsellor'); // Clear counsellor data
    setUser(null);
    setShowConfirm(false);
    navigate('/'); // Redirect to home page
  };

  const cancelLogout = () => {
    setShowConfirm(false); // Hide confirmation popup
  };

  return (
    <>
  <div ref={navRef} className="navbar-top"> {/* Navbar container */}
        <div className="navbar-logo">
          <img src="/assets/logo.png" alt="ManoDarpan Logo" className="logo-image" />
          <Link to="/" className="logo-text">
            ManoDarpan
          </Link>
        </div>
        <div ref={profileMenuRef} className="profile-menu"> {/* Profile and settings menu */}
          <button onClick={toggleTheme} className="theme-toggle-button"> {/* Theme toggle button */}
            {theme === 'light' ? <FiSun /> : <FiMoon />}
          </button>
          <button className="profile-button" onClick={() => setDropdownOpen(!dropdownOpen)}> {/* Profile picture button */}
            <img src={(user && user.profilePic) || (JSON.parse(localStorage.getItem('counsellor') || 'null')?.profilePic) || '/assets/male.svg'} alt="User Profile" style={{ width: '36px', height: '36px', borderRadius: '50%' }} /> {/* Dynamic profile pic source */}
            <span>{user?.name ? (user.name.split(' ')[0]) : ''}</span> {/* Display user's first name */}
          </button>
          <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}> {/* Dropdown menu with dynamic class */}
            {localStorage.getItem('counsellor') ? ( // Conditional rendering based on user type
              // counsellor-specific menu
              <>
                <Link to="/chat-counsellor" className="dropdown-item"><FiHome className="nav-link-icon" />Home</Link>
                <Link to="/profile" className="dropdown-item"><FiUser className="nav-link-icon" />Profile</Link>
                <div className="dropdown-divider"></div>
                <button className='dropdown-item' onClick={toggleTheme}>{theme === 'light' ? <FiSun className="nav-link-icon"/> : <FiMoon className="nav-link-icon"/>}{theme === 'light' ? "Light" : 'Dark'}</button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-button" onClick={handleLogout}><FiLogOut className="nav-link-icon" />Logout</button>
              </>
            ) : (
              // regular user menu
              <>
                <Link to="/dashboard" className="dropdown-item"><FiHome className="nav-link-icon" />Dashboard</Link>
                <Link to="/journal" className="dropdown-item"><FiBook className="nav-link-icon" />Journal</Link>
                <Link to="/library" className="dropdown-item"><IoLibraryOutline className="nav-link-icon" />Library</Link>
                <div className="dropdown-divider"></div>
                <button className='dropdown-item' onClick={toggleTheme}>{theme === 'light' ? <FiSun className="nav-link-icon"/> : <FiMoon className="nav-link-icon"/>}{theme === 'light' ? "Light" : 'Dark'}</button>
                <div className="dropdown-divider"></div>
                <Link to="/chat" className="dropdown-item"><BsChatHeart className="nav-link-icon" />Chat</Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout-button" onClick={handleLogout}><FiLogOut className="nav-link-icon" />Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
      {showConfirm && ( // Render confirmation popup if state is true
        <ConfirmPopup
          message="Are you sure you want to logout?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}
    </>
  );
}
