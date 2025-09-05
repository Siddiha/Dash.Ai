🚀 Dash.AI - AI-Powered Work Assistant Platform
A comprehensive AI work automation platform that integrates with Gmail, Google Calendar, Slack, Notion, and more to streamline workflows and automate repetitive tasks.

✨ Features
AI Chat Assistant: Natural language interface powered by OpenAI GPT-4

Multi-Tool Integration: Connect Gmail, Google Calendar, Slack, Notion, Drive, and more

Workflow Automation: Visual workflow builder with triggers and actions

Real-time Processing: WebSocket support for live updates

OAuth 2.0 Authentication: Secure Google and third-party integrations

Task Queue System: Background job processing with BullMQ and Redis

🛠️ Tech Stack
Frontend
Framework: Next.js 14 (App Router)

Styling: Tailwind CSS, Framer Motion

State Management: Zustand

Authentication: NextAuth.js

UI Components: Custom components with Radix UI

Backend
Runtime: Node.js with Express

Database: PostgreSQL with Prisma ORM

Cache/Queue: Redis with BullMQ

AI/LLM: OpenAI GPT-4 API

Authentication: JWT + OAuth 2.0

📋 Prerequisites
Node.js v18.0.0 or higher

npm v9.0.0 or higher

Docker & Docker Compose

PostgreSQL 15+

Redis 7+

OpenAI API Key

Google Cloud Console account (for OAuth)

🚀 Quick Start
1. Clone the Repository
bash
git clone https://github.com/yourusername/dash-ai.git
cd dash-ai
2. Environment Setup
Backend (.env)
Create apps/api/.env:

env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dashdb"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/integrations/oauth/google/callback

# Optional Services
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=
Frontend (.env.local)
Create apps/web/.env.local:

env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-change-this
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
3. Google OAuth Setup
Go to Google Cloud Console

Create a new project or select existing

Enable APIs:

Google+ API

Gmail API

Google Calendar API

Google Drive API

Create OAuth 2.0 credentials:

Application type: Web application

Authorized JavaScript origins: http://localhost:3000

Authorized redirect URIs:

http://localhost:3000/api/auth/callback/google

http://localhost:3001/api/integrations/oauth/google/callback

Copy Client ID and Secret to both .env files

4. Install Dependencies
bash
# Install backend dependencies
cd apps/api
npm install

# Install frontend dependencies
cd ../web
npm install
5. Database Setup
bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d postgres redis

# Run database migrations
cd apps/api
npx prisma generate
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
6. Start Development Servers
Option 1: Run in separate terminals
Terminal 1 - Backend:

bash
cd apps/api
npm run dev
Terminal 2 - Frontend:

bash
cd apps/web
npm run dev
Option 2: Use Docker Compose
bash
docker-compose up
7. Access the Application
Frontend: http://localhost:3000

Backend API: http://localhost:3001

Prisma Studio: http://localhost:5555 (if running)

📝 API Documentation
Authentication Endpoints
text
POST   /api/auth/signup          # Create new account
POST   /api/auth/login           # Login with credentials
POST   /api/auth/logout          # Logout
POST   /api/auth/refresh         # Refresh JWT token
GET    /api/auth/me              # Get current user
Chat Endpoints
text
POST   /api/chat/message         # Send chat message
GET    /api/chat/conversations   # Get all conversations
GET    /api/chat/conversations/:id       # Get specific conversation
DELETE /api/chat/conversations/:id       # Delete conversation
GET    /api/chat/conversations/:id/messages   # Get messages
Integration Endpoints
text
GET    /api/integrations         # List user integrations
POST   /api/integrations/connect # Connect new integration
DELETE /api/integrations/:type   # Disconnect integration
POST   /api/integrations/refresh/:type    # Refresh tokens
GET    /api/integrations/test/:type       # Test connection
Workflow Endpoints
text
GET    /api/workflows            # List workflows
POST   /api/workflows            # Create workflow
GET    /api/workflows/:id        # Get workflow details
PATCH  /api/workflows/:id        # Update workflow
DELETE /api/workflows/:id        # Delete workflow
POST   /api/workflows/:id/execute        # Run workflow manually
GET    /api/workflows/:id/executions     # Get execution history
🧪 Testing
bash
# Run backend tests
cd apps/api
npm test

# Run frontend tests
cd apps/web
npm test

# E2E tests
npm run test:e2e
🚢 Deployment
Production Build
bash
# Build backend
cd apps/api
npm run build

# Build frontend
cd apps/web
npm run build
Docker Production
bash
# Build and run with Docker
docker-compose -f docker-compose.prod.yml up --build
Deployment Platforms
Frontend (Vercel)
bash
cd apps/web
vercel --prod
Backend (Railway/Render)
Push to GitHub

Connect repository to Railway/Render

Set environment variables

Deploy

🛠️ Development Commands
Backend Commands
bash
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open Prisma Studio
Frontend Commands
bash
npm run dev             # Start dev server
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
npm run type-check     # Run TypeScript check
🐛 Troubleshooting
Common Issues
Port Already in Use
bash
# Kill process on port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
Database Connection Error
bash
# Ensure PostgreSQL is running
docker-compose ps
docker-compose up -d postgres
Module Not Found
bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
Prisma Client Issues
bash
cd apps/api
npx prisma generate
npx prisma migrate reset --force
