import React, { useState, useEffect, useRef } from 'react';
import './LoginPopup.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LoginPopup({ onClose }) {
  const [role, setRole] = useState('user'); // 'user' or 'counsellor'
  const [error, setError] = useState('');
  const [roleAnimKey, setRoleAnimKey] = useState(0);
  const [show, setShow] = useState(false);

  const roleRef = useRef(role);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    // Prevent scrolling while popup is open
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    // animate in
    requestAnimationFrame(() => setShow(true));

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  // ✅ Fixed flicker + stale role issue
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initAndRender = () => {
      try {
        // initialize with a callback that always reads latest role from roleRef
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (!response?.credential) return;
            const currentRole = roleRef.current;
            try {
              const endpoint =
                currentRole === 'user'
                  ? `${API_URL}/api/users/google-auth`
                  : `${API_URL}/api/counsellors/google-auth`;

              const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: response.credential }),
              });

              if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.token);
                if (currentRole === 'user') {
                  localStorage.setItem('user', JSON.stringify(data.user));
                  window.location.href = '/dashboard';
                } else {
                  localStorage.setItem('counsellor', JSON.stringify(data.counsellor));
                  window.location.href = '/chat-counsellor';
                }
              } else {
                const err = await res.json().catch(() => ({}));
                setError(err.message || 'Google sign-in failed');
              }
            } catch (err) {
              console.error('Google sign-in error', err);
              setError('An error occurred during sign-in.');
            }
          },
        });

        const container = document.getElementById('g-user-btn');
        if (container) {
          // clear previous render if any
          container.innerHTML = '';
          window.google.accounts.id.renderButton(container, {
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

    if (window.google && window.google.accounts && window.google.accounts.id) {
      // library already loaded; initialize & render for this popup
      initAndRender();
    } else {
      // load the script then initialize & render
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      script.onload = () => {
        initAndRender();
      };
    }
  }, []); // runs once

  return (
    <div
      className={`login-popup-overlay ${show ? 'show' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`login-popup-content ${show ? 'show' : ''}`}
        onClick={(e) => e.stopPropagation()}
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
                setRole('user');
                setRoleAnimKey((k) => k + 1);
              }}
            >
              User
            </button>
            <button
              className={`role-btn ${role === 'counsellor' ? 'active' : ''}`}
              onClick={() => {
                setRole('counsellor');
                setRoleAnimKey((k) => k + 1);
              }}
            >
              Counsellor
            </button>
            <div className={`switch-indicator ${role}`}></div>
          </div>
        </div>

        {/* Title & Subtitle */}
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

        {/* Google Login */}
        <div className="google-btn-wrapper">
          {GOOGLE_CLIENT_ID ? (
            <div id="g-user-btn"></div>
          ) : (
            <div>
              <button className="chat-request-btn" disabled title="Google client ID not configured">Google sign-in (not configured)</button>
              <div style={{marginTop:8, color:'var(--text-color-light)'}}>Ask the admin to set VITE_GOOGLE_CLIENT_ID in the frontend .env</div>
            </div>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}

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
