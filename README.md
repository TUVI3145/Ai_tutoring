# AI Tutor API

An intelligent tutoring system powered by Google's Gemini 2.0 Flash model. This application provides interactive learning assistance across various subjects with a conversational interface.

## Deployment on Render

This application is designed to be easily deployed on Render.com. Follow these steps:

1. Fork or clone this repository to your GitHub account
2. Create a new Web Service on Render and connect your GitHub repository
3. Use the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the environment variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `PORT`: This will be set automatically by Render

## API Integration Documentation

### Base URL

```
https://your-render-app-name.onrender.com/api
```

### Endpoints

#### 1. Get AI Tutor Response

```
POST /tutor/chat
```

Request a response from the AI Tutor.

**Request Body**:

```json
{
  "apiKey": "your_gemini_api_key", // Optional, will use server's default if not provided
  "userData": {
    "username": "John", // Optional
    "subject": "Mathematics" // Optional
  },
  "messages": [ // Previous conversation messages (optional)
    {
      "role": "user",
      "content": "Hello, can you help me with math?"
    },
    {
      "role": "assistant",
      "content": "Hi John! I'd be happy to help with mathematics questions."
    }
  ],
  "userInput": "How do I solve a quadratic equation?"
}
```

**Response**:

```json
{
  "response": "To solve a quadratic equation ax² + bx + c = 0, you can use the quadratic formula...",
  "conversationId": "abcd1234efgh5678",
  "timestamp": "2023-06-01T12:34:56.789Z"
}
```

**Error Response**:

```json
{
  "error": "Error message details"
}
```

#### 2. Get Available Subjects

```
GET /tutor/subjects
```

Retrieve a list of supported subjects and starter questions.

**Response**:

```json
{
  "subjects": ["Programming", "Mathematics", "Science", "History", "Language Learning", "Economics", "Philosophy", "Art"],
  "subjectStarters": {
    "Programming": [
      "How do I create a responsive website?",
      "What's the difference between JavaScript and Python?",
      "Can you explain Object-Oriented Programming concepts?"
    ],
    "Mathematics": [
      "How do I solve quadratic equations?",
      "Can you explain calculus derivatives?",
      "What are complex numbers used for?"
    ],
    // Other subjects...
  }
}
```

#### 3. Health Check

```
GET /health
```

Check if the API is running correctly.

**Response**:

```json
{
  "status": "OK",
  "version": "1.0.0"
}
```

## Example Integration (React)

```javascript
import axios from 'axios';

const API_URL = 'https://your-render-app-name.onrender.com/api';

// Function to get a response from the AI Tutor
async function getTutorResponse(question, conversationHistory = [], userData = {}) {
  try {
    const response = await axios.post(`${API_URL}/tutor/chat`, {
      userInput: question,
      messages: conversationHistory,
      userData
    });
    
    return response.data;
  } catch (error) {
    console.error('Error getting tutor response:', error);
    throw error;
  }
}

// Example usage
const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    
    try {
      // Get AI response
      const tutorResponse = await getTutorResponse(input, messages, {
        username: 'John',
        subject: 'Mathematics'
      });
      
      // Add AI response to chat
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: tutorResponse.response 
      }]);
    } catch (error) {
      // Handle error
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error.' 
      }]);
    }
  };
  
  // Component JSX...
};
```

## Local Development

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/ai-tutor.git
   cd ai-tutor
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```
   npm run server
   ```

5. In a separate terminal, start the React frontend:
   ```
   npm run dev
   ```

## License

MIT
