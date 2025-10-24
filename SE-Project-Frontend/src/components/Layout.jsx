import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import DashboardTopNavbar from './DashboardTopNavbar';
import DashboardSidebar from './DashboardSidebar';
import AnimatedPage from './AnimatedPage';
import LoginPopup from './LoginPopup';
import Portal from './Portal';
import { useLoginPopup } from '../contexts/LoginPopupContext';

export default function Layout() {
  const [, setUser] = useState(null);
  const location = useLocation();
  const { showLogin, handleCloseLogin } = useLoginPopup();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);

    const handleStorageChange = () => {
      const updatedUser = localStorage.getItem('user');
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location]); // Re-check on location change

  const loggedInRoutes = ['/dashboard', '/journal' , '/library' , '/chat', '/chat-counsellor', '/profile'];

  const isloggedInRoute = loggedInRoutes.some(path => location.pathname.startsWith(path));

  // hide the sidebar for counsellor-specific pages like counsellor chat and counsellor dashboard
  const hideSidebarFor = ['/chat-counsellor', '/counsellor-dashboard'];
  const hideSidebar = hideSidebarFor.some(p => location.pathname.startsWith(p));

  return (
    <>
      {isloggedInRoute ? (
        <>
          <DashboardTopNavbar />
          <main className="dashboard-content">
            <AnimatePresence mode="wait">
              <AnimatedPage key={location.pathname}>
                <Outlet />
              </AnimatedPage>
            </AnimatePresence>
          </main>
        </>
      ) : (
        <>
          <Navbar />
          <AnimatePresence mode="wait">
            <AnimatedPage key={location.pathname}>
              <Outlet />
            </AnimatedPage>
          </AnimatePresence>
        </>
      )}
      {showLogin && (
        <Portal>
          <LoginPopup onClose={handleCloseLogin} />
        </Portal>
      )}
    </>
  );
}