/ src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Chat methods
  async sendMessage(message) {
    return this.request('/chat/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getChatHistory() {
    return this.request('/chat/history');
  }

  // Integration methods
  async getIntegrations() {
    return this.request('/integrations');
  }

  async connectIntegration(type, credentials) {
    return this.request('/integrations/connect', {
      method: 'POST',
      body: JSON.stringify({ type, credentials }),
    });
  }

  async disconnectIntegration(id) {
    return this.request(`/integrations/${id}/disconnect`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();