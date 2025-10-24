import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Layout from './components/Layout';
import ChatUser from './pages/ChatUser';
import Library from './pages/Library';
import ChatCounsellor from './pages/ChatCounsellor';
import CounsellorProfile from './pages/CounsellorProfile';
import UserProtected from './components/UserProtected';
import Admin from './pages/Admin';
import CounsellorProtected from './components/CounsellorProtected';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<UserProtected><Dashboard /></UserProtected>} />
          <Route path="/journal" element={<UserProtected><Journal /></UserProtected>} />
          <Route path="/library" element={<UserProtected><Library /></UserProtected>} />
          <Route path="/chat-user" element={<UserProtected><ChatUser /></UserProtected>} />
          <Route path="/chat-counsellor" element={<CounsellorProtected><ChatCounsellor /></CounsellorProtected>} />
          <Route path="/chat" element={<UserProtected><ChatUser /></UserProtected>} />
          <Route path="/profile" element={<CounsellorProtected><CounsellorProfile /></CounsellorProtected>} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </>
  );
}