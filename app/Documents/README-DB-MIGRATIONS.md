Run database migration and backfill for employee_code

This project uses Prisma and PostgreSQL. The repository includes a manual SQL migration and a Node.js backfill script to add a sequential `employee_code` column and initialize the `employee_counters` table.

Files included:
- prisma/migrations/20250905_add_employee_code_and_counters.sql  - manual SQL migration file
- prisma/scripts/backfillEmployeeCodes.js - Node script that uses Prisma to backfill missing employee_code values (if present)

PowerShell steps to apply the SQL migration and run the backfill:

1) Apply the SQL migration directly to your database (replace the connection string or use psql with env):

# Using psql environment variable (Windows PowerShell)
$env:PGPASSWORD = "<your-db-password>";
psql "host=<host> port=<port> dbname=<db> user=<user> sslmode=require" -f "prisma/migrations/20250905_add_employee_code_and_counters.sql"

2) Run the Node backfill script (optional if you've already run the SQL which includes a backfill):

# From the project root (where package.json + prisma folder exists)
node prisma/scripts/backfillEmployeeCodes.js

Notes:
- The SQL migration will add the column, backfill codes for NULL rows, create the counters table, and set the counter to the current max code number.
- If you prefer to use Prisma Migrate, convert the SQL into a proper migration file with Prisma's migration format.
- Make a backup of your database before running migrations.
