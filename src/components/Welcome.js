import React, { useState } from 'react';
import './WelcomeStyles.css';

const Welcome = ({ onStart, savedUsername, savedSubject }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [username, setUsername] = useState(savedUsername || '');
    const [subject, setSubject] = useState(savedSubject || '');
    const [apiKey, setApiKey] = useState('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [apiKeyError, setApiKeyError] = useState('');
    
    // Enhanced features with more detail and better icons
    const features = [
        {
            title: "AI-Powered Learning Assistant",
            description: "Get instant answers to any academic question with detailed explanations tailored to your learning level.",
            icon: "🧠",
            animation: "bounce"
        },
        {
            title: "Curated Educational Videos",
            description: "Discover high-quality videos from top educational channels that perfectly match your learning needs.",
            icon: "🎥",
            animation: "pulse"
        },
        {
            title: "Interactive Voice Interface",
            description: "Simply speak your questions and get immediate responses for a truly conversational learning experience.",
            icon: "🎙️",
            animation: "float"
        },
        {
            title: "Personalized Study Resources",
            description: "Access custom-selected learning resources including videos, topics and search tags matched to your interests.",
            icon: "🔍",
            animation: "bounce"
        }
    ];
    
    const subjects = [
        "Programming", "Mathematics", "Science", "History", 
        "Language Learning", "Economics", "Philosophy", "Art"
    ];

    const handleNext = () => {
        if (currentSlide < features.length) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentSlide(prev => prev + 1);
                setIsTransitioning(false);
            }, 300);
        } else {
            handleStart();
        }
    };
    
    const handlePrevious = () => {
        if (currentSlide > 0) {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentSlide(prev => prev - 1);
                setIsTransitioning(false);
            }, 300);
        }
    };
    
    const validateApiKey = () => {
        if (!apiKey || apiKey.trim() === '') {
            // No longer show error - it's optional now
            setApiKeyError('');
            return true;
        }
        
        // Basic API key format check (Gemini API keys are typically ~39 characters)
        if (apiKey.length < 20) {
            setApiKeyError('API key appears to be invalid (too short)');
            return false;
        }
        
        setApiKeyError('');
        return true;
    };
    
    const handleStart = () => {
        // Validate API key before proceeding
        if (!validateApiKey()) {
            return;
        }
        
        setIsTransitioning(true);
        setTimeout(() => {
            // Pass user preferences along with API key
            onStart(apiKey, username, subject);
        }, 500);
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        handleStart();
    };
    
    const handleSubjectSelect = (selected) => {
        setSubject(selected);
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && currentSlide === features.length) {
            e.preventDefault();
            handleStart();
        }
    };
    
    const handleApiKeyChange = (e) => {
        setApiKey(e.target.value);
        if (apiKeyError) {
            setApiKeyError('');
        }
    };
    
    return (
        <div className="welcome-container" onKeyDown={handleKeyDown}>
            <div className="welcome-header">
                <div className="logo-pulse">
                    <span>🤖</span>
                </div>
                <h1>AI Tutor</h1>
                <div className="version-badge">v1.5.0</div>
            </div>
            
            <div className={`welcome-content ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
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
                                : 'Tell us about yourself to enhance your learning journey'}
                        </p>
                        
                        <form onSubmit={handleSubmit} className="setup-form">
                            <div className="form-group">
                                <label htmlFor="username">What should we call you?</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your name..."
                                    className="text-input"
                                    autoFocus
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
                            
                            <div className="form-group">
                                <label htmlFor="apiKey">
                                    Google Gemini API Key <span className="optional-field">(optional)</span>
                                </label>
                                <input
                                    id="apiKey"
                                    type="text"
                                    value={apiKey}
                                    onChange={handleApiKeyChange}
                                    placeholder="Paste your Google Gemini API key here..."
                                    className={`text-input api-key-input ${apiKeyError ? 'input-error' : ''}`}
                                />
                                {apiKeyError && <div className="error-message">{apiKeyError}</div>}
                                <div className="api-key-hint">
                                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                                        Get a free API key from Google AI Studio
                                    </a>
                                    <span className="or-text">or</span>
                                    <span className="skip-text">continue without AI features</span>
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
                            <span>Powered by Gemini 2.0 Flash</span>
                            <span>•</span>
                            <span>For educational purposes</span>
                        </div>
                    </div>
                )}
            </div>
            
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