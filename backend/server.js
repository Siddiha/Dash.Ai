const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const integrationRoutes = require('./routes/integrations');
const { authenticateSocket } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-assistant')
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/integrations', integrationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO - Real-time chat
io.use(authenticateSocket);

io.on('connection', (socket) => {
  const userName = socket.user.name;
  console.log(`✅ ${userName} connected`);
  
  // Send personalized welcome message
  setTimeout(() => {
    const greeting = getGreeting();
    socket.emit('ai_response', {
      message: `${greeting}, ${userName}! 👋\n\nI'm your AI assistant and I'm here to help you with:\n\n📅 **Schedule meetings** - "Schedule a meeting with John tomorrow at 2 PM"\n📧 **Manage emails** - "Draft an email to my team about the project"\n📁 **Organize files** - "Find my recent presentations"\n🔗 **Connect your tools** - Link Gmail, Calendar, Slack, and more\n\nWhat would you like to do today?`,
      timestamp: new Date(),
      metadata: { intent: 'greeting' }
    });
  }, 1000);
  
  socket.on('chat_message', async (data) => {
    try {
      const { message } = data;
      console.log(`💬 ${userName}: ${message}`);
      
      // Show typing indicator
      socket.emit('ai_typing', true);
      
      // Store user message
      const Message = require('./models/Message');
      const userMessage = new Message({
        userId: socket.userId,
        content: message,
        type: 'user'
      });
      await userMessage.save();
      
      // Process with AI
      const aiService = require('./services/ai/openaiService');
      const aiResponse = await aiService.processMessage(message, socket.userId);
      
      // Store AI response
      const aiMessage = new Message({
        userId: socket.userId,
        content: aiResponse.content,
        type: 'assistant',
        metadata: aiResponse.metadata
      });
      await aiMessage.save();
      
      // Hide typing indicator and send response
      socket.emit('ai_typing', false);
      socket.emit('ai_response', {
        message: aiResponse.content,
        metadata: aiResponse.metadata,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Chat error:', error);
      socket.emit('ai_typing', false);
      socket.emit('ai_response', {
        message: 'Sorry, I encountered an issue processing your request. Please try again! 😊',
        timestamp: new Date(),
        metadata: { intent: 'error' }
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ ${userName} disconnected`);
  });
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, io };