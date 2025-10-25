import React, { useEffect, useState } from 'react'; // Import React hooks
import './Library.css'; // Component-specific styles
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // API base URL

const Library = () => {
  const [resources, setResources] = useState([]); // State to store the fetched resources

  // Effect to fetch resources from the API on component mount
  useEffect(() => {
    const fetchResources = async () => {
      try {
  // API call to fetch the resource list
  const response = await fetch(`${API_URL}/api/users/library`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setResources(data || []); // Set the fetched resources
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        setResources([]); // Set empty array on failure
      }
    };
    fetchResources();
  }, []); // Empty dependency array ensures it runs once on mount

  return (
    <div className="library-container">
      <div className="library-header">
        <h1>Resource Library</h1>
        <p>Explore our curated collection of resources to support your mental well-being.</p>
      </div>
      <div className="resource-grid">
        {/* Map over resources and create a card for each */}
        {resources.map(resource => (
          <a key={resource.id} href={resource.resourceUrl} target="_blank" rel="noopener noreferrer" className="resource-card-link">
            <div className="resource-card">
              <img 
                src={resource.imageUrl} 
                alt={resource.title} 
                className="resource-image"
                // Error handler to replace broken image with a text placeholder
                onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<div class="image-placeholder">${resource.title}</div>`; }} />
              <h3>{resource.title}</h3> {/* Resource title */}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

// Component for the image placeholder (currently unused but provided in original code)
const ImagePlaceholder = ({ title }) => (
  <div className="image-placeholder">
    <span>{title}</span>
  </div>
);

export default Library;
