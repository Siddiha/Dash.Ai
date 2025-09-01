const OpenAI = require('openai');
const User = require('../../models/User');
const Integration = require('../../models/Integration');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.systemPrompt = `You are an advanced AI assistant named "AI Assistant" that helps users manage their productivity and daily tasks.

You can help with:
- 📅 Scheduling meetings and managing calendar
- 📧 Managing emails (Gmail integration)
- 📁 Organizing files and documents
- 💬 Communication across platforms (Slack, Teams)
- 📝 Creating and managing notes (Notion)
- 🎯 Task management and productivity

Always be helpful, friendly, and proactive. When users ask for something that requires an integration (like checking calendar or sending email), let them know which integration needs to be connected.

Respond naturally and conversationally. Keep responses concise but helpful.`;
  }

  async processMessage(message, userId) {
    try {
      // Get user context
      const user = await User.findById(userId).lean();
      const integrations = await Integration.find({ userId, status: 'connected' }).lean();
      
      const connectedServices = integrations.map(i => i.platform).join(', ') || 'none';
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: `${this.systemPrompt}\n\nUser's connected integrations: ${connectedServices}\nUser's name: ${user.name}`
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0].message.content;
      const metadata = await this.analyzeIntent(message, response);
      
      return {
        content: response,
        metadata,
        usage: completion.usage
      };
    } catch (error) {
      console.error('OpenAI processing error:', error);
      return {
        content: "I'm having trouble processing your request right now. Please try again in a moment.",
        metadata: { intent: 'error', error: error.message }
      };
    }
  }

  async analyzeIntent(userMessage, aiResponse) {
    try {
      // Simple intent analysis based on keywords
      const message = userMessage.toLowerCase();
      
      let intent = 'general';
      let requiresIntegration = false;
      let integrationNeeded = null;
      
      if (message.includes('schedule') || message.includes('meeting') || message.includes('calendar')) {
        intent = 'schedule';
        requiresIntegration = true;
        integrationNeeded = 'google';
      } else if (message.includes('email') || message.includes('gmail')) {
        intent = 'email';
        requiresIntegration = true;
        integrationNeeded = 'google';
      } else if (message.includes('document') || message.includes('file') || message.includes('drive')) {
        intent = 'document';
        requiresIntegration = true;
        integrationNeeded = 'google';
      } else if (message.includes('slack') || message.includes('message')) {
        intent = 'communication';
        requiresIntegration = true;
        integrationNeeded = 'slack';
      }
      
      return {
        intent,
        confidence: 0.8,
        requiresIntegration,
        integrationNeeded,
        entities: this.extractEntities(userMessage)
      };
    } catch (error) {
      console.error('Intent analysis error:', error);
      return {
        intent: 'general',
        confidence: 0.5,
        requiresIntegration: false
      };
    }
  }

  extractEntities(message) {
    // Simple entity extraction
    const entities = {};
    
    // Extract dates (very basic)
    const dateRegex = /(tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday)/gi;
    const dates = message.match(dateRegex);
    if (dates) entities.dates = dates;
    
    // Extract times
    const timeRegex = /(\d{1,2}:\d{2}|\d{1,2}\s?(am|pm))/gi;
    const times = message.match(timeRegex);
    if (times) entities.times = times;
    
    // Extract emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = message.match(emailRegex);
    if (emails) entities.emails = emails;
    
    return entities;
  }

  async generateSmartSuggestions(userId, currentMessage) {
    try {
      const suggestions = [
        "Schedule a meeting for next week",
        "Check my calendar for today",
        "Draft an email to my team",
        "Create a new document",
        "Find my recent files"
      ];
      
      // Return contextual suggestions based on message
      if (currentMessage.toLowerCase().includes('meeting')) {
        return [
          "Schedule for tomorrow at 2 PM",
          "Find available time slots",
          "Send calendar invite"
        ];
      }
      
      if (currentMessage.toLowerCase().includes('email')) {
        return [
          "Draft a professional email",
          "Check my inbox",
          "Send follow-up email"
        ];
      }
      
      return suggestions.slice(0, 3);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }
}

module.exports = new OpenAIService();