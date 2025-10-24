import React from 'react';
import { Navigate } from 'react-router-dom';

export default function CounsellorProtected({ children }) {
  const token = localStorage.getItem('token');
  const counsellor = localStorage.getItem('counsellor');
  const user = localStorage.getItem('user');

  if (!token) return <Navigate to="/" replace />;
  if (user && !counsellor) return <Navigate to="/" replace />;
  if (counsellor) return <>{children}</>;

  return <Navigate to="/" replace />;
}
