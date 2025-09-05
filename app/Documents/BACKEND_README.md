# Backend README — quick dev setup

This project already includes a Prisma schema and a seed script. Follow these steps to get the backend API endpoints working locally.

Prereqs
- Node 18+ (or the project's recommended Node)
- PostgreSQL running (the repo's `.env` points at Postgres) or set DATABASE_URL to a SQLite file for quick local dev.

Commands

# Install deps
npm install

# Generate prisma client
npx prisma generate

# Run migrations (dev)
npx prisma migrate dev --name init

# Seed (if prisma seed configured)
npm run prisma:seed

# Start Next dev server
npm run dev

Notes
- The first Phase A implementation only adds read endpoints for employees and attendance.
- Attendance write endpoints are still client-side (localStorage). Phase B will add write endpoints and auth.
- If you prefer SQLite for dev, set DATABASE_URL="file:./dev.db" in a `.env.local`.
