import React from 'react';
import './ConfirmPopup.css';

export default function ConfirmPopup({ message, onConfirm, onCancel, confirmText = 'Yes' }) {
  return (
    <div className="confirm-popup-overlay"> {/* Overlay background */}
      <div className="confirm-popup-content"> {/* Popup container */}
        <p className="confirm-popup-message">{message}</p> {/* Message text */}
        <div className="confirm-popup-buttons"> {/* Button wrapper */}
          <button className="confirm-popup-button confirm" onClick={onConfirm}>{confirmText}</button> {/* Confirm action */}
          <button className="confirm-popup-button cancel" onClick={onCancel}>Cancel</button> {/* Cancel action */}
        </div>
      </div>
    </div>
  );
}
