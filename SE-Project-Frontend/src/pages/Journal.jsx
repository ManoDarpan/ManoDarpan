import React, { useEffect, useState } from 'react'; // Import React hooks
import { motion, AnimatePresence } from 'framer-motion'; // Animation libraries
import './Journal.css'; // Component styles
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // API base URL

// Helper function to get mood emoji based on score
const getMoodEmoji = (mood) => {
  if (mood <= 2) return '😞';
  if (mood <= 4) return '😟';
  if (mood <= 6) return '😐';
  if (mood <= 8) return '😊';
  return '😁';
};

const Journal = () => {
  const [entries, setEntries] = useState([]); // State for all journal entries
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [filter, setFilter] = useState('all'); // State for mood filter ('all', 'positive', 'negative')

  // Effect to fetch journal entries on mount and listen for updates
  useEffect(() => {
    const fetchEntries = async () => {
      try {
  const token = localStorage.getItem('token'); // Get auth token
  // Fetch journals from API
  const res = await fetch(`${API_URL}/api/users/journals`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch journal entries');
        const data = await res.json();
        // Map and standardize entry structure
        const mapped = (data.journalEntries || []).map(e => ({
          id: e._id || e.id,
          title: e.title,
          date: e.date,
          content: e.content || '',
          mood: { score: e.moodScore != null ? e.moodScore : 5 },
          emotions: e.emotions || {}
        }));
        setEntries(mapped);
      } catch (error) {
        console.error('Error fetching entries:', error);
        setEntries([]);
      }
    };

    fetchEntries();
    const handler = () => fetchEntries(); // Handler for custom event
    // Listen for global update event from JournalPopup/Dashboard
    window.addEventListener('journal:updated', handler);
    return () => window.removeEventListener('journal:updated', handler); // Cleanup listener
  }, []);

  // Filter logic based on mood and search term
  const filteredEntries = entries
    .filter(entry => {
      // Mood filter logic (positive >= 5, negative < 5)
      if (filter === 'all') return true;
      if (filter === 'positive') return entry.mood.score >= 5;
      if (filter === 'negative') return entry.mood.score < 5;
      return true;
    })
    .filter(entry =>
      // Search term filter logic (checks title and content)
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="journal-page-container">
      <header className="journal-header">
        <h1>My Journal</h1>
        <p>A space for your thoughts, feelings, and reflections.</p>
      </header>
      <div className="journal-controls">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Mood filter dropdown */}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Moods</option>
          <option value="positive">Positive</option>
          <option value="negative">Negative</option>
        </select>
      </div>
      <main className="journal-entries-grid">
        {(!filteredEntries || filteredEntries.length === 0) ? (
          {/* Empty state message */}
          <div className="journal-empty-state">
            <h2>No entries yet</h2>
            <br/>
            <p>It looks like you haven't added any journal entries. Try completing today's check-in to start tracking your mood and sleep.</p>
            <br/>
            <p><b>Small steps count —</b> write one sentence about how you feel right now.</p>
          </div>
        ) : (
          <AnimatePresence>
            {/* Map and display filtered entries with animation */}
            {filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                className="journal-entry-card"
                initial={{ opacity: 0, y: 20 }} // Initial animation state
                animate={{ opacity: 1, y: 0 }} // Animation target state
                transition={{ delay: index * 0.1 }} // Staggered delay for cards
              >
                <div className="journal-card-header">
                  <span className="journal-card-mood">{getMoodEmoji(entry.mood.score)}</span> {/* Mood emoji */}
                  <h2 className="journal-card-title">{entry.title}</h2>
                  <time className="journal-card-date">
                    {/* Formatted date */}
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </time>
                </div>
                <p className="journal-card-content">{entry.content}</p> {/* Entry content */}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default Journal;
