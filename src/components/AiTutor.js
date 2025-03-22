import React, { useState, useEffect, useRef } from "react";
import "./AiTutorStyles.css";

// YouTube link validator helper function
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

const AiTutor = ({ customApiKey, userData }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const chatHistoryRef = useRef(null);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);

    // Generate personalized welcome message when component mounts
    useEffect(() => {
        const generateWelcomeMessage = () => {
            let greeting = "Welcome to AI Tutor!";
            
            if (userData?.username) {
                greeting = `Welcome, ${userData.username}! I'm your AI Tutor.`;
            }
            
            let welcomeText = `${greeting} Ask me any question, and I'll provide detailed explanations along with recommended videos and resources.`;
            
            if (userData?.subject) {
                welcomeText += ` I see you're interested in ${userData.subject}. Feel free to ask me anything about that topic!`;
                
                // Suggest a starter question based on the subject
                const subjectQuestions = {
                    "Programming": "Try asking: \"What are the fundamental concepts of object-oriented programming?\"",
                    "Mathematics": "Try asking: \"Can you explain the quadratic formula and its applications?\"",
                    "Science": "Try asking: \"How do black holes form and what happens inside them?\"",
                    "History": "Try asking: \"What were the major causes of World War II?\"",
                    "Language Learning": "Try asking: \"What are effective strategies for learning a new language?\"",
                    "Economics": "Try asking: \"Can you explain supply and demand with real-world examples?\"",
                    "Philosophy": "Try asking: \"What is existentialism and who are its key philosophers?\"",
                    "Art": "Try asking: \"What are the major movements in modern art?\""
                };
                
                if (subjectQuestions[userData.subject]) {
                    welcomeText += `\n\n${subjectQuestions[userData.subject]}`;
                }
            }
            
            return {
                text: welcomeText,
                sender: "ai"
            };
        };
        
        if (messages.length === 0) {
            setMessages([generateWelcomeMessage()]);
        }
    }, [userData, messages.length]);

    // Use custom API key if provided, otherwise use the one from .env
    const API_KEY = customApiKey || process.env.REACT_APP_GEMINI_API_KEY;
    console.log("📌 API Key:", API_KEY ? "Available" : "Not available");

    // Fetch YouTube tags from Tags Generator API
    const fetchYouTubeTags = async (query) => {
        try {
            const myHeaders = new Headers();
            myHeaders.append("x-apihub-key", "9BtW5vLytugJ0hv0yE3iSse05NgBj8zU47mcfbN1ag3LrslfiC");
            myHeaders.append("x-apihub-host", "Tags-Generator.allthingsdev.co");
            myHeaders.append("x-apihub-endpoint", "1e66a9a3-1925-47aa-bcb7-6f84486a96c9");

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                redirect: "follow"
            };

            const apiUrl = `https://Tags-Generator.proxy-production.allthingsdev.co/youtubeTags?title=${encodeURIComponent(query)}`;
            console.log("Fetching tags from:", apiUrl);
            
            const response = await fetch(apiUrl, requestOptions);
            const result = await response.text();
            console.log("Raw tag response:", result);
            
            let data;
            try {
                data = JSON.parse(result);
            } catch (e) {
                console.error("Failed to parse JSON response:", e);
                return [];
            }
            
            console.log("Parsed YouTube Tags Response:", data);
            
            // Handle different response formats
            const tags = data?.data?.tags || 
                         data?.tags || 
                         data?.results?.tags || 
                         [];
                         
            return tags.slice(0, 5); // Return top 5 tags
        } catch (error) {
            console.error('Tag API Error:', error);
            return [];
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
        const userMessage = input;
        setInput("");
        
        try {
            if (!API_KEY) {
                throw new Error("API key not found - check .env file");
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `${userData?.username ? `[User's name: ${userData.username}]` : ''}
                                ${userData?.subject ? `[User is interested in: ${userData.subject}]` : ''}
                                
                                Respond to: ${userMessage}\n\n
                                Requirements:\n
                                1. Provide detailed answer (3-5 paragraphs)\n
                                2. Suggest 3 REAL YouTube videos using STRICT format:\n
                                VIDEO_START
                                Title: "Complete Tutorial Title - EXACTLY as it appears on YouTube"
                                URL: https://www.youtube.com/watch?v=VIDEOID
                                Reason: "Relevance explanation in one sentence"
                                VIDEO_END
                                Rules:
                                - ONLY suggest videos that actually exist on YouTube with EXACT titles
                                - ONLY use real video IDs from existing YouTube videos
                                - ONLY videos from major educational channels like Khan Academy, Coursera, edX, MIT OpenCourseWare, freeCodeCamp, Crash Course, TED-Ed, etc.
                                - URLs must have real video IDs (not placeholders like ABCD1234)
                                - DO NOT make up or invent video links
                                - Published within last 3 years
                                - Duration under 20 minutes
                                - No markdown formatting
                                ${userData?.subject ? `- Focus on ${userData.subject} content since user is interested in this subject` : ''}`
                            }]
                        }]
                    }),
                }
            );
    
            console.log("Response Status:", response.status);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error?.message || `HTTP error! status: ${response.status}`);
            }

            if (!data.candidates?.[0]?.content?.parts) {
                throw new Error('Invalid response structure from API');
            }

            const fullResponse = data.candidates[0].content.parts[0].text;
            
            // Extract main text and video suggestions
            let mainText = fullResponse;
            let videoSuggestions = '';
            
            // Get YouTube search tags from Tags Generator API first
            const tags = await fetchYouTubeTags(userMessage);
            console.log("Fetched YouTube tags:", tags);
            
            // Format tags with better styling
            const tagLinks = tags.length > 0
                ? `<div class="youtube-tags-wrapper">
                     ${tags.map(tag =>
                        `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(tag)}" 
                          class="youtube-tag" 
                          target="_blank" 
                          rel="noopener noreferrer">${tag}</a>`
                      ).join('')}
                   </div>`
                : '<em>No tags found for this query</em>';
            
            // Extract video suggestions if they exist
            const videoMatches = fullResponse.match(/VIDEO_START[\s\S]*?VIDEO_END/g);
            
            if (videoMatches) {
                // Parse all videos
                const parsedVideos = videoMatches.map(video => {
                    const title = video.match(/Title: "(.*?)"/)?.[1] || 'Untitled Video';
                    const url = video.match(/URL: (.*?)(\n|$)/)?.[1]?.trim() || '';
                    const reason = video.match(/Reason: "(.*?)"/)?.[1] || 'No description provided';
                    return { title, url, reason };
                });
                
                // Add parsed videos to mainText for now (will be updated after validation)
                videoSuggestions = parsedVideos.map(video => 
                    `\n• <div class="video-recommendation">
                        <div class="video-thumbnail">
                            <a href="${video.url}" target="_blank" rel="noopener noreferrer">
                                ${getYouTubeThumbnail(video.url)}
                            </a>
                        </div>
                        <div class="video-details">
                            <a href="${video.url}" 
                               class="video-title" 
                               target="_blank" 
                               rel="noopener noreferrer">${video.title}</a>
                            <div class="video-reason">${video.reason}</div>
                        </div>
                     </div>`
                ).join('\n');
                
                // Remove video sections from main text
                mainText = fullResponse.replace(/VIDEO_START[\s\S]*?VIDEO_END/g, '').trim();
                
                // Validate videos in background after response is shown
                setTimeout(async () => {
                    let validVideos = [];
                    for (const video of parsedVideos) {
                        if (isValidYouTubeUrl(video.url)) {
                            const exists = await checkYouTubeVideo(video.url);
                            if (exists) {
                                validVideos.push(video);
                            }
                        }
                    }
                    
                    if (validVideos.length > 0) {
                        // Update messages with only valid videos
                        const updatedVideoSection = validVideos.map(video => 
                            `\n• <div class="video-recommendation">
                                <div class="video-thumbnail">
                                    <a href="${video.url}" target="_blank" rel="noopener noreferrer">
                                        ${getYouTubeThumbnail(video.url)}
                                    </a>
                                </div>
                                <div class="video-details">
                                    <a href="${video.url}" 
                                       class="video-title" 
                                       target="_blank" 
                                       rel="noopener noreferrer">${video.title}</a>
                                    <div class="video-reason">${video.reason}</div>
                                </div>
                             </div>`
                        ).join('\n');
                        
                        setMessages(prevMessages => {
                            const updatedMessages = [...prevMessages];
                            const lastMessage = updatedMessages[updatedMessages.length - 1];
                            
                            // Replace the entire video section with only valid videos
                            const baseText = mainText.replace(/\*\*/g, '');
                            lastMessage.text = `${baseText}\n\n<div class="section-header">📝 Related YouTube Tags</div><div class="youtube-tags-container">${tagLinks}</div>${updatedVideoSection ? '\n\n<div class="section-header">🎥 Recommended Videos</div>' + updatedVideoSection : '\n\n<div class="section-header">🎥 Recommended Videos</div><div class="no-videos-message">No working videos found. Try searching with the tags above.</div>'}`;
                            
                            return updatedMessages;
                        });
                    } else {
                        // No valid videos found, update message to indicate this
                        setMessages(prevMessages => {
                            const updatedMessages = [...prevMessages];
                            const lastMessage = updatedMessages[updatedMessages.length - 1];
                            
                            const baseText = mainText.replace(/\*\*/g, '');
                            lastMessage.text = `${baseText}\n\n<div class="section-header">📝 Related YouTube Tags</div><div class="youtube-tags-container">${tagLinks}</div>\n\n<div class="section-header">🎥 Recommended Videos</div><div class="no-videos-message">No working videos found. Try searching with the tags above.</div>`;
                            
                            return updatedMessages;
                        });
                    }
                }, 100);
            }

            const aiResponse = {
                text: `${mainText.replace(/\*\*/g, '')}\n\n<div class="section-header">📝 Related YouTube Tags</div><div class="youtube-tags-container">${tagLinks}</div>${videoSuggestions ? '\n\n<div class="section-header">🎥 Recommended Videos</div>' + videoSuggestions : '\n\n<div class="section-header">🎥 Recommended Videos</div><div class="no-videos-message">No video recommendations found for this topic. Try searching YouTube with the tags above.</div>'}`,
                sender: "ai"
            };
            
            setMessages((prevMessages) => [...prevMessages, aiResponse]);
        } catch (error) {
            console.error("Chat Error:", error);
            let errorMessage = "🚨 An unexpected error occurred";
            
            if (error.message.includes('quota')) {
                errorMessage = "⚠️ API quota exceeded - try again later";
            } else if (error.message.includes('API key')) {
                errorMessage = "🔑 Invalid API key - check .env file";
            } else if (error.message.includes('network')) {
                errorMessage = "🌐 Network error - check your connection";
            } else if (error.message.includes('HTTP error')) {
                errorMessage = `⚠️ Server error (${error.message.match(/\d+/)?.[0] || 'unknown'})`;
            }
                
            setMessages(prev => [...prev, { text: errorMessage, sender: "ai" }]);
        } finally {
            setTyping(false);
        }
    };
    
    // Helper function to extract YouTube video ID and generate thumbnail HTML
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
            
            <div className="chat-history" ref={chatHistoryRef}>
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <h3>👋 Welcome to AI Tutor!</h3>
                        <p>Ask me anything about programming, math, science, or any topic you're learning.</p>
                        <p>I can help explain concepts and suggest helpful YouTube resources.</p>
                    </div>
                )}
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
                                    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
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
                    Powered by Gemini Flash • {userData?.username ? `Hello, ${userData.username}` : 'Responses may vary'} • v1.5.0
                </div>
            </div>
        </div>
    );
};

export default AiTutor;
