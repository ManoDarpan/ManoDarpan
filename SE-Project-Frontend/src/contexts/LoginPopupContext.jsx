import React, { createContext, useState, useContext, useEffect } from 'react';

const LoginPopupContext = createContext();

export const useLoginPopup = () => useContext(LoginPopupContext);

export const LoginPopupProvider = ({ children }) => {
  const [showLogin, setShowLogin] = useState(false);

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  // Validate existing server token on app load. If a token exists but is invalid/expired,
  // automatically open the login popup so the user can re-authenticate.
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');
    if (!token) return; // nothing to validate

    let cancelled = false;

    const validate = async () => {
      try {
        // Try user profile first
        let res = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return; // token valid for user
        }

        // Try counsellor profile next (in case token belongs to a counsellor)
        res = await fetch(`${API_URL}/api/counsellors/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          return; // token valid for counsellor
        }

        // token invalid/expired -> prompt login (unless component unmounted)
        if (!cancelled) setShowLogin(true);
      } catch (err) {
        // network error or server offline - don't auto-open login in that case
        console.warn('Token validation request failed:', err.message || err);
      }
    };

    validate();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LoginPopupContext.Provider value={{ showLogin, handleLoginClick, handleCloseLogin }}>
      {children}
    </LoginPopupContext.Provider>
  );
};