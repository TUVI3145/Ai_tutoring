import React, { useState, useEffect, useRef } from "react";
import "./AiTutorStyles.css";
import { fetchTutorResponse, formatResponse, formatError, createWelcomeMessage } from "../api";

// YouTube link validator helper function
// eslint-disable-next-line no-unused-vars
const isValidYouTubeUrl = (url) => {
    try {
        const urlObj = new URL(url);
        return (
            (urlObj.hostname === 'www.youtube.com' || 
             urlObj.hostname === 'youtube.com' || 
             urlObj.hostname === 'youtu.be') &&
            (urlObj.pathname.includes('/watch') || urlObj.hostname === 'youtu.be')
        );
    } catch (e) {
        return false;
    }
};

// Check if YouTube video exists (using thumbnail method)
// eslint-disable-next-line no-unused-vars
const checkYouTubeVideo = async (url) => {
    try {
        // Extract video ID
        let videoId = '';
        if (url.includes('youtube.com/watch')) {
            videoId = new URL(url).searchParams.get('v');
        } else if (url.includes('youtu.be/')) {
            videoId = url.split('youtu.be/')[1].split('?')[0];
        }
        
        if (!videoId) return false;
        
        // Try multiple thumbnail sizes to verify video exists
        const thumbnailSizes = ['mqdefault.jpg', 'hqdefault.jpg', '0.jpg'];
        
        for (const size of thumbnailSizes) {
            try {
                const response = await fetch(`https://img.youtube.com/vi/${videoId}/${size}`);
                
                // Check if response is valid
                if (response.ok) {
                    const blob = await response.blob();
                    
                    // YouTube returns a default image for invalid videos (~1kb)
                    // Real thumbnails are larger
                    if (blob.size > 1500) {
                        console.log(`Valid YouTube video found: ${url}`);
                        return true;
                    }
                }
            } catch (e) {
                console.warn(`Error checking thumbnail ${size}:`, e);
            }
        }
        
        console.warn(`Invalid or missing YouTube video: ${url}`);
        return false;
    } catch (e) {
        console.error("Error checking YouTube video:", e);
        return false;
    }
};

const AiTutor = ({ customApiKey, userData, onReturnToWelcome }) => {
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [input, setInput] = useState('');
    const [hasApiKeyError, setHasApiKeyError] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const apiKey = customApiKey || window.GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY || '';
    const { username, subject } = userData || { username: '', subject: '' };

    // For debugging
    useEffect(() => {
        console.log("API Key available:", apiKey ? "Yes (length: " + apiKey.length + ")" : "No");
    }, [apiKey]);

    // Generate subject-specific starter questions
    const subjectStarters = {
        'Programming': [
            'How do I create a responsive website?',
            'What\'s the difference between JavaScript and Python?',
            'Can you explain Object-Oriented Programming concepts?'
        ],
        'Mathematics': [
            'How do I solve quadratic equations?',
            'Can you explain calculus derivatives?',
            'What are complex numbers used for?'
        ],
        'Science': [
            'How does photosynthesis work?',
            'Explain quantum physics in simple terms',
            'What is the structure of DNA?'
        ],
        'History': [
            'What caused World War I?',
            'Tell me about the Renaissance period',
            'How did ancient civilizations impact modern society?'
        ],
        'Language Learning': [
            'What\'s the most effective way to learn vocabulary?',
            'How can I improve my pronunciation?',
            'What are some common grammar mistakes to avoid?'
        ],
        'Economics': [
            'Explain supply and demand',
            'What causes inflation?',
            'How do stock markets work?'
        ],
        'Philosophy': [
            'What is existentialism?',
            'Explain Plato\'s Theory of Forms',
            'How does ethics differ from morality?'
        ],
        'Art': [
            'What are the key art movements in history?',
            'How do I analyze a painting?',
            'What techniques do artists use to create depth?'
        ],
        'default': [
            'What topics would you like to learn about?',
            'Do you have any homework questions?',
            'How can I help with your studies today?'
        ]
    };

    // Create personalized welcome message
    useEffect(() => {
        let welcomeContent;
        
        // Check if API key exists
        if (!apiKey) {
            setHasApiKeyError(true);
            welcomeContent = formatError('You\'re using AI Tutor without an API key. This is a limited mode that provides basic information without AI-powered responses.\n\nTo get full AI functionality, you can go back to the Welcome page and add your Google Gemini API key.');
        } else {
            setHasApiKeyError(false);
            welcomeContent = createWelcomeMessage(username, subject, subjectStarters);
        }
        
        setMessages([{ 
            role: 'assistant',
            content: welcomeContent
        }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userData, apiKey]);
    
    // Auto-scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        // Add user message to chat
        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);
        
        try {
            // Check if API key exists
            if (!apiKey) {
                setTimeout(() => {
                    const errorContent = formatError('No API key provided. This is a limited demo mode without AI responses. To get real AI-powered answers, please add an API key.');
                    setMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: errorContent
                    }]);
                    setIsTyping(false);
                }, 1000);
                return;
            }
            
            // Use our API client to fetch the response
            const responseText = await fetchTutorResponse(
                apiKey, 
                userData, 
                messages.map(msg => ({
                    role: msg.role,
                    content: msg.content.replace(/<[^>]*>/g, '') // Strip HTML tags for API
                })), 
                input
            );
            
            // Format the response and add it to messages
            const formattedResponse = formatResponse(responseText);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: formattedResponse 
            }]);
            
        } catch (error) {
            console.error('Error fetching response:', error);
            
            let errorMessage = 'Sorry, I encountered an error processing your request.';
            
            if (error.message.includes('API key') || error.message.includes('401')) {
                errorMessage = 'API key validation failed. Please click the "Go Back" button to return to the Welcome page and add a valid Google Gemini API key.';
                setHasApiKeyError(true);
            } else if (error.message.includes('429')) {
                errorMessage = 'Rate limit exceeded. Please try again after a few minutes or use a different API key.';
            } else if (error.message.includes('quota')) {
                errorMessage = 'You have exceeded your current quota. Please check your plan and billing details.';
            }
            
            const formattedErrorMessage = formatError(errorMessage);
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: formattedErrorMessage
            }]);
        } finally {
            setIsTyping(false);
        }
    };
    
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
    // eslint-disable-next-line no-unused-vars
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

    // Helper function to extract YouTube video ID and generate thumbnail HTML
    // eslint-disable-next-line no-unused-vars
    const getYouTubeThumbnail = (url) => {
        try {
            let videoId = '';
            if (url.includes('youtube.com/watch')) {
                videoId = new URL(url).searchParams.get('v');
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            }
            
            if (!videoId) return '<div class="empty-thumbnail">No thumbnail</div>';
            
            return `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="Video thumbnail" class="thumbnail-image" loading="lazy" />`;
        } catch (e) {
            return '<div class="empty-thumbnail">Invalid URL</div>';
        }
    };

    const handleVoiceInput = () => {
        // Check if the Web Speech API is available
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser. Try Chrome or Edge.');
            return;
        }
        
        // If already listening, stop
        if (isListening) {
            setIsListening(false);
            return;
        }
        
        try {
            // Initialize speech recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            
            recognition.lang = 'en-US';
            recognition.continuous = false;
            recognition.interimResults = false;
            
            recognition.onstart = () => {
                setIsListening(true);
                setInput('Listening...');
            };
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
            };
            
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event);
                setIsListening(false);
                setInput('');
            };
            
            recognition.onend = () => {
                setIsListening(false);
            };
            
            recognition.start();
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
            setIsListening(false);
        }
    };

    // Helper function to format response with better structure
    const formatResponse = (text) => {
        if (!text) return '';
        
        // Format code blocks
        let formattedText = text.replace(
            /```([a-zA-Z]*)\n([\s\S]*?)\n```/g, 
            '<div class="code-block"><div class="code-header">$1</div><pre><code>$2</code></pre></div>'
        );
        
        // Format bullet points
        formattedText = formattedText.replace(
            /^\s*[-*•]\s+(.*?)$/gm,
            '<div class="bullet-point">• $1</div>'
        );
        
        // Format numbered lists
        formattedText = formattedText.replace(
            /^\s*(\d+)\.\s+(.*?)$/gm,
            '<div class="numbered-item"><span class="number">$1.</span> $2</div>'
        );
        
        // Format headings
        formattedText = formattedText.replace(
            /^#+\s+(.*?)$/gm,
            '<div class="response-heading">$1</div>'
        );
        
        // Replace newlines with <br> for proper line breaks
        formattedText = formattedText.replace(/\n/g, '<br />');
        
        return formattedText;
    };

    return (
        <div className="ai-tutor-container">
            <div className="chat-header">
                <div className="chat-header-title">
                    <div className="ai-icon">🤖</div>
                    <h1>AI Tutor</h1>
                </div>
                <div className="chat-header-controls">
                    {hasApiKeyError && (
                        <button 
                            className="settings-button" 
                            onClick={onReturnToWelcome}
                            title="Return to welcome page to fix API key"
                        >
                            ⚙️ Settings
                        </button>
                    )}
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((message, index) => (
                    <div key={index} className={`message ${message.role}`}>
                        <div 
                            className="message-content" 
                            dangerouslySetInnerHTML={{ __html: message.content }}
                        />
                    </div>
                ))}
                {isTyping && (
                    <div className="message assistant">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="input-area" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    ref={inputRef}
                    disabled={isListening}
                />
                <button 
                    type="button" 
                    className={`voice-input-button ${isListening ? 'listening' : ''}`}
                    onClick={handleVoiceInput}
                >
                    {isListening ? '🎙️' : '🎤'}
                </button>
                <button type="submit" disabled={!input.trim() && !isListening}>
                    Send
                </button>
            </form>

            <div className="disclaimer">
                <p>{username ? `${username}, please` : 'Please'} note: AI responses may not always be accurate. Verify important information with other sources.</p>
                <div className="powered-by">Powered by Gemini 2.0 Flash</div>
            </div>
        </div>
    );
};

export default AiTutor;
