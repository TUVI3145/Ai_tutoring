// Formatting utilities for AI Tutor responses

/**
 * Formats the raw text response from the API with HTML tags for better display
 * 
 * @param {string} text - Raw text from the API
 * @returns {string} - Formatted HTML string
 */
export const formatResponse = (text) => {
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

/**
 * Formats error messages with appropriate styling
 * 
 * @param {string} errorMessage - Error message text
 * @returns {string} - Formatted HTML error message
 */
export const formatError = (errorMessage) => {
    return `<div class="error-message-container">${errorMessage}</div>`;
};

/**
 * Creates a welcome message with user's data
 * 
 * @param {string} username - User's name
 * @param {string} subject - Subject of interest
 * @param {object} subjectStarters - Subject-specific starter questions
 * @returns {string} - Formatted HTML welcome message
 */
export const createWelcomeMessage = (username, subject, subjectStarters) => {
    const greeting = username ? `Hi ${username}! ` : 'Hello! ';
    const subjectGreeting = subject ? 
        `I see you're interested in ${subject}. I'd be happy to help with any ${subject} questions! ` : 
        'I can help with any subject you\'re learning. ';
    
    let welcomeText = `<div class="welcome-message">
        <div class="welcome-greeting">${greeting}</div>
        <div class="welcome-subject">${subjectGreeting}</div>
        <div class="welcome-intro">I'm your AI Tutor, ready to assist with explanations, homework help, and learning resources.</div>
    </div>`;
    
    if (subject && subjectStarters[subject]) {
        welcomeText += `<div class="response-heading">Here are some ${subject} questions to get started:</div>`;
        subjectStarters[subject].forEach(question => {
            welcomeText += `<div class="bullet-point">${question}</div>`;
        });
    } else {
        welcomeText += `<div class="response-heading">Here are some suggestions to get started:</div>`;
        subjectStarters['default'].forEach(question => {
            welcomeText += `<div class="bullet-point">${question}</div>`;
        });
    }
    
    return welcomeText;
}; 