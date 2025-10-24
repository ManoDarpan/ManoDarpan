import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Navbar.css';
import '../home_style.css';
import { useTheme } from '../contexts/ThemeContext';
import { useLoginPopup } from '../contexts/LoginPopupContext';
import ConfirmPopup from './ConfirmPopup';
import Portal from './Portal';
import { FiHome, FiBook, FiInfo, FiMail, FiUser, FiSun, FiMoon } from 'react-icons/fi';

export default function Navbar() {
  const navRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { handleLoginClick } = useLoginPopup();
  const isHomePage = location.pathname === '/';
  const [user, setUser] = useState(null);
  const [counsellor, setCounsellor] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    const storedCounsellor = localStorage.getItem('counsellor');
    if (storedCounsellor) {
      setCounsellor(JSON.parse(storedCounsellor));
    }
  }, []);

  // expose navbar height to CSS so chat can position below it
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowConfirm(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('counsellor');
    setUser(null);
    setCounsellor(null);
    setShowConfirm(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowConfirm(false);
  };

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
      <nav ref={navRef} className={`navbar`}>
        <div className="navbar-logo">
          <img src="/assets/logo.png" alt="ManoDarpan Logo" className="logo-image" />
          <Link to={user ? '/dashboard' : (counsellor ? '/chat-counsellor' : '/')} className="logo-text">
            ManoDarpan
          </Link>
        </div>

        <div ref={dropdownRef} className="navbar-content">
          <button
            className={`hamburger-menu${menuOpen ? ' active' : ''}`}
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            <img
              src={curr_ham_svg_path}
              alt={menuOpen ? 'Close menu' : 'Open menu'}
              style={{ width: 32, height: 32 }}
            />
          </button>

          <div className={`nav-links${menuOpen ? ' active' : ''}`}>
            <button onClick={toggleTheme} className="theme-toggle-button">
              {theme === 'light' ? <FiSun /> : <FiMoon />}
            </button>



            {!counsellor && (
              <>
                <Link to="/about" className={`regular_text nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
                  <FiInfo className="nav-link-icon" />
                  ABOUT US
                </Link>
                <Link to="/contact" className={`regular_text nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
                  <FiMail className="nav-link-icon" />
                  CONTACT US
                </Link>
                
                <button onClick={toggleTheme} className='regular_text nav-link mobile-only'>
                  {theme === 'light' ? <FiSun /> : <FiMoon />} {theme === 'light' ? 'LIGHT MODE' : 'DARK MODE'}
                </button>
                
              </>
            )}

            {!user && !counsellor && (
              <button onClick={handleLoginClick} className="regular_text nav-link login_button">GET STARTED ➜</button>
            )}

            {user && (
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

            {counsellor && (
              <>
                {/* <Link to="/chat-counsellor" className={`counsellor-requests-link regular_text nav-link ${location.pathname === '/chat-counsellor' || location.pathname === '/counsellor-dashboard' ? 'active' : ''}`}>
                  <FiHome className="nav-link-icon" />
                  Home
                </Link>
                <Link to="/profile" className={`regular_text nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                  <FiUser className="nav-link-icon" />
                  Profile
                </Link> */}
              </>
            )}
            {(user || counsellor) && (
              <div ref={userDropdownRef} className="user-dropdown-container">
                <button onClick={() => setShowUserDropdown(prev => !prev)} className="user-dropdown-button profile-avatar-button">
                  <img src="/assets/male.svg" alt="Profile" style={{ width: 28, height: 28, borderRadius: 18 }} />
                  {counsellor && <span style={{ marginLeft: 8, fontSize: 14 }}>{(JSON.parse(localStorage.getItem('counsellor') || '{}') || {}).name?.split(' ')[0] || ''}</span>}
                </button>
                {showUserDropdown && (
                  <div className={`dropdown-menu open`}>
                    {counsellor ? (
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
                    ) : (
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