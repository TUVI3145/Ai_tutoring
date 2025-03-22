import React, { useState, useEffect } from 'react';
import AiTutor from './components/AiTutor';
import Welcome from './components/Welcome';

function App() {
  // Force showWelcome to true for testing
  const [showWelcome, setShowWelcome] = useState(true);
  const [apiKey, setApiKey] = useState(process.env.REACT_APP_GEMINI_API_KEY || '');
  const [userData, setUserData] = useState({
    username: '',
    subject: ''
  });
  
  // Comment out the localStorage check temporarily to force Welcome page to show
  /*
  useEffect(() => {
    const hasVisited = localStorage.getItem('aiTutorHasVisited');
    const savedUserData = localStorage.getItem('aiTutorUserData');
    
    if (hasVisited) {
      setShowWelcome(false);
    }
    
    if (savedUserData) {
      try {
        setUserData(JSON.parse(savedUserData));
      } catch (e) {
        console.error('Error parsing saved user data:', e);
      }
    }
  }, []);
  */
  
  const handleStart = (key, username, subject) => {
    // If no key is provided, use the environment variable
    if (key) {
      setApiKey(key);
      localStorage.setItem('REACT_APP_GEMINI_API_KEY', key);
    }
    
    // Save user data
    const newUserData = {
      username: username || userData.username,
      subject: subject || userData.subject
    };
    
    setUserData(newUserData);
    localStorage.setItem('aiTutorUserData', JSON.stringify(newUserData));
    
    // Set the visited flag in localStorage
    localStorage.setItem('aiTutorHasVisited', 'true');
    setShowWelcome(false);
  };
  
  console.log("Rendering App component, showWelcome:", showWelcome);
  
  return (
    <div className="App">
      {showWelcome ? (
        <Welcome 
          onStart={handleStart} 
          savedUsername={userData.username}
          savedSubject={userData.subject}
        />
      ) : (
        <AiTutor 
          customApiKey={apiKey} 
          userData={userData}
        />
      )}
    </div>
  );
}

export default App;
