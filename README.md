# MathMagic

An AI-powered math adventure app for kids, with parent oversight and profile management.

## Monorepo Structure

```
mathmagic-final-project/
├── client/          # React + Vite + TypeScript frontend
├── server/          # Express + MongoDB backend
└── shared/
    └── types/       # Shared TypeScript types (@mathmagic/types)
```

## Prerequisites

- Node.js 18+
- MongoDB (local instance or Atlas connection string)
- Google OAuth credentials (Client ID + Secret)
- Google Gemini API key

## Setup

**1. Install dependencies**

```bash
npm install
```

**2. Configure environment variables**

Copy the example files and fill in the required secrets:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`server/.env` — required fields:
| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `MONGODB_URI` | MongoDB connection string (default: local) |

`client/.env` — required fields:
| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (same as server) |

## Development

Start both client and server with a single command:

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000
- Health check: http://localhost:3000/api/health

## Available Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start client + server in watch mode  |
| `npm run build`  | Build both workspaces for production |
| `npm run lint`   | Run ESLint across client and server  |
| `npm run format` | Format all files with Prettier       |
