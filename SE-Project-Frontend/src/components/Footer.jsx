import React from 'react';
import './Footer.css'
import Lottie from 'lottie-react'; // Library for rendering Lottie animations
import helpAnim from '../animations/seek_help.json/' // Import the animation JSON file

export default function Footer() {
  return (
    <footer className="bottom-section regular_text"> {/* Main footer container */}
      <div className="support-message"> {/* First support message block */}
        <span className="support-text">
          Your journey to a<br /><strong>brighter mind</strong><br />starts here. {/* Main marketing message */}
        </span>
      </div>

      <div className = 'help-anim'> {/* Container for the Lottie animation */}
        <Lottie animationData={helpAnim} loop={true} autoplay={true}  /> {/* Renders the animation */}
      </div>

      <div className="support-message"> {/* Second support message block */}
        <span className="support-text">
            Take the first step with us. 😊 {/* Encouraging call to action */}
        </span>
      </div>

      
      
    </footer>
  );
}
