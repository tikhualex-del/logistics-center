# Logistics Center

SaaS platform for end-to-end logistics department management. Designed for small and medium businesses with their own delivery operations (5-50 couriers, 20-500 orders/day).

For detailed project guidelines, architecture, and conventions, see [CLAUDE.md](./CLAUDE.md).

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
```

### 2. Set up the backend

```bash
cd backend

# Copy environment variables
cp .env.example .env
# Edit .env and set your DATABASE_URL and secrets

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server (http://localhost:3000)
npm run start:dev
```

API documentation is available at: `http://localhost:3000/api/docs`

## Documentation

Project documentation is located in the `documentation/` directory:

- `plan.md` -- implementation plan and phases
- `description.md` -- detailed product description
- `PROJECT_IDEA.md` -- original project concept
- `specificity.md` -- domain-specific details
- `instructions.md` -- development instructions

## License

Private. All rights reserved.
