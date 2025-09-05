# Backend Implementation Checklist & Payroll Computation Plan

This document is an actionable checklist and roadmap to add a backend to the existing payroll frontend. It maps modules, API contracts, data shapes, compute logic, edge cases, tests, and an incremental phase plan so you can implement backend features safely and iteratively.

---

## User requirements (extracted)
- [x] Produce a checklist and roadmap for adding a backend (saved to Documents as a .md file).
- [x] Recommend which module to implement first and the full ordered set until all modules are done.
- [x] Describe how salary computation should be processed on the backend (attendance, deductions, leaves, overtime, holidays, tax, allowances, tips).

Assumptions
- Repo uses Next.js + TypeScript and already contains `src/utils/payroll.ts` (client-side payroll logic) and a Prisma schema at `prisma/schema.prisma` — we'll reuse and move calculation logic to server-side.
- Development DB: Postgres is configured in `.env`; recommend using SQLite for fast local dev migrations if desired (or keep Postgres if you already run it locally).
- Authentication is not implemented server-side yet — Phase B covers adding auth.

---

## High-level phases (ordered)
Phase 0 — Repo audit & prep (this is done)
- [x] Confirm presence of payroll utils (`src/utils/payroll.ts`) and Prisma schema (`prisma/schema.prisma`).
- [x] Confirm seed script exists (`prisma/seed.ts`).

Phase A — Backend skeleton + read-only endpoints (1–2 days)
- [ ] Add Prisma dev setup (If you prefer SQLite for dev, add `schema_dev.prisma` or set DATABASE_URL to sqlite for local dev).
- [ ] Ensure `prisma generate` and `prisma migrate dev` work locally.
- [ ] Create read-only GET endpoints:
  - GET /api/employees
  - GET /api/employees/:id
  - GET /api/attendance?employeeId=&start=&end=
  - GET /api/payslips?runId=
- [ ] Update frontend data adapters to prefer API and fallback to localStorage (implement `apiFirst` switch in `attendanceClient.ts`).
- [ ] Add small integration smoke test that starts Next.js dev server and verifies GET /api/employees returns seeded employees.

Phase B — Auth & write endpoints (1–2 days)
- [ ] Add authentication (NextAuth with credentials or JWT); create `/api/auth/*` endpoints.
- [ ] Implement write endpoints:
  - POST /api/employees
  - PUT /api/employees/:id
  - POST /api/attendance
  - PUT /api/attendance/:id
  - POST /api/leaves
  - POST /api/overtime
- [ ] Add server-side validation and idempotency for attendance (unique on employee+date).
- [ ] Implement offline write queue sync on frontend (local queue that retries when online).

Phase C — Payroll runner & payslips (2–4 days)
- [ ] Move payroll calculation logic to server (import the functions from `src/utils/payroll.ts` after extracting them into a shared package path, e.g. `lib/payroll` or `src/server/payroll.ts`).
- [ ] Implement POST /api/payroll/runs { period, initiatorId } that:
  - Validates request and auth/permission.
  - Aggregates attendance, leaves, overtime, holidays for the period per employee.
  - Runs canonical server payroll computation producing immutable `payroll_runs` and `payslips` rows.
  - Returns { id, summary } and optionally kicks off background worker for heavy workloads.
- [ ] Add POST /api/payroll/runs/:id/approve to mark run as approved and trigger payslip exports (PDF/email).
- [ ] Add GET /api/payroll/runs/:id to retrieve run status & summary.

Phase D — Distribution, reporting, backups (2–4 days)
- [ ] Add payslip PDF generation and storage (local or S3). Persist `pdf_url` to `payslips`.
- [ ] Implement reporting endpoints & CSV/GL export.
- [ ] Add audit logs and immutable actions for payroll approvals.
- [ ] Hardening: RBAC, input validation, rate limiting, monitoring.

---

## Concrete API contract (first pass)
Auth
- POST /api/auth/login { email, password } → 200 { user, token }
- GET /api/auth/me → 200 { user }

Employees
- GET /api/employees → 200 [{ employees }]
- GET /api/employees/:id → 200 { employee }
- POST /api/employees { ... } → 201 { id }
- PUT /api/employees/:id → 200
- DELETE /api/employees/:id → 204

Attendance
- GET /api/attendance?employeeId=&start=&end= → 200 [{ attendance }]
- POST /api/attendance { employeeId, date, timeIn?, timeOut?, source? } → 201 { id }
- PUT /api/attendance/:id → 200

Payroll runs & payslips
- POST /api/payroll/runs { period, initiatorId } → 201 { id }
- GET /api/payroll/runs/:id → 200 { run }
- POST /api/payroll/runs/:id/approve → 200
- GET /api/payslips?runId= → 200 [{ payslips }]
- GET /api/payslips/:id → 200 { payslip } (for pdf download return presigned URL or redirect)

Leaves / Overtime
- POST /api/leaves
- GET /api/leaves?employeeId=
- POST /api/overtime
- GET /api/overtime?employeeId=

Reporting
- GET /api/reports/payroll?period=

---

## Payroll computation contract (server-side canonical)
Contract (function signature)
- Input: { employee: EmployeeRecord, period: "YYYY-MM" | {start:Date,end:Date}, attendance: Attendance[], leaves: Leave[], overtimeRequests: Overtime[], holidays: Holiday[], config: PayrollConfig }
- Output: { employeeId, period, baseSalary, grossSalary, totalAllowances, totalDeductions, overtimePay, holidayPay, statutoryContributions, tax, netSalary, breakdown: { items... } }

Computation steps (order matters)
1. Normalize inputs: convert attendance timestamps to local timezone and aggregate per date.
2. Aggregate hours worked and overtime hours from attendance (use stored hours_worked & overtime_hours if present, otherwise compute from time_in/time_out).
3. Adjust for approved leaves (paid/unpaid) — deduct salary proportionally for unpaid leave days; for paid leave use leave type settings.
4. Add overtime pay = overtime_hours * employee.overtime_rate (respect overtime multipliers from `overtime_requests` or holiday rules).
5. Compute holiday pay: if worked on holiday, apply holiday allowance multiplier from `holidays` or employee.holiday_settings.
6. Apply allowances (employee.allowances JSON) — can be fixed amounts or percentage of base.
7. Apply deductions (employee.deductions JSON) — pre-tax or post-tax flags must be respected.
8. Compute statutory contributions (SSS, PhilHealth, PagIBIG) using configured rules; persist contribution amounts per employee.
9. Compute taxable income = gross - preTaxDeductions - statutoryContributions.
10. Compute tax using configured tax brackets/rules and tax_status; subtract tax.
11. Apply post-tax deductions and compute netSalary.
12. Round amounts consistently (decimals as in DB: two decimal places). Include breakdown for auditing.

Edge cases to handle
- Missing attendance for an employee for the period — treat hours as 0 or use scheduled hours if available.
- Negative deductions or allowances — validate server-side and reject or normalize.
- Very large overtime — cap or flag for manual review.
- Part-time / hourly employees — support baseSalary vs hourly pay; payrollFrequency must be respected.
- Multiple overrides (manual adjustments) — store adjustments as separate `payslip_adjustments` entries with audit info.

Idempotency and immutability
- Payroll run creation should be idempotent per period (prevent duplicate runs): check for existing payroll_runs for the same period and status.
- payslips and payroll_runs should be immutable once `status` is `completed` or `approved`. Store `generated_at` and `created_at`.

Data shapes (examples)
Employee (DB row simplified)
{
  id: string,
  name: string,
  base_salary: Decimal,
  overtime_rate: Decimal,
  payroll_frequency: 'monthly' | 'semi-monthly' | 'weekly',
  allowances: JSON, // e.g. [{ type: 'fixed', name: 'transport', amount: 100 }]
  deductions: JSON, // e.g. [{ type: 'fixed', name: 'loan', amount: 50 }]
}

Payslip (returned by compute)
{
  employeeId: string,
  period: '2025-08',
  baseSalary: 20000.00,
  overtimePay: 250.00,
  holidayPay: 0.00,
  totalAllowances: 200.00,
  totalDeductions: 150.00,
  statutory: { sss: 200, philhealth: 100, pagibig: 50 },
  tax: 123.45,
  grossSalary: 20450.00,
  netSalary: 18276.55,
  breakdown: [ { label: 'Base salary', amount: 20000 }, ... ]
}

---

## DB / Prisma notes (found in repo)
- `prisma/schema.prisma` already contains models: `employees`, `attendance`, `payslips`, `payroll_runs`, `leaves`, `overtime_requests`, `holidays`, `audit_logs`, `users`.
- `prisma/seed.ts` exists — reuse it for seeding employees in dev.
- `.env` shows a Postgres DATABASE_URL; for local dev you can keep it or switch to sqlite via a separate env.

Suggested migrations
- Add `payslip_adjustments` table if you want manual adjustments with audit.
- Add indexes on `attendance(employee_id, date)` and `payslips(payroll_run_id)` (prisma already includes relevant indexes).

---

## Tests & quality gates
- Unit tests (Jest / vitest)
  - `lib/payroll` unit tests: base salary, overtime, holiday multiplier, unpaid leave, negative deductions, zero salary.
  - API unit tests for `POST /api/payroll/runs` (mock DB): verify output shape & immutability.
- Integration tests
  - Seed a small DB, run payroll run, verify payslips are created, PDF URLs generated, and summary numbers match local `calculatePayroll` implementation.
- CI pipeline
  - Lint, typecheck, unit tests, run prisma migrate dev (or generate schema), run integration smoke test.

---

## Operational & deployment notes
- For small teams, synchronous runs are fine; for larger datasets use background workers (BullMQ, Redis) and a status endpoint to poll.
- For PDF storage: local file system OK for prototypes; prefer S3 + presigned URLs for production.
- Backup the DB regularly and store payslip PDFs on separate storage.

---

## Deliverable checklist (concrete files & tasks to create in Phase A)
- [ ] Add server payroll library: `src/server/payroll.ts` (move/port functions from `src/utils/payroll.ts`).
- [ ] API route: `app/api/employees/route.ts` (GET handlers)
- [ ] API route: `app/api/attendance/route.ts` (GET handlers)
- [ ] Update `src/attandance/attendanceClient.ts` to prefer `/api/attendance`.
- [ ] Add README in `app/Documents` listing the exact commands to run migrations and seeds.
- [ ] Add a small smoke test: `tests/integration/smoke.test.ts` to verify basic API responses.

---

## Next recommended step (I can implement)
If you confirm, I will scaffold Phase A in this repo:
- Wire `app/api/employees/route.ts` (GET), `app/api/attendance/route.ts` (GET), update `attendanceClient.ts` to prefer API, and add a short README + smoke test. After scaffolding I will run a quick smoke check locally (prisma generate/migrate + seed + test). 

---

Requirements coverage
- "Provide checklist and save to Documents": Done (this file).
- "Module order & roadmap": Done (Phases and tasks).
- "Salary computation process based on attendance/deductions/leaves": Done (contract + steps + edge cases).

