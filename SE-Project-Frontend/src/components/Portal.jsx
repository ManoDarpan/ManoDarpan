import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children outside the component hierarchy into a DOM node with ID "portal".
 * Used for modals, popups, and components that need to be layered above everything.
 */
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false); // Tracks mounting status

  useEffect(() => {
    setMounted(true); // Component has mounted

    return () => setMounted(false); // Cleanup on unmount
  }, []);

  // Use createPortal to move children to the designated DOM node (#portal)
  return mounted
    ? createPortal(children, document.querySelector("#portal"))
    : null;
};

export default Portal;
