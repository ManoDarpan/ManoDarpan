import React from 'react';
import { createRoot } from 'react-dom/client'; // Function to create the root for React 18
import { BrowserRouter } from 'react-router-dom'; // Router component for client-side routing
import App from './App'; // The main application component
import { ThemeProvider } from './contexts/ThemeContext.jsx'; // Context provider for managing app theme (light/dark)
import { LoginPopupProvider } from './contexts/LoginPopupContext.jsx'; // Context provider for managing the login popup
import './index.css'; // Global CSS styles

// Initialize the React application and render the root component
createRoot(document.getElementById('root')).render(
  <React.StrictMode> {/* Enables checks and warnings for potential issues */}
    <BrowserRouter> {/* Enables routing functionality throughout the app */}
      <ThemeProvider> {/* Provides theme context to all nested components */}
        <LoginPopupProvider> {/* Provides login popup management context */}
          <App /> {/* The entire application UI */}
        </LoginPopupProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Service Worker Registration for PWA/Caching (Progressive Web App features)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the service worker file
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope); // Log success
    }, err => {
      console.log('ServiceWorker registration failed: ', err); // Log error
    });
  });
}
