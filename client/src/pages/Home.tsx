import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo-section">
          <div className="logo-icon">🧠</div>
          <div className="logo-text">
            <h1>HippoCare AI</h1>
            <p>Precision Radiotherapy</p>
          </div>
        </div>
        <button className="get-started-btn" onClick={() => navigate('/upload')}>
          Get Started
        </button>
      </header>

      <main className="home-main">
        <div className="hero-section">
          <h2 className="hero-title">
            <span className="title-part1">Revolutionizing</span>{' '}
            <span className="title-part2">Hippocampal Segmentation</span>
          </h2>
          <p className="hero-description">
            Welcome to the future of precision radiotherapy. Our sophisticated Mask R-CNN deep learning model 
            automates hippocampal segmentation from brain MRI scans, dramatically reducing manual planning time 
            and safeguarding patient memory functions.
          </p>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3>Instant Results</h3>
            <p>Reduce manual planning time from hours to minutes with AI-powered automation.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h3>Clinical Precision</h3>
            <p>Decrease inter-observer variability with consistent, reproducible segmentations.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon purple">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>Memory Protection</h3>
            <p>Safeguard vital memory functions from radiation-induced damage.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;

