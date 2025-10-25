import React, { useState, useEffect } from 'react';
import './JournalPopup.css';
import Portal from './Portal';
import { toast } from 'react-toastify'; // Import for showing notifications
import 'react-toastify/dist/ReactToastify.css';

export default function JournalPopup({ onClose, onSubmit }) {
  const [title, setTitle] = useState(''); // State for journal entry title
  const [content, setContent] = useState(''); // State for the main journal content
  const [sleep, setSleep] = useState(5); // State for sleep quality rating (1-10)
  const [isSubmitting, setIsSubmitting] = useState(false); // State to manage form submission status

  useEffect(() => {
    // Effect hook to manage body scrolling when the popup is open
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden'; // Prevents background scrolling
    document.body.style.paddingRight = `${scrollBarWidth}px`; // Compensates for scrollbar removal
    return () => {
      // Cleanup function to reset body styles on component unmount
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const journalData = { // Data object to be submitted
      title,
      content,
      sleepQuality: Number(sleep),
      date: new Date().toISOString(),
    };
    try {
      await onSubmit(journalData); // Execute the external submission logic
      toast.success('Journal entry saved successfully!'); // Success message
      onClose();
    } catch (error) {
      toast.error('Failed to save journal entry.'); // Error message
    } finally {
      setIsSubmitting(false); // Reset submission status
    }
  };

  return (
    <Portal> {/* Renders the popup content outside the main DOM tree */}
      <div className="popup-overlay" onClick={onClose}> {/* Overlay to capture outside clicks */}
        <div className="popup-content" onClick={(e) => e.stopPropagation()}> {/* Prevents click from propagating to overlay */}
          <button className="close-button" onClick={onClose} aria-label="Close journal popup">&times;</button>
        <h2>Today's Check-in</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title of the day</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the title of your day?"
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">Journal Entry</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="sleep">How was your sleep last night?</label>
            <div className="slider-container">
              <input
                type="range"
                id="sleep"
                min="1"
                max="10"
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
              />
              <div className="slider-value">{sleep}</div> {/* Displays the selected sleep value */}
            </div>
          </div>
          <button type="submit" className="submit-button" disabled={isSubmitting}> {/* Disables button while submitting */}
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
        </div>
      </div>
    </Portal>
  );
}
