import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Clear localStorage for testing
localStorage.removeItem('aiTutorHasVisited');
localStorage.removeItem('aiTutorUserData');
console.log('localStorage cleared for testing');

// Set the API key globally (Google Gemini API key)
window.GEMINI_API_KEY = 'AIzaSyD19g_oIOlr4k6CLNVgXuH6qYBR1amgQ-E';

// For debugging - log environment variables
console.log('Google Gemini API key is set globally (length: ' + window.GEMINI_API_KEY.length + ')');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
