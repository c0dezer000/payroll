
Prisma seed instructions

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Postgres database.
2. Install dependencies:

- npm i prisma @prisma/client ts-node typescript --save-dev

3. Generate Prisma client and push schema:

- npx prisma generate
- npx prisma db push

4. Run the seed script (TypeScript):

- npx ts-node prisma/seed.ts

Notes:
- The new Prisma schema uses UUID primary keys for created records. The seed script will create employees using generated UUIDs; frontend-specific employee codes (EMP001...) are not preserved.
- The seed script reads `src/data/employees.ts` and upserts employees by `email` when available or by a name+joinDate fallback.
- If you prefer a JS seed (no dynamic eval) convert `src/data/employees.ts` to `.js` and adjust the seed script accordingly.

