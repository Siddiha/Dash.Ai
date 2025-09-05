# Dash.AI

An AI work assistant that connects to your tools (Gmail, Google Calendar, Notion, Slack, etc.), lets you chat, and automate workflows.

## Features

- Chat interface with AI assistant
- Gmail and Google Calendar integrations (OAuth2)
- Workflow builder and runner
- Auth with NextAuth (Google + credentials)
- Realtime (Socket.IO)
- Monorepo with Turborepo (web + api)

## Tech Stack

- Web: Next.js 14 (App Router), TypeScript, Tailwind CSS, Radix UI, Framer Motion
- API: Express, TypeScript, Zod, Socket.IO
- Data: PostgreSQL, Prisma
- Integrations: Google APIs (gmail.modify, calendar)

## Monorepo Layout

- `apps/web` — Next.js app (frontend)
- `apps/api` — Express API (backend)
- `packages/*` — shared/config packages

## Quickstart

### Prerequisites

- Node.js 18+
- PostgreSQL database

### 1) Install deps (root)

```bash
npm install
```

### 2) Environment variables

Create `.env` files:

`apps/api/.env`

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
JWT_SECRET=replace-with-a-long-random-string
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

`apps/web/.env`

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-string
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3) Prisma

Generate client and push schema (run inside `apps/web` to ensure client is available to web):

```bash
cd apps/web
npx prisma generate --schema prisma/schema.prisma
npx prisma db push
```

### 4) Run dev servers (root)

```bash
cd ../../
npm run dev
```

- Web on `http://localhost:3000`
- API on `http://localhost:3001`

## Google OAuth Setup

- Authorized redirect URI for Google: `http://localhost:3001/api/integrations/oauth/google/callback`
- Scopes used: `userinfo.email`, `userinfo.profile`, `gmail.modify`, `calendar`, `drive.file`

## Integrations (Gmail/Calendar)

- Go to `/chat` and click Connect on Gmail/Calendar.
- Complete Google consent. Tokens are stored in the backend, enabling chat to act on your data.

## Scripts

- Root: `npm run dev` | `npm run build` | `npm run start`
- Web (`apps/web`): `npm run dev` | `npm run build` | `npm run prisma:generate`

## License
MIT

