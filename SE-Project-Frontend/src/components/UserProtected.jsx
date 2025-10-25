import React from 'react';
import { Navigate } from 'react-router-dom'; // Component for redirection

/**
 * Route protection component to ensure only standard users are granted access.
 * Redirects to '/' if the user is not authenticated or if a counsellor is attempting to access a user-only route.
 */
export default function UserProtected({ children }) {
  const token = localStorage.getItem('token'); // Check for auth token
  const user = localStorage.getItem('user'); // Check for user data
  const counsellor = localStorage.getItem('counsellor'); // Check for counsellor data

  // 1. No token (not logged in) -> Redirect to home
  if (!token) return <Navigate to="/" replace />;

  // 2. Logged in as counsellor (counsellor exists) but not as a user -> Redirect (Prevents counsellor access to user routes)
  if (counsellor && !user) return <Navigate to="/" replace />;
  
  // 3. Logged in as user (user data exists) -> Grant access
  if (user) return <>{children}</>;

  // 4. Fallback (e.g., token exists, but no user/counsellor data is available) -> Redirect to home
  return <Navigate to="/" replace />;
}
