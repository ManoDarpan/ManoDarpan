import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Components for defining routes
import Home from './pages/Home'; // Public home page
import About from './pages/About'; // Public about page
import Contact from './pages/Contact'; // Public contact page
import Dashboard from './pages/Dashboard'; // User dashboard page (protected)
import Journal from './pages/Journal'; // User journal page (protected)
import Layout from './components/Layout'; // Main structural layout wrapper
import ChatUser from './pages/ChatUser'; // User chat interface (protected)
import Library from './pages/Library'; // User resources library (protected)
import ChatCounsellor from './pages/ChatCounsellor'; // Counsellor chat interface (protected)
import CounsellorProfile from './pages/CounsellorProfile'; // Counsellor profile page (protected)
import UserProtected from './components/UserProtected'; // Component to protect routes for standard users
import Admin from './pages/Admin'; // Admin page (protection assumed to be inside component or via another wrapper)
import CounsellorProtected from './components/CounsellorProtected'; // Component to protect routes for counsellors
import { ToastContainer } from 'react-toastify'; // Component for displaying notifications
import 'react-toastify/dist/ReactToastify.css'; // Styles for react-toastify

export default function App() {
  return (
    <>
      <ToastContainer /> {/* Container to render toasts (notifications) */}
      <Routes> {/* Main router component to define application routes */}
        <Route element={<Layout />}> {/* Outer route wrapping all pages with the main Layout component */}
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* User Protected Routes (Requires standard user login) */}
          <Route path="/dashboard" element={<UserProtected><Dashboard /></UserProtected>} />
          <Route path="/journal" element={<UserProtected><Journal /></UserProtected>} />
          <Route path="/library" element={<UserProtected><Library /></UserProtected>} />
          <Route path="/chat-user" element={<UserProtected><ChatUser /></UserProtected>} />
          <Route path="/chat" element={<UserProtected><ChatUser /></UserProtected>} /> {/* Alias for user chat */}
          
          {/* Counsellor Protected Routes (Requires counsellor login) */}
          <Route path="/chat-counsellor" element={<CounsellorProtected><ChatCounsellor /></CounsellorProtected>} />
          <Route path="/profile" element={<CounsellorProtected><CounsellorProfile /></CounsellorProtected>} /> {/* Currently protects the Counsellor Profile */}

          {/* Admin Route */}
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </>
  );
}
