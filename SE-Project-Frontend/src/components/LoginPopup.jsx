import React, { useState, useEffect, useRef } from 'react';
import './LoginPopup.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''; // Google OAuth client ID from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Backend API URL

export default function LoginPopup({ onClose }) {
  const [role, setRole] = useState('user'); // State for selected role: 'user' or 'counsellor'
  const [error, setError] = useState(''); // State for displaying authentication errors
  const [roleAnimKey, setRoleAnimKey] = useState(0); // Key used to force re-render/animation of role-specific content
  const [show, setShow] = useState(false); // State to control the fade-in/out animation of the popup

  const roleRef = useRef(role); // Ref to hold the current role state, used to prevent stale closures in Google callback
  useEffect(() => {
    roleRef.current = role; // Update the ref whenever the role state changes
  }, [role]);

  useEffect(() => {
    // Effect to manage body scrolling when the popup is active
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden'; // Disable background scrolling
    document.body.style.paddingRight = `${scrollBarWidth}px`; // Compensate for scrollbar to prevent layout shift

    requestAnimationFrame(() => setShow(true)); // Trigger the fade-in animation

    return () => {
      // Cleanup function to restore body styles on component unmount
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // Effect to initialize and render the Google Sign-In button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return; // Skip initialization if client ID is missing

    const initAndRender = () => {
      try {
        // Initialize Google Sign-In service
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => { // Callback handles successful credential response
            if (!response?.credential) return;
            const currentRole = roleRef.current; // Read the latest role from the ref
            try {
              // Determine the correct backend endpoint based on the current role
              const endpoint =
                currentRole === 'user'
                  ? `${API_URL}/api/users/google-auth`
                  : `${API_URL}/api/counsellors/google-auth`;

              // Send the Google ID token to the backend for verification and login
              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: response.credential }),
              });

              if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token); // Store JWT token
                if (currentRole === 'user') {
                  localStorage.setItem('user', JSON.stringify(data.user)); // Store user data
                  window.location.href = '/dashboard'; // Redirect to user dashboard
                } else {
                  localStorage.setItem('counsellor', JSON.stringify(data.counsellor)); // Store counsellor data
                  window.location.href = '/chat-counsellor'; // Redirect to counsellor chat view
                }
              } else {
                const err = await res.json().catch(() => ({}));
                setError(err.message || 'Google sign-in failed'); // Display backend error
              }
            } catch (err) {
              console.error('Google sign-in error', err);
              setError('An error occurred during sign-in.');
            }
          },
        });

        const container = document.getElementById('g-user-btn');
        if (container) {
          container.innerHTML = ''; // Clear existing button before re-rendering
          window.google.accounts.id.renderButton(container, { // Render the Google button
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: '250',
          });
        }

        window.googleInitialized = true;
      } catch (err) {
        console.error('Google script init error', err);
      }
    };

    // Check if the Google script is already loaded
    if (window.google && window.google.accounts && window.google.accounts.id) {
      initAndRender();
    } else {
      // Dynamically load the Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        initAndRender(); // Initialize once the script is loaded
      };
    }
  }, []); // Empty dependency array means this runs only once on mount

  return (
    <div
      className={`login-popup-overlay ${show ? 'show' : ''}`} // Overlay for dimming background
      onClick={onClose} // Closes popup when clicking outside
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`login-popup-content ${show ? 'show' : ''}`} // Main popup content area
        onClick={(e) => e.stopPropagation()} // Stops click event from bubbling up to the overlay
      >
        <button className="close-btn" onClick={onClose} aria-label="Close login popup">
          &times;
        </button>

        {/* Role Switch */}
        <div className="role-switch-container">
          <div className="role-switch">
            <button
              className={`role-btn ${role === 'user' ? 'active' : ''}`}
              onClick={() => {
                setRole('user'); // Switch role to user
                setRoleAnimKey((k) => k + 1); // Trigger content re-render/animation
              }}
            >
              User
            </button>
            <button
              className={`role-btn ${role === 'counsellor' ? 'active' : ''}`}
              onClick={() => {
                setRole('counsellor'); // Switch role to counsellor
                setRoleAnimKey((k) => k + 1); // Trigger content re-render/animation
              }}
            >
              Counsellor
            </button>
            <div className={`switch-indicator ${role}`}></div> {/* Animated indicator below active button */}
          </div>
        </div>

        {/* Title & Subtitle (Key is used for animation when role changes) */}
        <div key={roleAnimKey} className={`role-panel enter-active`}>
          {role === 'user' ? (
            <>
              <h2 className="form-title">Log in or Sign up</h2>
              <p className="subtitle">
                Start your journey of self-understanding and emotional balance.
              </p>
              <br />
            </>
          ) : (
            <>
              <h2 className="form-title">Counsellor Login</h2>
              <p className="subtitle">
                Access your dashboard to guide and support users effectively.
              </p>
              <br />
            </>
          )}
        </div>

        {/* Google Login Section */}
        <div className="google-btn-wrapper">
          {GOOGLE_CLIENT_ID ? (
            <div id="g-user-btn"></div> // Container for the rendered Google button
          ) : (
            // Display fallback if Google Client ID is missing
            <div>
              <button className="chat-request-btn" disabled title="Google client ID not configured">Google sign-in (not configured)</button>
              <div style={{marginTop:8, color:'var(--text-color-light)'}}>Ask the admin to set VITE_GOOGLE_CLIENT_ID in the frontend .env</div>
            </div>
          )}
        </div>

        {error && <p className="error-text">{error}</p>} {/* Display authentication error */}

        {/* Footer text */}
        {role === 'user' ? (
          <p className="privacy-text">
            <br />
            Your data is private and secure. We never share personal insights without your consent.
          </p>
        ) : (
          <p className="privacy-text">
            <br />
            Login via Google to access your counsellor dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
