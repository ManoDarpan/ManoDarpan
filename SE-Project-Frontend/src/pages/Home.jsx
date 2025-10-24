import React, { useRef, useEffect, useState } from 'react';
import { useTypingEffect } from '../hooks/useTypingEffect';
import Footer from '../components/Footer';
import './Home.css'
import '../home_style.css';
import { useNavigate } from 'react-router-dom';
import { useLoginPopup } from '../contexts/LoginPopupContext';

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
  const mottoRef = useRef(null);
  const [motto, setMotto] = useState('');
  const navigate = useNavigate();
  const { handleLoginClick } = useLoginPopup();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    setMotto(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  useTypingEffect(mottoRef, motto, 100);

  return (
    <div className='home-container'>
      
      <main className="main-container fade-in-effect">
        <section className="hero-section">
          <div className="motto design_text">
            <img src="/assets/star.svg" alt="Decorative star" className="star-icon" />
            <span ref={mottoRef} className="motto-line typing-cursor"></span>
            <img src="/assets/star.svg" alt="Decorative star" className="star-icon" />
          </div>
          
          <div className='mobile-get-started'>
            <button onClick={handleLoginClick} className="regular_text nav-link login_button">GET STARTED ➜</button>
          </div>
          
        </section>

        <Footer />
      </main>
      
    </div>
  );
}