# UDR_2-_ideaflow

IdeaFlow MVP implementation based on the sprint specification.

Spec / planning note: https://app.notion.com/p/IdeaFlow-36c110f910028164a194e2b3685c731e?source=copy_link&assetsVersion=23.13.20260525.2359

## Folder Structure

```text
ideaflow-mvp/
  shared/
    types.ts                 # Frozen frontend/backend contract
  apps/
    api/
      prisma/schema.prisma   # PostgreSQL schema
      src/                   # Node.js + TypeScript API
    web/
      app/                   # Next.js app router
      components/
      features/              # Screen-level UI surfaces
      hooks/                 # App state and API orchestration
      lib/                   # Mock/API client switch and UI helpers
```

## Development Order

1. Freeze `shared/types.ts` and import it from both apps.
2. Implement Prisma models for auth, ideas, whiteboards, AI evaluations, point rules, point transactions, and idea unlocks.
3. Implement API routes with a single `ApiResponse<T>` envelope.
4. Build the Next.js screens against mock data first.
5. Switch the frontend to the real API by changing `NEXT_PUBLIC_API_MODE=api`.

## MVP Scope

- Login through email-style MVP auth
- Idea feed and idea detail
- Idea creation
- Fixed 7-node whiteboard editing
- AI evaluation
- Point balance, rules, and ledger

Not included yet: follow, advanced profiles, idea graph, SNS expansion, free-drag whiteboard.

## Local Setup

```bash
npm install
copy .env.example .env
docker compose up -d
npm run prisma:generate
npm run prisma:migrate
npm run dev:api
npm run dev:web
```

For Prisma CLI commands run inside `apps/api`, keep `apps/api/.env` aligned with the root `.env`.

The frontend has two modes:

```bash
# Mock-only UI mode
NEXT_PUBLIC_API_MODE=mock

# Real backend mode
NEXT_PUBLIC_API_MODE=api
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

When using the in-app browser at `http://127.0.0.1:3000`, the API CORS config already allows both `localhost:3000` and `127.0.0.1:3000`.

If Docker Desktop is installed but PostgreSQL will not start, launch Docker Desktop with enough privileges first, then run:

```bash
docker compose up -d
npm run prisma:migrate -w @ideaflow/api
npm run prisma:seed -w @ideaflow/api
```
