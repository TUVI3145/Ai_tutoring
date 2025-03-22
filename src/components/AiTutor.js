import React, { useState, useEffect } from "react";
import "./AiTutorStyles.css";




const AiTutor = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
    console.log("📌 API Key:", API_KEY);


    // Speech Recognition Setup
    let recognition;
    if ("webkitSpeechRecognition" in window) {
        recognition = new window.webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const speechText = event.results[0][0].transcript;
            setInput(speechText);
            console.log("Speech Recognition Supported:", "webkitSpeechRecognition" in window);
        };
    } else {
        console.warn("Speech Recognition not supported in this browser.");
    }

    // Start Speech-to-Text Listening
    const startListening = () => {
        if (!recognition) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        try {
            recognition.start();
        } catch (error) {
            console.error("Error starting speech recognition:", error);
            alert("⚠️ Please enable microphone permissions in your browser settings.");
        }
    };

    // Send Message to Gemini API
    const sendMessage = async () => {
        if (!input.trim()) return;
        
        setTyping(true);
        setInput("");
        
        try {
            const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
            if (!API_KEY) {
                throw new Error("API key not found - check .env file");
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: input }] }] }),
                }
            );
    
            console.log("Response Status:", response.status);
            const data = await response.json();
            
            if (!response.ok || !data.candidates?.[0]?.content?.parts) {
                throw new Error(`API Error: ${data.error?.message || 'Invalid response structure'}`);
            }

            const aiResponse = {
                text: data.candidates[0].content.parts[0].text.replace(/\*\*/g, ''), // Clean markdown bold
                sender: "ai"
            };
            setMessages((prevMessages) => [...prevMessages, aiResponse]);
        } catch (error) {
            console.error("Chat Error:", error);
            const errorMessage = error.message.includes('quota')
                ? "⚠️ API quota exceeded - try again later"
                : error.message.includes('API key')
                ? "🔑 Invalid API key - check .env file"
                : "🚨 Connection failed - check network";
                
            setMessages(prev => [...prev, { text: errorMessage, sender: "ai" }]);
        } finally {
            setTyping(false);
        }
    };
    
    

    return (
        <div className="ai-tutor-container">
            <div className="header">
                <div className="ai-avatar">
                    <div className="ai-status-indicator" />
                    <span>🤖</span>
                </div>
                <h2>AI Tutor Assistant</h2>
                <div className="connection-status">
                    {API_KEY ? '🔗 Connected' : '⚠️ Disconnected'}
                </div>
            </div>
            
            <div className="chat-history">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.sender}-message`}
                        style={{ animation: `slideIn 0.3s ease ${index * 0.05}s both` }}
                    >
                        <div className="message-header">
                            <span className="sender">
                                {msg.sender === 'ai' ? 'AI Tutor' : 'You'}
                            </span>
                            <span className="timestamp">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <div
                            className="message-content"
                            dangerouslySetInnerHTML={{
                                __html: msg.text
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/\n/g, '<br/>')
                                    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                            }}
                        />
                    </div>
                ))}
                {typing && (
                    <div className="typing-indicator">
                        <div className="dot-flashing" />
                        <span>Analyzing your question...</span>
                    </div>
                )}
            </div>

            <div className="input-container">
                <div className="input-wrapper">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything..."
                        onKeyPress={(e) => e.key === 'Enter' && !typing && sendMessage()}
                    />
                    <div className="button-group">
                        <button
                            onClick={sendMessage}
                            className={`send-button ${typing ? 'loading' : ''}`}
                            disabled={typing}
                        >
                            <span className="button-text">
                                {typing ? 'Processing...' : 'Send'}
                            </span>
                            <span className="send-arrow">➤</span>
                        </button>
                        <button
                            onClick={startListening}
                            className={`mic-button ${isListening ? 'active' : ''}`}
                            title="Voice input"
                        >
                            {isListening ? (
                                <div className="pulsating-mic">🎙️</div>
                            ) : (
                                '🎤'
                            )}
                        </button>
                    </div>
                </div>
                <div className="disclaimer">
                    Powered by Gemini Flash • Responses may vary • v1.5.0
                </div>
            </div>
        </div>
    );
};

export default AiTutor;
