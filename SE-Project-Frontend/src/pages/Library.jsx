import React, { useEffect, useState } from 'react';
import './Library.css';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Library = () => {
  const [resources, setResources] = useState([]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
  const response = await fetch(`${API_URL}/api/users/library`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setResources(data || []);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        setResources([]);
      }
    };
    fetchResources();
  }, []);

  return (
    <div className="library-container">
      <div className="library-header">
        <h1>Resource Library</h1>
        <p>Explore our curated collection of resources to support your mental well-being.</p>
      </div>
      <div className="resource-grid">
        {resources.map(resource => (
          <a key={resource.id} href={resource.resourceUrl} target="_blank" rel="noopener noreferrer" className="resource-card-link">
            <div className="resource-card">
              <img 
                src={resource.imageUrl} 
                alt={resource.title} 
                className="resource-image"
                onError={(e) => { e.target.onerror = null; e.target.outerHTML = `<div class="image-placeholder">${resource.title}</div>`; }} />
              <h3>{resource.title}</h3>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

const ImagePlaceholder = ({ title }) => (
  <div className="image-placeholder">
    <span>{title}</span>
  </div>
);

export default Library;