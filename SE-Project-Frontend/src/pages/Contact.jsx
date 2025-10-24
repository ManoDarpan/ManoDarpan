import React, { useRef } from 'react';
import './Contact.css';
import { useTypingEffect } from '../hooks/useTypingEffect';
import Lottie from 'lottie-react';
import animationData from '../animations/contact_us.json/';
import '../home_style.css';

export default function Contact() {
  const contactRef = useRef(null);
  useTypingEffect(contactRef, 'You can always reach us 🤗');

  return (
    <>
    <main className="contact-page">

      <div className="contact-anim">
          <Lottie animationData={animationData} style={{width:500 , height:500}} loop={true} autoplay={true} />
      </div>

      <p ref={contactRef} className="design_text contact-heading"></p>

      <section className="hero-section">
        
        
        <div className="contact-content">
          <a href="mailto:manodarpan@outlook.com" className="contact-card">
            <img src="/assets/mail.png" alt="Mail Icon" className="contact-icon" />
            <div>
              <h3>Email Us</h3>
              <span className="contact-link">manodarpan@outlook.com</span>
              <p>We reply within 24 hours on weekdays.</p>
            </div>
          </a>
          <a href="tel:1441" className="contact-card">
            <img src="/assets/phone-call.png" alt="Phone Icon" className="contact-icon" />
            <div>
              <h3>Call Us</h3>
              <span className="contact-link">1441</span>
              <p>Available 9am - 6pm, Monday to Saturday.</p>
            </div>
          </a>
          <a href='https://maps.app.goo.gl/UdKU7RzTYa88eEhW6' target="_blank" rel="noopener noreferrer" className="contact-card">
            <img src="/assets/location.png" alt="Location Icon" className="contact-icon" />
            <div>
              <h3>Visit Us</h3>
              <span className="contact-link">Institute of Mental Health and Hospital ,<br />Agra, India</span>
              <p>Walk-ins welcome 10am - 4pm.</p>
            </div>
          </a>
        </div>
      </section>
    </main>
    </>
  );
}