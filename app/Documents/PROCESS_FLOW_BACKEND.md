# Payroll Frontend → Backend Process Flow

This document maps the current frontend modules to a practical backend integration plan, a minimal API contract, and an incremental implementation roadmap so you can move from the current frontend-first app to a working full-stack payroll system.

## 1) Summary
- Status: Frontend is feature-rich (employee UI, payroll logic, payslip generator, attendance UI/local client). Data currently stored in `src/data` and localStorage. Auth is client-only.
- Goal: Incrementally add a backend (persistence + secure APIs + payroll runner) while keeping safe local fallbacks for demo/offline use.

## 2) Key existing assets to reuse
- UI components: `src/components/EmployeeList.tsx`, `PayrollProcessing.tsx`, `PaySlipGenerator.tsx`, `Header.tsx`, `Sidebar.tsx`.
- Attendance: `src/attandance/*` (UI, `useAttendance`, `attendanceClient` localStorage adapter).
- Payroll logic: `src/utils/payroll.ts` (calculation functions — should be reused server-side).
- Seed data: `src/data/employees.ts`.
- Local auth stub: `src/contexts/AuthContext.tsx`.

## 3) Minimal API contract (first pass)
Auth
- POST /api/auth/login { email, password } → 200 { user, token }
- GET /api/auth/me → 200 { user }

Employees
- GET /api/employees
- GET /api/employees/:id
- POST /api/employees
- PUT /api/employees/:id
- DELETE /api/employees/:id

Attendance
- GET /api/attendance?employeeId=&start=&end=
- POST /api/attendance {employeeId,date,timeIn?,timeOut?,source?}
- PUT /api/attendance/:id

Payroll runs & payslips
- POST /api/payroll/runs {period, initiatorId} → 201 { id }
- GET /api/payroll/runs/:id
- POST /api/payroll/runs/:id/approve
- GET /api/payslips?runId=
- GET /api/payslips/:id (pdf)

Leaves / Overtime
- POST/GET /api/leaves
- POST/GET /api/overtime

Reporting
- GET /api/reports/payroll?period=

## 4) Minimal DB schema (recommended)
- users (id, email, name, password_hash, role)
- employees (id, name, position, baseSalary, allowances JSON, deductions JSON, overtimeRate, bankAccount, status)
- attendance (id, employee_id, date, time_in, time_out, hours, overtime_hours, late_minutes, status)
- payroll_runs (id, period, status, initiator_id, started_at, completed_at, summary JSON)
- payslips (id, payroll_run_id, employee_id, net_salary, pdf_url, generated_at)
- leaves, overtime_requests, audit_logs

## 5) Incremental roadmap (safe & iterative)
Phase A — Backend skeleton + read-only endpoints
- Add Prisma + SQLite dev schema and seed `employees` from `src/data/employees.ts`.
- Implement GET endpoints (employees, attendance read).
- Update frontend to prefer API but fall back to localStorage.
Estimated: 1–2 days.

Phase B — Auth & writes
- Add NextAuth or JWT sessions; replace client-only auth with server auth.
- Implement POST /api/attendance and employee write endpoints.
- Keep localStorage queue as fallback for offline logs.
Estimated: 1–2 days.

Phase C — Payroll runner & payslips
- Move payroll logic to server and implement `POST /api/payroll/runs` that computes runs and writes immutable payroll_run & payslip records.
- Provide synchronous runs for small datasets and background worker for heavier loads. Add approval endpoint.
Estimated: 2–3 days.

Phase D — Distribution & exports
- Add PDF generation storage (S3) or local storage, email/WhatsApp integration, accounting export, reporting, tests, and CI.
Estimated: 2–4 days.

## 6) Frontend wiring notes (practical)
- `attendanceClient.ts`: prefer API first, fall back to localStorage; implement a sync queue when offline.
- `useAttendance.ts`: call `/api/attendance` and keep return shape stable.
- `PayrollProcessing.tsx`: call `POST /api/payroll/runs` and poll run status; show returned summary.
- `PaySlipGenerator.tsx`: call `/api/payslips/:id` for download.
- `EmployeeList.tsx`: rewrite data source to use API CRUD.

## 7) Edge cases & acceptance criteria
- Idempotent attendance writes by (employeeId, date).
- Server is the source of truth for payroll math; client-only logic used for previews only.
- Local offline fallback must queue writes and sync safely.
- Acceptance for Phase A: UI reads from DB-backed endpoints; fallback still works.

## 8) Tests & quality gates
- Unit tests: payroll math (edge cases: zero salary, negative deductions, overtime rounding).
- Integration tests: employee CRUD, attendance flows, payroll run → payslips.
- CI: lint, typecheck, unit tests on PRs.

## 9) Recommended next step (I can implement)
- Scaffold Phase A now: add Prisma schema (SQLite), seed script importing `src/data/employees.ts`, implement `/app/api/employees/route.ts` GET handler, and update frontend to call API with a fallback.

If you want me to proceed, confirm and I will scaffold Phase A in the repo (Prisma, seed, API route, frontend wiring) and run a quick smoke check.

---

Created by the integration assistant — use this as the living onboarding/implementation plan for backend work.
