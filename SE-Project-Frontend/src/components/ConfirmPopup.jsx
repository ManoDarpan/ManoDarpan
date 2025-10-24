import React from 'react';
import './ConfirmPopup.css';

export default function ConfirmPopup({ message, onConfirm, onCancel, confirmText = 'Yes' }) {
  return (
    <div className="confirm-popup-overlay">
      <div className="confirm-popup-content">
        <p className="confirm-popup-message">{message}</p>
        <div className="confirm-popup-buttons">
          <button className="confirm-popup-button confirm" onClick={onConfirm}>{confirmText}</button>
          <button className="confirm-popup-button cancel" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
