# Todo Supro

A monorepo productivity app with:
- `apps/web` — React + Vite + Tailwind frontend
- `apps/server` — Node.js + Express backend

It includes:
- authentication
- dashboard overview
- tasks management
- goals tracking
- 75 Hard habit tracking

## Tech stack

### Frontend
- React
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express
- PostgreSQL

## Monorepo structure

```text
todo-supro/
├── apps/
│   ├── server/
│   │   ├── src/
│   │   └── package.json
│   └── web/
│       ├── src/
│       └── package.json
├── package.json
├── pnpm-workspace.yaml
└── render.yaml
```

## Prerequisites

Install:
- Node.js 18+
- pnpm
- PostgreSQL

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create the required `.env` files for both apps.

#### Backend: `apps/server/.env`

Typical variables:
```env
PORT=5000
DATABASE_URL=postgres://username:password@localhost:5432/todo_supro
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```

#### Frontend: `apps/web/.env`

Typical variable:
```env
VITE_API_URL=http://localhost:5000
```

## Database setup

Use the SQL schema from:

```text
apps/server/src/db/schema.sql
```

Create your database, then run that schema in PostgreSQL.

## Development

Run the frontend and backend in separate terminals.

### Start backend

```bash
cd apps/server
pnpm install
pnpm dev
```

### Start frontend

```bash
cd apps/web
pnpm install
pnpm dev
```

Frontend default:
- http://localhost:5173

Backend default:
- http://localhost:5000

## Available features

- user registration and login
- protected routes
- responsive dashboard
- mobile-friendly tasks page
- mobile-friendly goals page
- mobile-friendly 75 Hard tracker
- responsive mobile navigation

## Deployment

This repository includes:
- `render.yaml`
- `apps/web/vercel.json`

You can deploy:
- backend on Render
- frontend on Vercel

## Notes

- Make sure the backend is running before using the frontend.
- Update environment variables to match your local or deployed URLs.
- The frontend UI has been adjusted to be more responsive and mobile friendly.

## Scripts

Check app-level scripts in:
- `apps/web/package.json`
- `apps/server/package.json`