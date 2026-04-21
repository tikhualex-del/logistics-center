# Logistics Center

SaaS platform for end-to-end logistics department management. Designed for small and medium businesses with their own delivery operations (5-50 couriers, 20-500 orders/day).

For detailed project guidelines, architecture, and conventions, see [docs/CLAUDE.md](./docs/CLAUDE.md).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, Redis, Socket.io |
| Frontend | React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Yandex Maps |
| Mobile | Expo, React Native (Phase 2) |
| Infrastructure | Railway, Vercel, GitHub Actions |

## Local Development

### Prerequisites

- Node.js 22+
- Docker + Docker Compose
- npm 10+

### 1. Start the database and Redis

```bash
# Copy and configure environment variables
cp .env.example .env

# Start PostgreSQL 16 and Redis
docker-compose up -d

2. Set up the backend

cd backend

# Backend and Prisma read the root ../.env first.
# backend/.env is optional and used only as a local fallback.

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server (http://localhost:3000)
npm run start:dev

API documentation is available at: http://localhost:3000/api/docs

Documentation

Project documentation is located in the docs/ directory:

CLAUDE.md -- project rules and conventions
FOUNDATION.md -- system overview
COMPANIES_DOMAIN.md -- companies domain notes
License

Private. All rights reserved.