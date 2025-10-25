import React, { useState, useEffect } from 'react'; // Import React hooks
import { Outlet, useLocation } from 'react-router-dom'; // Import router components and hook
import { AnimatePresence } from 'framer-motion'; // For animation control
import Navbar from './Navbar'; // Standard (logged out) navigation bar
import DashboardTopNavbar from './DashboardTopNavbar'; // Logged in top navigation bar
import AnimatedPage from './AnimatedPage'; // Component wrapper for page transitions
import LoginPopup from './LoginPopup'; // Login modal component
import Portal from './Portal'; // Component for rendering modals outside the DOM flow
import { useLoginPopup } from '../contexts/LoginPopupContext'; // Context for managing login modal state

export default function Layout() {
  const [, setUser] = useState(null); // State to hold user data, though only setter is used directly here
  const location = useLocation(); // Hook to get the current URL location
  const { showLogin, handleCloseLogin } = useLoginPopup(); // Get login modal state and close handler from context

  useEffect(() => {
    // Initial check for user in localStorage
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);

    const handleStorageChange = () => {
      // Handler to update user state if localStorage changes (e.g., in another tab)
      const updatedUser = localStorage.getItem('user');
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };

    window.addEventListener('storage', handleStorageChange); // Listen for storage events
    return () => window.removeEventListener('storage', handleStorageChange); // Cleanup
  }, [location]); // Re-check user status when location changes

  const loggedInRoutes = ['/dashboard', '/journal' , '/library' , '/chat', '/chat-counsellor', '/profile']; // Routes requiring a logged-in state

  const isloggedInRoute = loggedInRoutes.some(path => location.pathname.startsWith(path)); // Check if current path starts with any logged-in route

  // hide the sidebar for counsellor-specific pages like counsellor chat and counsellor dashboard
  const hideSidebarFor = ['/chat-counsellor', '/counsellor-dashboard']; // Routes where the sidebar should be hidden
  const hideSidebar = hideSidebarFor.some(p => location.pathname.startsWith(p)); // Check if the sidebar should be hidden (variable is defined but not used in the final render logic)

  return (
    <>
      {isloggedInRoute ? ( // Conditional rendering for logged-in users
        <>
          <DashboardTopNavbar /> {/* Logged-in header */}
          <main className="dashboard-content">
            <AnimatePresence mode="wait"> {/* Manages exit/enter animations */}
              <AnimatedPage key={location.pathname}> {/* Provides animation wrapper for each page */}
                <Outlet /> {/* Renders the current route's component */}
              </AnimatedPage>
            </AnimatePresence>
          </main>
        </>
      ) : ( // Conditional rendering for logged-out/public users
        <>
          <Navbar /> {/* Standard header */}
          <AnimatePresence mode="wait">
            <AnimatedPage key={location.pathname}>
              <Outlet /> {/* Renders the current public route's component */}
            </AnimatedPage>
          </AnimatePresence>
        </>
      )}
      {showLogin && ( // Conditionally renders the Login Popup
        <Portal> {/* Renders the login modal outside the main layout */}
          <LoginPopup onClose={handleCloseLogin} />
        </Portal>
      )}
    </>
  );
}
