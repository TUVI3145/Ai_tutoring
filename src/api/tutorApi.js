// AI Tutor API client for external integration
// This module encapsulates all API calls to the Gemini service

/**
 * Makes a request to the Gemini API
 * 
 * @param {string} apiKey - Gemini API key
 * @param {object} userData - User data including username and subject
 * @param {array} messages - Previous conversation messages
 * @param {string} userInput - The current user input
 * @returns {Promise} - Promise that resolves to the API response
 */
export const fetchTutorResponse = async (apiKey, userData, messages, userInput) => {
    if (!apiKey) {
        throw new Error('API key is required');
    }

    const { username, subject } = userData || { username: '', subject: '' };
    const userContext = username ? `My name is ${username}. ` : '';
    const subjectContext = subject ? `I'm studying ${subject}. ` : '';
    
    // Set up API request for Gemini
    const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    // Create request body
    const messageBody = {
        contents: [
            {
                role: "user",
                parts: [
                    {
                        text: `You are a helpful and knowledgeable tutor. ${username ? `My name is ${username}.` : ''} ${subject ? `I'm interested in learning about ${subject}.` : ''} ${userContext}${subjectContext}${userInput}`
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
        }
    };
    
    // Add conversation history if available
    if (messages.length > 0) {
        messageBody.contents = [];
        
        // Add system message as user message (Gemini doesn't have system role)
        messageBody.contents.push({
            role: "user",
            parts: [
                {
                    text: `You are a helpful and knowledgeable tutor. ${username ? `The user's name is ${username}.` : ''} ${subject ? `They are interested in learning about ${subject}.` : ''} Provide detailed, educational responses that are helpful for learning.`
                }
            ]
        });
        
        // Add conversation history
        messages.filter(msg => msg.role === 'user' || msg.role === 'assistant').forEach(msg => {
            messageBody.contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        });
        
        // Add current user message
        messageBody.contents.push({
            role: "user",
            parts: [{ text: `${userContext}${subjectContext}${userInput}` }]
        });
    }
    
    // Make API request
    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageBody)
    });
    
    // Handle error responses
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", errorData);
        
        if (response.status === 400 && errorData.error?.message?.includes('API key')) {
            throw new Error('API key validation failed: Invalid API key format or revoked key.');
        } else if (response.status === 429) {
            throw new Error('Rate limit exceeded: Too many requests or exceeded quota.');
        } else {
            throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
        }
    }
    
    // Parse response
    const data = await response.json();
    
    // Extract the response text
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
        throw new Error('No response content received from Gemini API');
    }
    
    return responseText;
}; 