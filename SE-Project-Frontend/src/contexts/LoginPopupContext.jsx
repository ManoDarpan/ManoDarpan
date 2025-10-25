import React, { createContext, useState, useContext, useEffect } from 'react';

const LoginPopupContext = createContext(); // Create the context object

export const useLoginPopup = () => useContext(LoginPopupContext); // Custom hook to consume the context

export const LoginPopupProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false); // State to control login popup visibility

  const handleLoginClick = () => {
    setShowLogin(true); // Function to open the popup
  };

  const handleCloseLogin = () => {
    setShowLogin(false); // Function to close the popup
  };

  // Effect to validate an existing token on app load
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Get API base URL
    const token = localStorage.getItem('token');
    if (!token) return; // Exit if no token exists

    let cancelled = false; // Flag to handle cleanup on unmount

    const validate = async () => {
      try {
        // 1. Try validating token against user profile endpoint
        let res = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return; // Token is valid for a user
        }

        // 2. If not a user, try validating token against counsellor profile endpoint
        res = await fetch(`${API_URL}/api/counsellors/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return; // Token is valid for a counsellor
        }

        // Token failed validation for both roles -> auto-open login popup
        if (!cancelled) setShowLogin(true);
      } catch (err) {
        // Log warning for network issues but do not open popup
        console.warn('Token validation request failed:', err.message || err);
      }
    };

    validate();

    return () => {
      cancelled = true; // Set cleanup flag
    };
  }, []); // Runs once on mount

  return (
    <LoginPopupContext.Provider value={{ showLogin, handleLoginClick, handleCloseLogin }}>
      {children} {/* Render children wrapped with the context provider */}
    </LoginPopupContext.Provider>
  );
};
