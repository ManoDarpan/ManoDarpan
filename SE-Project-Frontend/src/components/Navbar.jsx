import React, { useState, useEffect, useRef } from 'react'; // Import React hooks
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Router hooks and component
import './Navbar.css'; // Component-specific styles
import '../home_style.css'; // Global/shared styles
import { useTheme } from '../contexts/ThemeContext'; // Context for theme toggling
import { useLoginPopup } from '../contexts/LoginPopupContext'; // Context for managing login modal
import ConfirmPopup from './ConfirmPopup'; // Confirmation modal component
import Portal from './Portal'; // Component to render modals outside DOM flow
import { FiHome, FiBook, FiInfo, FiMail, FiUser, FiSun, FiMoon } from 'react-icons/fi'; // Icon imports

export default function Navbar() {
  const navRef = useRef(null); // Ref for the main navbar element
  const location = useLocation(); // Current URL location
  const navigate = useNavigate(); // Navigation function
  const [menuOpen, setMenuOpen] = useState(false); // State for mobile menu open/close
  const { theme, toggleTheme } = useTheme(); // Theme state and toggler
  const { handleLoginClick } = useLoginPopup(); // Function to open login modal
  const isHomePage = location.pathname === '/'; // Check if on the homepage
  const [user, setUser] = useState(null); // State for logged-in user data
  const [counsellor, setCounsellor] = useState(null); // State for logged-in counsellor data
  const [showConfirm, setShowConfirm] = useState(false); // State for logout confirmation modal
  const [showUserDropdown, setShowUserDropdown] = useState(false); // State for user profile dropdown visibility
  const dropdownRef = useRef(null); // Ref for the main menu dropdown
  const userDropdownRef = useRef(null); // Ref for the user profile dropdown

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Get API URL

    // Check local storage for user/counsellor data on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const storedCounsellor = localStorage.getItem('counsellor');
    if (storedCounsellor) {
      setCounsellor(JSON.parse(storedCounsellor));
      // Fetch fresh counsellor data to ensure profilePic is up-to-date
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
                setCounsellor(data.counsellor);
              }
            }
          } catch (e) { /* ignore network errors */ }
        })();
      }
    }
  }, []); // Runs once on mount

  // Expose navbar height as CSS variable for layout purposes
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const setVar = () => document.documentElement.style.setProperty('--navbar-height', `${el.offsetHeight}px`);
    setVar();
    window.addEventListener('resize', setVar);
    return () => window.removeEventListener('resize', setVar); // Cleanup
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false); // Close mobile menu
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false); // Close user dropdown
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside); // Cleanup
  }, []);

  // Handles initial click for logout confirmation
  const handleLogout = () => {
    setShowConfirm(true);
  };

  // Confirms and executes logout
  const confirmLogout = () => {
    try {
      // Attempt to disconnect Socket.IO connection if it exists (relevant for counsellor status)
      if (window.socket) {
        try { window.socket.disconnect(); } catch (e) {}
        try { window.socket = null; } catch (e) {}
      }
    } catch (e) {
      // ignore socket errors
    }
    // Clear all login-related data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('counsellor');
    setUser(null);
    setCounsellor(null);
    setShowConfirm(false);
    navigate('/'); // Redirect to homepage
  };

  // Cancels the logout operation
  const cancelLogout = () => {
    setShowConfirm(false);
  };

  // Logic to select the correct hamburger/close menu icon based on theme and menu state
  let curr_ham_svg_path;

  if ((theme === 'dark' && menuOpen == false)) {
    curr_ham_svg_path = "/assets/ham_menu_open_white.svg"
  } else if ((theme === 'dark' && menuOpen == true)) {
    curr_ham_svg_path = '/assets/ham_menu_close_white.svg'
  } else if ((theme === 'light' && menuOpen == false)) {
    curr_ham_svg_path = '/assets/ham_menu_open_black.svg'
  } else if ((theme === 'light' && menuOpen == true)) {
    curr_ham_svg_path = '/assets/ham_menu_close_black.svg'
  }

  return (
    <>
      <nav ref={navRef} className={`navbar`}> {/* Main navigation bar */}
        <div className="navbar-logo">
          <img src="/assets/logo.png" alt="ManoDarpan Logo" className="logo-image" />
          <Link to={user ? '/dashboard' : (counsellor ? '/chat-counsellor' : '/')} className="logo-text"> {/* Logo link changes based on login status */}
            ManoDarpan
          </Link>
        </div>

        <div ref={dropdownRef} className="navbar-content">
          <button
            className={`hamburger-menu${menuOpen ? ' active' : ''}`}
            onClick={() => setMenuOpen((open) => !open)} // Toggle mobile menu
            aria-label="Toggle navigation"
          >
            <img
              src={curr_ham_svg_path} // Dynamic hamburger icon
              alt={menuOpen ? 'Close menu' : 'Open menu'}
              style={{ width: 32, height: 32 }}
            />
          </button>

          <div className={`nav-links${menuOpen ? ' active' : ''}`}> {/* Navigation links container */}
            <button onClick={toggleTheme} className="theme-toggle-button"> {/* Desktop theme toggle */}
              {theme === 'light' ? <FiSun /> : <FiMoon />}
            </button>


            {!counsellor && ( // Links for non-counsellor views
              <>
                <Link to="/about" className={`regular_text nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
                  <FiInfo className="nav-link-icon" />
                  ABOUT US
                </Link>
                <Link to="/contact" className={`regular_text nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
                  <FiMail className="nav-link-icon" />
                  CONTACT US
                </Link>
                
                <button onClick={toggleTheme} className='regular_text nav-link mobile-only'> {/* Mobile theme toggle link */}
                  {theme === 'light' ? <FiSun /> : <FiMoon />} {theme === 'light' ? 'LIGHT MODE' : 'DARK MODE'}
                </button>
                
              </>
            )}

            {!user && !counsellor && ( // Login button for logged-out users
              <button onClick={handleLoginClick} className="regular_text nav-link login_button">GET STARTED ➜</button>
            )}

            {user && ( // Dashboard and Journal links for logged-in users
              <>
                <Link to="/dashboard" className={`regular_text nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                  <FiHome className="nav-link-icon" />
                  DASHBOARD
                </Link>
                <Link to="/journal" className={`regular_text nav-link ${location.pathname === '/journal' ? 'active' : ''}`}>
                  <FiBook className="nav-link-icon" />
                  JOURNAL
                </Link>
              </>
            )}

            {counsellor && ( // Counsellor-specific navigation links (commented out)
              <>
                {/* <Link to="/chat-counsellor" ...> */}
                {/* <Link to="/profile" ...> */}
              </>
            )}
            {(user || counsellor) && ( // Profile avatar and dropdown for logged-in users/counsellors
              <div ref={userDropdownRef} className="user-dropdown-container">
                <button onClick={() => setShowUserDropdown(prev => !prev)} className="user-dropdown-button profile-avatar-button">
                  <img src={(user && user.profilePic) || (counsellor && counsellor.profilePic) || '/assets/male.svg'} alt="Profile" style={{ width: 28, height: 28, borderRadius: 18 }} />
                  {counsellor && <span style={{ marginLeft: 8, fontSize: 14 }}>{(JSON.parse(localStorage.getItem('counsellor') || '{}') || {}).name?.split(' ')[0] || ''}</span>} {/* Display counsellor name fragment */}
                </button>
                {showUserDropdown && ( // Dropdown menu content
                  <div className={`dropdown-menu open`}>
                    {counsellor ? ( // Counsellor dropdown items
                      <>
                        <Link to="/chat-counsellor" className="dropdown-item">Dashboard</Link>
                        <Link to="/profile" className="dropdown-item">Profile</Link>
                        <div className="dropdown-divider" />
                        <button onClick={toggleTheme} className="dropdown-item">
                          {theme === 'light' ? <FiSun /> : <FiMoon />} {theme === 'light' ? 'Light' : 'Dark'} Mode
                        </button>
                        <div className="dropdown-divider" />
                        <button onClick={handleLogout} className="dropdown-item logout-button">Logout</button>
                      </>
                    ) : ( // User dropdown items
                      <>
                        <Link to="/dashboard" className="dropdown-item">Dashboard</Link>
                        <Link to="/journal" className="dropdown-item">Journal</Link>
                        <Link to="/library" className="dropdown-item">Library</Link>
                        <Link to="/chat?tab=conversations" className="dropdown-item">Chat</Link>
                        <div className="dropdown-divider" />
                        <button onClick={toggleTheme} className="dropdown-item">
                          {theme === 'light' ? <FiSun /> : <FiMoon />} {theme === 'light' ? 'Light' : 'Dark'} Mode
                        </button>
                        <div className="dropdown-divider" />
                        <button onClick={handleLogout} className="dropdown-item logout-button">Logout</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </nav>
      {showConfirm && ( // Logout confirmation modal
        <ConfirmPopup
          message="Are you sure you want to logout?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
        />
      )}
    </>
  );
}
