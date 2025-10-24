import React, { useState, useEffect } from 'react';
import './JournalPopup.css';
import Portal from './Portal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function JournalPopup({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sleep, setSleep] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const journalData = {
      title,
      content,
      sleepQuality: Number(sleep),
      date: new Date().toISOString(),
    };
    try {
      await onSubmit(journalData);
      toast.success('Journal entry saved successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to save journal entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-content" onClick={(e) => e.stopPropagation()}>
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
              <div className="slider-value">{sleep}</div>
            </div>
          </div>
          <button type="submit" className="submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
        </div>
      </div>
    </Portal>
  );
}
