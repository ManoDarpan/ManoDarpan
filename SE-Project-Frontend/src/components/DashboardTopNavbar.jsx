import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DashboardLayout.css';
import ConfirmPopup from './ConfirmPopup';
import { useTheme } from '../contexts/ThemeContext';

import {  FiBook, FiUser, FiHome, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';
import { IoLibraryOutline } from 'react-icons/io5';
import { BsChatHeart } from "react-icons/bs";

export default function DashboardTopNavbar() {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const storedUser = localStorage.getItem('user');
    const storedCounsellor = localStorage.getItem('counsellor');

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (storedCounsellor) {
      const parsedCounsellor = JSON.parse(storedCounsellor);
      setUser(parsedCounsellor);
      // Also fetch fresh data to ensure we have latest profilePic
      const token = localStorage.getItem('token');
      if (token) {
        (async () => {
          try {
            const res = await fetch(`${API_URL}/api/counsellors/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.counsellor) {
                localStorage.setItem('counsellor', JSON.stringify(data.counsellor));
                setUser(data.counsellor);
              }
            }
          } catch (e) { /* ignore */ }
        })();
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const setVar = () => document.documentElement.style.setProperty('--navbar-height', `${el.offsetHeight}px`);
    setVar();
    window.addEventListener('resize', setVar);
    return () => window.removeEventListener('resize', setVar);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowConfirm(true);
  };

  const confirmLogout = () => {
    try {
      if (window.socket) {
        try { window.socket.disconnect(); } catch (e) {}
        try { window.socket = null; } catch (e) {}
      }
    } catch (e) {}
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('counsellor');
    setUser(null);
    setShowConfirm(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <>
  <div ref={navRef} className="navbar-top">
        <div className="navbar-logo">
          <img src="/assets/logo.png" alt="ManoDarpan Logo" className="logo-image" />
          <Link to="/" className="logo-text">
            ManoDarpan
          </Link>
        </div>
        <div ref={profileMenuRef} className="profile-menu">
          <button onClick={toggleTheme} className="theme-toggle-button">
            {theme === 'light' ? <FiSun /> : <FiMoon />}
          </button>
          <button className="profile-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <img src={(user && user.profilePic) || (JSON.parse(localStorage.getItem('counsellor') || 'null')?.profilePic) || '/assets/male.svg'} alt="User Profile" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
            <span>{user?.name ? (user.name.split(' ')[0]) : ''}</span>
          </button>
          <div className={`dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
            {localStorage.getItem('counsellor') ? (
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
      {showConfirm && (
        <ConfirmPopup
          message="Are you sure you want to logout?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}
    </>
  );
}