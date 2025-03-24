// Express server for AI Tutor API
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

// Default Gemini API key (should be configured with an environment variable in production)
const DEFAULT_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyD19g_oIOlr4k6CLNVgXuH6qYBR1amgQ-E';

// API endpoint to get a tutor response
app.post('/api/tutor/chat', async (req, res) => {
    try {
        const { apiKey, userData, messages, userInput } = req.body;
        
        // Validate request
        if (!userInput) {
            return res.status(400).json({ error: 'User input is required' });
        }
        
        // Use provided API key or default
        const key = apiKey || DEFAULT_API_KEY;
        
        // Set up API request for Gemini
        const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
        
        // Format messages for Gemini API
        const { username, subject } = userData || { username: '', subject: '' };
        const userContext = username ? `My name is ${username}. ` : '';
        const subjectContext = subject ? `I'm studying ${subject}. ` : '';
        
        // Create request body
        const messageBody = {
            contents: [],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
            }
        };
        
        // Add system message as user message (Gemini doesn't have system role)
        messageBody.contents.push({
            role: "user",
            parts: [
                {
                    text: `You are a helpful and knowledgeable tutor. ${username ? `The user's name is ${username}.` : ''} ${subject ? `They are interested in learning about ${subject}.` : ''} Provide detailed, educational responses that are helpful for learning.`
                }
            ]
        });
        
        // Add conversation history if available
        if (messages && messages.length > 0) {
            messages.filter(msg => msg.role === 'user' || msg.role === 'assistant').forEach(msg => {
                messageBody.contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
                });
            });
        }
        
        // Add current user message
        messageBody.contents.push({
            role: "user",
            parts: [{ text: `${userContext}${subjectContext}${userInput}` }]
        });
        
        // Make request to Gemini API
        const response = await axios.post(apiEndpoint, messageBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Extract and return the response text
        const responseText = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!responseText) {
            return res.status(500).json({ error: 'No response content received from Gemini API' });
        }
        
        res.json({ 
            response: responseText,
            conversationId: Math.random().toString(36).substring(2, 15),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error in /api/tutor/chat:', error);
        
        // Format error response based on error type
        let statusCode = 500;
        let errorMessage = 'Internal server error';
        
        if (error.response) {
            // Error from Gemini API
            statusCode = error.response.status;
            errorMessage = error.response.data?.error?.message || 'Error from Gemini API';
            
            if (statusCode === 400 && errorMessage.includes('API key')) {
                errorMessage = 'API key validation failed: Invalid API key format or revoked key';
            } else if (statusCode === 429) {
                errorMessage = 'Rate limit exceeded: Too many requests or exceeded quota';
            }
        } else if (error.request) {
            // No response received
            statusCode = 503;
            errorMessage = 'No response from Gemini API service';
        }
        
        res.status(statusCode).json({ error: errorMessage });
    }
});

// API endpoint to get subjects and starter questions
app.get('/api/tutor/subjects', (req, res) => {
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
        ]
    };
    
    res.json({ subjects: Object.keys(subjectStarters), subjectStarters });
});

// API endpoint for health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', version: '1.0.0' });
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`AI Tutor API server running on port ${PORT}`);
});

module.exports = app; // For testing 