import React, { useRef, useEffect, useState } from 'react'; // Import React hooks
import { useTypingEffect } from '../hooks/useTypingEffect'; // Custom hook for typing animation
import Footer from '../components/Footer'; // Footer component
import './Home.css' // Component-specific styles
import '../home_style.css'; // General/global styles
import { useNavigate } from 'react-router-dom'; // Hook for navigation/redirection
import { useLoginPopup } from '../contexts/LoginPopupContext'; // Context to handle login popup state

// Array of inspiring mental health quotes
const quotes = [
  "Your mind matters as much as your body.",
  "It’s okay to not be okay.",
  "You are not your illness.",
  "Your struggles don’t define you.",
  "Caring for your mind is self-love.",
  "You deserve peace.",
  "Seeking help shows strength.",
  "Rest. Heal. Repeat.",
  "You’re never alone.",
  "Asking for help is brave.",
  "Mental health is a journey.",
  "You matter more than validation.",
  "Healing takes time.",
  "You are stronger than you think.",
  "Your path is your own.",
  "Self-care isn’t selfish.",
  "Small steps count.",
  "You can heal.",
  "Illness isn’t failure.",
  "Stop the stigma.",
  "You deserve peace of mind.",
  "The struggle is worth it.",
  "Struggling isn’t weakness.",
  "Medication helps; no shame.",
  "You’re not a burden.",
  "You’re whole, not broken.",
  "Mind over milestones.",
  "You can live fully.",
  "You hold the power to heal.",
  "Protect your peace.",
  "You deserve love—especially from you.",
  "Your future is bright.",
  "Prioritize peace.",
  "You’re never truly alone.",
  "You are not your thoughts.",
  "Choose a kinder mindset.",
  "Recovery starts with asking for help.",
  "You are worthy of joy.",
  "Bad days are okay.",
  "Change begins within.",
  "Boundaries are self-care.",
  "Purpose grows through pain.",
  "Tough times reveal strength.",
  "Growth comes from struggle.",
  "Feel deeply—it’s human.",
  "Let your inner light shine.",
  "You deserve your own love.",
  "This feeling will pass.",
  "Cope, don’t collapse.",
  "Bounce back stronger.",
  "Invisible doesn’t mean unreal.",
  "No health without mental health.",
  "Walk away from toxicity.",
  "Talking heals.",
  "Conversations change minds.",
  "Move your body, free your mind.",
  "Self-care is power.",
  "Healing starts with feeling.",
  "Talk—end the stigma.",
  "Asking for help is power.",
  "Your pain is valid.",
  "Be patient with healing.",
  "You are not alone.",
  "Your story has power.",
  "Rest is healing.",
  "Your worth is constant.",
  "Boundaries are peace.",
  "Be kind to yourself.",
  "Asking for help is brave.",
  "Own your mental health.",
  "Outgrow what hurts you.",
  "Emotions come and go.",
  "Fill your own cup first.",
  "Your feelings matter.",
  "Tiny steps make big change.",
  "Rest is productive.",
  "Endings can bring peace.",
  "You don’t need permission to heal.",
  "Sanity isn’t selfish.",
  "Healing takes time.",
  "You’re not broken—you’re healing.",
  "Feelings are valid.",
  "Growth comes through discomfort.",
  "Care for your mind.",
  "You are not alone.",
  "You’re doing your best."
];

export default function Home() {
  const mottoRef = useRef(null); // Ref for the element that displays the typing effect
  const [motto, setMotto] = useState(''); // State to hold the selected random quote
  const navigate = useNavigate(); // Navigation hook
  const { handleLoginClick } = useLoginPopup(); // Function to open the login popup

  // Effect to check if user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      navigate('/dashboard'); // Redirect to dashboard if user is found
    }
  }, [navigate]);

  // Effect to select and set a random quote on mount
  useEffect(() => {
    setMotto(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  // Apply the custom typing effect hook to the motto element
  useTypingEffect(mottoRef, motto, 100);

  return (
    <div className='home-container'>
      
      <main className="main-container fade-in-effect">
        <section className="hero-section">
          <div className="motto design_text">
            <img src="/assets/star.svg" alt="Decorative star" className="star-icon" />
            {/* Element where the typing effect renders the motto */}
            <span ref={mottoRef} className="motto-line typing-cursor"></span>
            <img src="/assets/star.svg" alt="Decorative star" className="star-icon" />
          </div>
          
          {/* Mobile call-to-action button */}
          <div className='mobile-get-started'>
            <button onClick={handleLoginClick} className="regular_text nav-link login_button">GET STARTED ➜</button>
          </div>
          
        </section>

        <Footer />
      </main>
      
    </div>
  );
}
