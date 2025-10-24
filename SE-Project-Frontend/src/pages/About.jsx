import React from 'react';
import './About.css';

// Team member data
const teamMembers = [
  { name: 'Yashdeep', role: 'Frontend Developer', avatar: '/assets/male.svg' },
  { name: 'Akshat Jaipuriar', role: 'Backend Developer', avatar: '/assets/male2.svg' },
  { name: 'Srushty Narayankar', role: 'UX/UI Designer', avatar: '/assets/female.svg' },
  { name: 'Ayush Rewanshete', role: 'Backend Assistance & Documentation', avatar: '/assets/male3.svg' },
];

// Values data
const values = [
  { title: 'Empathy', logo: 'assets/empathy.gif', description: 'We believe in listening with an open heart and creating a space free of judgment.' },
  { title: 'Accessibility', logo: 'assets/accessibility.gif', description: 'Mental wellness resources should be available to everyone, everywhere.' },
  { title: 'Privacy', logo: 'assets/privacy.gif', description: 'Your journey is personal. We are committed to protecting your data and your trust.' },
];

export default function About() {
  return (
    <>
      <div className="about-page">
        {/* Hero Section */}
        <header className="about-hero">
          <div className="about-hero-content">
            <div>
              <img src='assets/self-reflection.gif' style={{ width: '64px', height: '64px' }} />
              <h1>A mirror to your mind, a friend for your journey.</h1>
            </div>
            <p>ManoDarpan is a compassionate space designed to help you understand, track, and improve your mental well-being.</p>
          </div>
        </header>

        {/* Our Story Section */}
        <section className="about-section">
          <img src='assets/idea.gif' style={{ width: '64px', height: '64px' }} />
          <h2>Our Story</h2>
          <p>ManoDarpan was born from a simple idea: that everyone deserves to feel understood, supported, and empowered on their mental health journey. We saw a need for a tool that was more than just a tracker—a companion that offers insights, resources, and a private space for reflection. Our mission is to break the stigma around mental health and make self-care an accessible, everyday practice.</p>
        </section>

        {/* Our Values Section */}
        <section className="about-section values-section">
          <h2>Our Values</h2>
          <div className="values-container">
            {values.map((value, index) => (
              <div className="value-card" key={index}>
                <img src={value.logo} style={{ width: '64px', height: '64px' }} />
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Team Section */}
        <section className="about-section">
          <h2>Meet the Team</h2>
          <div className="team-container">
            {teamMembers.map((member, index) => (
              <div className="team-member-card" key={index}>
                <img src={member.avatar} alt={`${member.name}`} className="team-member-avatar" />
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
