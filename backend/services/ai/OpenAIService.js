const OpenAI = require('openai');
const User = require('../../models/User');
const Integration = require('../../models/Integration');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.systemPrompt = `You are an advanced AI assistant that can help users manage their productivity tools and schedule. 

You have access to various integrations including:
- Gmail (read, compose, send emails)
- Google Calendar (create, update, delete events)
- Google Drive (access, organize files)
- Slack (send messages, read channels)
- Notion (create, update pages)
- And more...

Key capabilities:
1. **Smart Scheduling**: Analyze calendars to find optimal meeting times
2. **Email Management**: Draft, send, and organize emails
3. **Task Management**: Create and track tasks across platforms
4. **Document Management**: Help organize and find documents
5. **Communication**: Send messages across different platforms

Response format:
- Always be helpful and proactive
- If a task requires integration access, specify which integration is needed
- For scheduling requests, provide specific time suggestions
- Include actionable steps when possible
- Ask clarifying questions when needed

Intent classification:
- schedule: Calendar/meeting related requests
- email: Email composition, sending, reading
- task: Task creation, management
- document: File management, search
- communication: Messaging across platforms
- general: General conversation or questions`;
  }

  async processMessage(message, userId) {
    try {
      // Get user context and integrations
      const user = await User.findById(userId).populate('integrations');
      const userIntegrations = user.integrations || [];
      
      // Build context about available integrations
      const integrationContext = userIntegrations.map(integration => 
        `${integration.platform}: ${integration.status === 'connected' ? 'Available' : 'Not connected'}`
      ).join('\n');
      
      const contextPrompt = `${this.systemPrompt}

User's connected integrations:
${integrationContext}

User's recent context: ${await this.getUserContext(userId)}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: contextPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0].message.content;
      
      // Analyze intent and extract metadata
      const metadata = await this.analyzeIntent(message, response);
      
      return {
        content: response,
        metadata,
        usage: completion.usage
      };
    } catch (error) {
      console.error('OpenAI processing error:', error);
      return {
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        metadata: { intent: 'error', error: error.message }
      };
    }
  }

  async analyzeIntent(userMessage, aiResponse) {
    try {
      const intentAnalysis = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Analyze the user message and AI response to determine the primary intent and extract relevant metadata.

Return JSON only with this structure:
{
  "intent": "schedule|email|task|document|communication|general",
  "confidence": 0.0-1.0,
  "entities": {
    "datetime": "extracted date/time if any",
    "people": ["list of people mentioned"],
    "platforms": ["platforms to interact with"],
    "action": "specific action to take"
  },
  "requiresIntegration": true/false,
  "integrationNeeded": "platform name if required"
}`
          },
          {
            role: "user",
            content: `User: ${userMessage}\n\nAI Response: ${aiResponse}`
          }
        ],
        temperature: 0.1,
        max_tokens: 300,
      });

      const analysis = JSON.parse(intentAnalysis.choices[0].message.content);
      return analysis;
    } catch (error) {
      console.error('Intent analysis error:', error);
      return {
        intent: 'general',
        confidence: 0.5,
        entities: {},
        requiresIntegration: false
      };
    }
  }

  async getUserContext(userId) {
    try {
      // Get recent messages, calendar events, etc. for context
      const Message = require('../../models/Message');
      const recentMessages = await Message.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('content type createdAt');
      
      const context = recentMessages
        .map(msg => `${msg.type}: ${msg.content.substring(0, 100)}`)
        .join('\n');
      
      return context;
    } catch (error) {
      console.error('Error getting user context:', error);
      return '';
    }
  }

  async generateSmartSuggestions(userId, currentMessage) {
    try {
      const user = await User.findById(userId).populate('integrations');
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate 3 smart suggestions based on the user's message and available integrations. Return as JSON array of strings."
          },
          {
            role: "user",
            content: `Current message: ${currentMessage}\nAvailable integrations: ${user.integrations.map(i => i.platform).join(', ')}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return [];
    }
  }

  async improveMessage(message, context = '') {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Improve the user's message to be more clear, professional, and actionable while maintaining their intent and tone."
          },
          {
            role: "user",
            content: `Original message: ${message}\nContext: ${context}`
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error improving message:', error);
      return message;
    }
  }
}

module.exports = new OpenAIService();
