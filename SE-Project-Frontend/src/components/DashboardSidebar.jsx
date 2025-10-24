import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './DashboardLayout.css';
import {  FiHome , FiBook  } from 'react-icons/fi';
import { IoLibraryOutline } from 'react-icons/io5';
import { BsChatHeart } from "react-icons/bs";

export default function DashboardSidebar() {
  const location = useLocation();

  return (
    <div className="navbar-side">
      <Link to='/dashboard' className={`nav-side-buttons ${location.pathname === '/dashboard' ? 'active' : ''}`}>
        {/* <img src='/assets/home-icon.svg' className='sidebar-icon'></img> */}
        <FiHome />
        <span>Home</span>
      </Link>

      <Link to='/journal' className={`nav-side-buttons ${location.pathname === '/journal' ? 'active' : ''}`}>
        {/* <img src='/assets/journal.svg' className='sidebar-icon'></img> */}
        < FiBook />
        <span>Journal</span>
      </Link>

      <Link to='/library' className={`nav-side-buttons ${location.pathname === '/library' ? 'active' : ''}`}>
        {/* <img src='/assets/library.svg' className='sidebar-icon'></img> */}
        < IoLibraryOutline />
        <span>Library</span>
      </Link>

      <div className="sidebar-divider"></div>

      <Link to='/chat' className={`nav-side-buttons ${location.pathname === '/chat-user' ? 'active' : ''}`}>
        {/* <img src='/assets/chat.svg' className='sidebar-icon'></img> */}
        <BsChatHeart />
        <span>Chat</span>
      </Link>
    </div>
  );
}
