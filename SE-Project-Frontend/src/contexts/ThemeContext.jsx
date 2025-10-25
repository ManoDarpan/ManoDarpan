import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(); // Create the Context object

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext); // Custom hook to easily use the theme context

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme'); // Check local storage for saved theme
    return savedTheme || 'light'; // Default to 'light' if none is saved
  });

  // Effect to apply the theme class to the body element and save to local storage
  useEffect(() => {
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('dark'); // Add 'dark' class for dark mode styling
    } else {
      body.classList.remove('dark'); // Remove 'dark' class for light mode styling
    }
    localStorage.setItem('theme', theme); // Persist the current theme
  }, [theme]); // Reruns whenever the 'theme' state changes

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light')); // Function to switch between light and dark
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}> {/* Provide state and toggle function */}
      {children} {/* Render wrapped components */}
    </ThemeContext.Provider>
  );
};
