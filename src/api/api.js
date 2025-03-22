import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Flask backend URL

// Chat with AI Tutor
export const chatWithTutor = async (message) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, { message });
        return response.data.response;
    } catch (error) {
        console.error('Error in chat API:', error);
        return 'Error fetching response.';
    }
};

// Generate Quiz
export const generateQuiz = async (topic) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/quiz`, { topic });
        return response.data.quiz;
    } catch (error) {
        console.error('Error in quiz API:', error);
        return 'Error generating quiz.';
    }
};
