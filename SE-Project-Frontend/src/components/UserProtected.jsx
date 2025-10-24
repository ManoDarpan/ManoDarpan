import React from 'react';
import { Navigate } from 'react-router-dom';

export default function UserProtected({ children }) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const counsellor = localStorage.getItem('counsellor');

  if (!token) return <Navigate to="/" replace />;
  if (counsellor && !user) return <Navigate to="/" replace />;
  if (user) return <>{children}</>;

  return <Navigate to="/" replace />;
}
