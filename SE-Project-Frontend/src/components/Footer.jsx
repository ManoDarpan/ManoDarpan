import React from 'react';
import './Footer.css'
import Lottie from 'lottie-react';
import helpAnim from '../animations/seek_help.json/'

export default function Footer() {
  return (
    <footer className="bottom-section regular_text">
      <div className="support-message">
        <span className="support-text">
          Your journey to a<br /><strong>brighter mind</strong><br />starts here.
        </span>
      </div>

      <div className = 'help-anim'>
        <Lottie animationData={helpAnim} loop={true} autoplay={true}  />
      </div>

      <div className="support-message">
        <span className="support-text">
            Take the first step with us. 😊
        </span>
      </div>

      
      
    </footer>
  );
}