import React, { useState, useEffect } from 'react';
import './App.css';
import AiTutor from './components/AiTutor';
import Welcome from './components/Welcome';

function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [userData, setUserData] = useState({
    apiKey: 'AIzaSyD19g_oIOlr4k6CLNVgXuH6qYBR1amgQ-E', // Google Gemini API key
    username: '',
    subject: ''
  });

  useEffect(() => {
    // Clear localStorage for testing
    // localStorage.removeItem('aiTutorHasVisited');
    // localStorage.removeItem('aiTutorUserData');
    
    console.log("Checking localStorage for previous visit");
    const hasVisited = localStorage.getItem('aiTutorHasVisited');
    const savedUserData = localStorage.getItem('aiTutorUserData');
    
    console.log("hasVisited:", hasVisited);
    console.log("savedUserData:", savedUserData);
    
    if (hasVisited === 'true' && savedUserData) {
      try {
        const parsedUserData = JSON.parse(savedUserData);
        setUserData(parsedUserData);
        setShowWelcome(false);
        console.log("User has visited before, showing AI Tutor");
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        setShowWelcome(true);
        console.log("Error parsing user data, showing Welcome");
      }
    } else {
      setShowWelcome(true);
      console.log("First-time visitor, showing Welcome");
    }
    
  }, []);

  const handleStart = (apiKey, username, subject) => {
    const newUserData = { 
      apiKey: apiKey || userData.apiKey, // Use provided API key or default
      username, 
      subject 
    };
    
    console.log("handleStart called with:", { apiKey: apiKey ? "API key provided" : "No API key", username, subject });
    
    // Save to state
    setUserData(newUserData);
    
    // Save to localStorage
    localStorage.setItem('aiTutorHasVisited', 'true');
    localStorage.setItem('aiTutorUserData', JSON.stringify(newUserData));
    
    // Switch to AI Tutor
    setShowWelcome(false);
  };

  const handleReturnToWelcome = () => {
    // Return to the welcome page (used if API key is missing or invalid)
    setShowWelcome(true);
  };

  console.log("Rendering App, showWelcome:", showWelcome);

  return (
    <div className="app-container">
      {showWelcome ? (
        <Welcome 
          onStart={handleStart} 
          savedUsername={userData.username} 
          savedSubject={userData.subject}
        />
      ) : (
        <AiTutor 
          customApiKey={userData.apiKey} 
          userData={userData}
          onReturnToWelcome={handleReturnToWelcome}
        />
      )}
    </div>
  );
}

export default App;
