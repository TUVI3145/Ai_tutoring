import React, { useState, useEffect } from 'react';
import './WelcomeStyles.css';

const Welcome = ({ onStart, savedUsername, savedSubject }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [username, setUsername] = useState(savedUsername || '');
    const [subject, setSubject] = useState(savedSubject || '');
    
    // Enhanced features with more detail and better icons
    const features = [
        {
            title: "Personalized Learning Experience",
            description: "Get detailed answers tailored to your learning style and knowledge level. Ask any question and receive in-depth explanations.",
            icon: "🧠",
            animation: "bounce"
        },
        {
            title: "Educational Video Recommendations",
            description: "Discover curated YouTube videos from top educational channels that match your learning needs.",
            icon: "🎥",
            animation: "pulse"
        },
        {
            title: "Multi-modal Interaction",
            description: "Type your questions or use voice input for a more natural, conversational learning experience.",
            icon: "🎙️",
            animation: "float"
        },
        {
            title: "Topic Exploration",
            description: "Explore related concepts with AI-generated topic suggestions and YouTube search tags for deeper learning.",
            icon: "🔍",
            animation: "bounce"
        }
    ];
    
    const subjects = [
        "Programming", "Mathematics", "Science", "History", 
        "Language Learning", "Economics", "Philosophy", "Art"
    ];

    // Skip to personalization if returning user with saved data
    useEffect(() => {
        if (savedUsername || savedSubject) {
            setCurrentSlide(features.length);
        }
    }, [savedUsername, savedSubject, features.length]);

    const handleNext = () => {
        if (currentSlide < features.length) {
            setCurrentSlide(prev => prev + 1);
        } else {
            handleStart();
        }
    };
    
    const handlePrevious = () => {
        setCurrentSlide(prev => prev > 0 ? prev - 1 : prev);
    };
    
    const handleStart = () => {
        // Pass user preferences along with empty API key
        onStart('', username, subject);
    };
    
    const handleSubjectSelect = (selected) => {
        setSubject(selected);
    };
    
    return (
        <div className="welcome-container">
            <div className="welcome-header">
                <div className="logo-pulse">
                    <span>🤖</span>
                </div>
                <h1>AI Tutor</h1>
                <div className="version-badge">v1.5.0</div>
            </div>
            
            {currentSlide <= features.length ? (
                <div className="welcome-content">
                    {currentSlide < features.length ? (
                        <div className="features-section">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${(currentSlide / features.length) * 100}%` }}
                                />
                            </div>
                            
                            <div className="feature-card">
                                <div className={`feature-icon ${features[currentSlide].animation}`}>
                                    {features[currentSlide].icon}
                                </div>
                                <h2>{features[currentSlide].title}</h2>
                                <p>{features[currentSlide].description}</p>
                            </div>
                            
                            <div className="slide-controls">
                                <div className="slide-dots">
                                    {features.map((_, index) => (
                                        <span 
                                            key={index} 
                                            className={`slide-dot ${index === currentSlide ? 'active' : ''}`}
                                            onClick={() => setCurrentSlide(index)}
                                        />
                                    ))}
                                </div>
                                <div className="slide-buttons">
                                    <button 
                                        className="slide-button" 
                                        onClick={handlePrevious}
                                        disabled={currentSlide === 0}
                                    >
                                        ←
                                    </button>
                                    <button 
                                        className="slide-button next" 
                                        onClick={handleNext}
                                    >
                                        {currentSlide === features.length - 1 ? 'Continue' : 'Next →'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="setup-section">
                            <h2>Personalize Your Experience</h2>
                            <p className="setup-subtitle">
                                {savedUsername 
                                    ? `Welcome back, ${savedUsername}! You can update your preferences below.` 
                                    : 'Tell us a bit about yourself to enhance your learning journey'}
                            </p>
                            
                            <form onSubmit={(e) => { e.preventDefault(); handleStart(); }} className="setup-form">
                                <div className="form-group">
                                    <label htmlFor="username">What should we call you? (optional)</label>
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your name..."
                                        className="text-input"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>What are you interested in learning?</label>
                                    <div className="subject-tags">
                                        {subjects.map(sub => (
                                            <div 
                                                key={sub} 
                                                className={`subject-tag ${subject === sub ? 'selected' : ''}`}
                                                onClick={() => handleSubjectSelect(sub)}
                                            >
                                                {sub}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="button-container">
                                    <button 
                                        type="button" 
                                        className="secondary-button"
                                        onClick={handlePrevious}
                                    >
                                        Back
                                    </button>
                                    <button type="submit" className="primary-button">
                                        {savedUsername ? 'Continue Learning' : 'Start Learning'}
                                    </button>
                                </div>
                            </form>
                            
                            <div className="disclaimer">
                                <span>Powered by Google Gemini AI</span>
                                <span>•</span>
                                <span>For educational purposes</span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="welcome-content">
                    <div className="loading-section">
                        <div className="spinner"></div>
                        <h2>Preparing your experience...</h2>
                        <p>Getting everything ready for an amazing learning journey!</p>
                    </div>
                </div>
            )}
            
            <div className="welcome-footer">
                <div className="footer-content">
                    <div className="footer-links">
                        <a href="#about">About</a>
                        <a href="#privacy">Privacy</a>
                        <a href="#terms">Terms</a>
                    </div>
                    <div className="copyright">© 2023 AI Tutor - All rights reserved</div>
                </div>
            </div>
        </div>
    );
};

export default Welcome; 