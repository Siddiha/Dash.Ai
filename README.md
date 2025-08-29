# Dash.AI - Complete Project Structure & Setup Guide

## Project Architecture Overview

- **Frontend**: React.js with TypeScript + Tailwind CSS
- **Backend**: Node.js with Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with OAuth providers
- **AI Integration**: OpenAI API + Langchain
- **Real-time**: Socket.io for live updates
- **Integrations**: OAuth APIs for Gmail, Calendar, Notion, Slack, etc.

## Project Structure

```
dash-ai/
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
├──
├── frontend/                          # React Frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── integrations/
│   │   │   │   ├── IntegrationCard.tsx
│   │   │   │   ├── ConnectModal.tsx
│   │   │   │   └── IntegrationsList.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── TaskList.tsx
│   │   │   │   └── QuickActions.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── ChatInput.tsx
│   │   │   └── workflows/
│   │   │       ├── WorkflowBuilder.tsx
│   │   │       ├── WorkflowCard.tsx
│   │   │       └── AutomationRules.tsx
│   │   ├── pages/
│   │   │   ├── Landing.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Integrations.tsx
│   │   │   ├── Workflows.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useIntegrations.ts
│   │   │   ├── useChat.ts
│   │   │   └── useWorkflows.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── integrations.ts
│   │   │   └── socket.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── integrations.ts
│   │   │   ├── workflow.ts
│   │   │   └── chat.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── validation.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   └── setupTests.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── craco.config.js
│
├── backend/                           # Node.js Backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── integrations.controller.ts
│   │   │   ├── workflow.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── openai.service.ts
│   │   │   │   ├── langchain.service.ts
│   │   │   │   └── prompt.service.ts
│   │   │   ├── integrations/
│   │   │   │   ├── gmail.service.ts
│   │   │   │   ├── calendar.service.ts
│   │   │   │   ├── notion.service.ts
│   │   │   │   ├── slack.service.ts
│   │   │   │   ├── hubspot.service.ts
│   │   │   │   └── base.integration.ts
│   │   │   ├── workflow/
│   │   │   │   ├── workflow.service.ts
│   │   │   │   ├── executor.service.ts
│   │   │   │   └── scheduler.service.ts
│   │   │   ├── auth.service.ts
│   │   │   └── database.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── rateLimiter.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── integrations.routes.ts
│   │   │   ├── workflows.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   └── dashboard.routes.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Integration.ts
│   │   │   ├── Workflow.ts
│   │   │   ├── Task.ts
│   │   │   └── ChatSession.ts
│   │   ├── types/
│   │   │   ├── auth.types.ts
│   │   │   ├── integration.types.ts
│   │   │   ├── workflow.types.ts
│   │   │   └── api.types.ts
│   │   ├── utils/
│   │   │   ├── logger.ts
│   │   │   ├── encryption.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   ├── oauth.ts
│   │   │   └── ai.ts
│   │   ├── sockets/
│   │   │   ├── chat.socket.ts
│   │   │   ├── workflow.socket.ts
│   │   │   └── notifications.socket.ts
│   │   ├── jobs/
│   │   │   ├── workflow.job.ts
│   │   │   ├── email.job.ts
│   │   │   └── cleanup.job.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── nodemon.json
│
├── shared/                            # Shared Types & Utils
│   ├── types/
│   │   ├── common.ts
│   │   ├── api.ts
│   │   └── integrations.ts
│   └── utils/
│       ├── validation.ts
│       └── constants.ts
│
├── docs/                              # Documentation
│   ├── API.md
│   ├── INTEGRATIONS.md
│   ├── WORKFLOWS.md
│   └── DEPLOYMENT.md
│
└── scripts/                           # Build & Deployment Scripts
    ├── build.sh
    ├── deploy.sh
    └── setup.sh
```

## Installation & Setup Guide

### Prerequisites

```bash
# Install Node.js (v18+)
# Install Docker & Docker Compose
# Install PostgreSQL (if not using Docker)
# Get API keys for integrations
```

### 1. Initial Setup

```bash
# Clone and setup
git clone <your-repo>
cd dash-ai

# Copy environment variables
cp .env.example .env

# Install dependencies
npm install

# Setup frontend
cd frontend
npm install
cd ..

# Setup backend
cd backend
npm install
cd ..
```

### 2. Environment Variables (.env)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dashai"
REDIS_URL="redis://localhost:6379"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI Services
OPENAI_API_KEY="sk-your-openai-key"
LANGCHAIN_API_KEY="your-langchain-key"

# Integrations - OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

NOTION_CLIENT_ID="your-notion-client-id"
NOTION_CLIENT_SECRET="your-notion-client-secret"

SLACK_CLIENT_ID="your-slack-client-id"
SLACK_CLIENT_SECRET="your-slack-client-secret"

HUBSPOT_CLIENT_ID="your-hubspot-client-id"
HUBSPOT_CLIENT_SECRET="your-hubspot-client-secret"

# App Configuration
JWT_SECRET="your-jwt-secret"
PORT=5000
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"
```

### 3. Database Setup

```bash
# Start database with Docker
docker-compose up -d postgres redis

# Or install locally
# PostgreSQL and Redis

# Setup Prisma
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Background Jobs (optional)
cd backend
npm run jobs
```

## Required Dependencies

### Frontend (React)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "typescript": "^4.9.0",
    "tailwindcss": "^3.2.0",
    "@headlessui/react": "^1.7.0",
    "react-query": "^3.39.0",
    "axios": "^1.3.0",
    "socket.io-client": "^4.6.0",
    "react-hook-form": "^7.43.0",
    "@heroicons/react": "^2.0.0",
    "framer-motion": "^10.0.0",
    "react-hot-toast": "^2.4.0"
  }
}
```

### Backend (Node.js)

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "typescript": "^4.9.0",
    "@types/node": "^18.14.0",
    "prisma": "^4.11.0",
    "@prisma/client": "^4.11.0",
    "bcryptjs": "^2.4.0",
    "jsonwebtoken": "^9.0.0",
    "cors": "^2.8.0",
    "helmet": "^6.0.0",
    "express-rate-limit": "^6.7.0",
    "socket.io": "^4.6.0",
    "redis": "^4.6.0",
    "openai": "^3.2.0",
    "langchain": "^0.1.0",
    "googleapis": "^118.0.0",
    "@notionhq/client": "^2.2.0",
    "@slack/web-api": "^6.8.0",
    "node-cron": "^3.0.0",
    "bull": "^4.10.0",
    "winston": "^3.8.0",
    "joi": "^17.8.0"
  }
}
```

## Key Features to Implement

### 1. Core AI Assistant

- Natural language processing for task management
- Context-aware responses based on connected integrations
- Smart suggestions and automation recommendations

### 2. Multi-Platform Integrations

- **Gmail**: Read, send, organize emails
- **Google Calendar**: Schedule, update, manage events
- **Notion**: Create, update pages and databases
- **Slack**: Send messages, manage channels
- **HubSpot**: Manage contacts, deals, tasks
- **Linear**: Create, update project tasks
- **Phone**: Make calls, send SMS (Twilio)

### 3. Workflow Automation

- Visual workflow builder
- Trigger-based automations
- Scheduled tasks and reminders
- Cross-platform data synchronization

### 4. Smart Dashboard

- Unified view of all connected platforms
- AI-powered insights and analytics
- Task prioritization and scheduling
- Real-time notifications

## Next Steps

1. **Setup the basic project structure** using the above layout
2. **Configure environment variables** with your API keys
3. **Start with authentication system** and basic dashboard
4. **Implement one integration at a time** (start with Gmail/Calendar)
5. **Add AI chat interface** with OpenAI integration
6. **Build workflow automation engine**
7. **Create the landing page** and professional UI
