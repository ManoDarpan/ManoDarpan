import React from 'react';
import { Navigate } from 'react-router-dom';

export default function CounsellorProtected({ children }) {
  const token = localStorage.getItem('token'); // auth token
  const counsellor = localStorage.getItem('counsellor'); // counsellor role flag
  const user = localStorage.getItem('user'); // regular user flag

  if (!token) return <Navigate to="/" replace />; // no login -> redirect
  if (user && !counsellor) return <Navigate to="/" replace />; // user but not counsellor -> block
  if (counsellor) return <>{children}</>; // allowed -> render page

  return <Navigate to="/" replace />; // fallback redirect
}
