# Frontend — Agentic FAQ Support Pipeline

A modern React frontend (**Vite + TypeScript + Tailwind CSS v4**) that consumes the
FastAPI backend. It provides a clean chat interface with the human-in-the-loop
ticket fallback, plus an admin ticketing dashboard.

## Prerequisites

- **Node.js 18+** (LTS recommended) — https://nodejs.org
- The backend running on **http://localhost:8000** (from the repo root: `docker compose up --build`)

## Setup

```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173**.

## Configuration

The backend URL defaults to `http://localhost:8000`. To override it, copy
`.env.example` to `.env` and set:

```
VITE_API_URL=http://localhost:8000
```

> The backend's CORS config already allows the Vite dev server (`http://localhost:5173`).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production (`dist/`)
- `npm run preview` — preview the production build
- `npm run typecheck` — run the TypeScript compiler with no emit

## Structure

- `src/api/client.ts` — typed fetch wrapper for the API (`ask`, `createTicket`, `getPendingTickets`, `answerTicket`)
- `src/components/ChatInterface.tsx` — chat UI + "Contact Customer Service" fallback
- `src/components/AdminDashboard.tsx` — password-gated pending-ticket dashboard
- `src/App.tsx` — layout with Chat / Admin Portal views

## Note on admin auth

The admin password gate is **client-side only** (demo). The FastAPI `/tickets`
endpoints are currently unauthenticated — add real authentication to the
backend before exposing the admin portal in production.
