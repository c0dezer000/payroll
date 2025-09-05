# Payroll Generation (Philippines) — Spec & Implementation Notes

This document summarizes payroll computation for the Philippines and provides a concrete implementation contract, algorithm steps, data shapes, edge cases, and next steps for implementing payroll generation in this project.

## 1 — High-level flow (contract)

Inputs
- period: `{ start: "YYYY-MM-DD", end: "YYYY-MM-DD" }` or `YYYY-MM`.
- employees: array of employee records (id, baseSalary, payrollFrequency, taxProfile, allowances, deductions, employmentType)
- attendance: [{ employeeId, date, hoursWorked, overtimeHours, timeIn?, timeOut? }]
- config/tables: SSS/PhilHealth/Pag-IBIG contribution tables, BIR withholding tables, employer contribution rates

Outputs (per employee)
- payslip: {
  employeeId, period,
  gross: number,
  components: { base, proRate, taxableAllowances, nonTaxableAllowances, overtime, bonuses },
  statutory: { sss, philhealth, pagibig, totalEmployeeStatutory },
  taxableIncome: number,
  withholdingTax: number,
  otherDeductions: number,
  netPay: number,
  employerContributions: { sss, philhealth, pagibig },
  audit: { inputsHash, computedAt }
}

Success criteria
- gross - totalEmployeeStatutory = taxable base for withholding
- netPay = gross - employee statutory - withholding - other deductions
- all monetary values rounded consistently (e.g., 2 decimals)

## 2 — Key components and formulas

Gross pay
- salaried (period): pro-rated base for the period + taxable allowances + non-taxable allowances (tagged) + overtime + bonuses
- hourly: sum(hoursWorked * hourlyRate) + overtime

Overtime
- overtimePay = overtimeHours * hourlyRate * multiplier (company policy; common 1.25x for regular OT). Use config to store multipliers and rules (rest-day/holiday premiums differ).

Statutory deductions (employee share)
- SSS: lookup table by monthly salary credit -> employee contribution
- PhilHealth: percentage of salary, subject to min/max/cap rules
- Pag-IBIG: fixed percentage or fixed amount per rules

Withholding tax (BIR)
- TaxableIncome = grossTaxable - statutoryEmployeeContributions
- Apply BIR withholding schedule for the payroll frequency (monthly/semimonthly/weekly) for the payroll year
- Withholding tables must be kept up-to-date; treat them as configuration stored in DB/JSON

Other deductions
- loans, advances, union dues, voluntary contributions — subtract after withholding

Net pay
- net = gross - employee statutory - withholding - other deductions

## 3 — Data shapes (Type hints)

PayrollRunInput
- period: { start: string, end: string }
- employees: EmployeeRecord[]
- attendance: AttendanceRecord[]
- config: { sssTable, philhealthTable, pagibigRules, birTable, overtimeMultipliers }

PayrollResult
- payslips: Payslip[] (see Output above)
- summary: { totalGross, totalNet, totalStatutory, totalWithholding }

## 4 — Algorithm (step-by-step)
1. Normalize inputs: convert dates to local timezone, ensure numeric types.
2. For each employee:
   a. Compute pro-rated base for the payroll period (if partial month).
   b. Aggregate attendance for period to derive hoursWorked and overtimeHours.
   c. Compute gross = proRateBase + taxableAllowances + nonTaxableAllowances + overtime + bonuses
   d. Compute employee statutory contributions using lookup tables.
   e. taxableIncome = grossTaxable - totalEmployeeStatutory
   f. withholdingTax = lookupBIR(taxableIncome, payrollFrequency)
   g. otherDeductions = sum(loanRepayments, advances, etc.)
   h. netPay = gross - totalEmployeeStatutory - withholdingTax - otherDeductions
   i. Save payslip with full breakdown and audit info
3. Aggregate totals for the run and persist (payroll_run + payslips)

## 5 — Edge cases & rules
- Join/termination mid-period -> pro-rate base and handle final pay computations
- Retro adjustments (back pay) must be applied to a payroll run and logged separately
- Negative nets: handle via alerts or create payable balances; do not auto-deduct beyond policy
- Multiple currencies (if applicable): store currency and exchange rates
- Rounding: define a rounding strategy (round each component to 2 decimals then sum OR keep high precision and round final values); prefer rounding components and reconciling
- Tax exemptions / special rates for certain employees
- Concurrency: ensure payroll runs are idempotent and lock by period

## 6 — Configuration & tables
- Store SSS, PhilHealth, Pag-IBIG, and BIR tables as DB tables or JSON config with `effective_from` dates.
- Store overtime multipliers and holiday rules as config (so rules are editable without code changes).

## 7 — Tests & validation
- Unit tests per employee type: monthly-salaried, semimonthly, hourly, overtime-only, holiday pay
- Integration test: run payroll for sample data and assert sums
- Property checks: net <= gross, taxableIncome >= 0 (unless retro negative adjustments), statutory >= 0

## 8 — Implementation suggestions (practical)
- Implement a pure, well-tested function `generatePayslip(employee, attendance, period, config) -> Payslip`.
- Build an API endpoint `POST /api/payroll/generate` that returns payslips for a run and `POST /api/payroll/commit` to persist payroll_run and payslips (two-step to preview then commit).
- Keep employer contributions separate for accounting entries.
- Persist the config/tables so they are auditable and versioned.

## 9 — Next steps (pick one)
- Implement the pure payroll generator function with unit tests and sample tables (recommended).
- Scaffold API endpoints for generate/commit and a simple frontend preview for runs.
- Add editable config tables (SSS/BIR) and admin UI.

---

Notes: This is a technical implementation spec — not legal/tax advice. Always consult the latest DOLE/BIR/SSS/PhilHealth/Pag-IBIG rules and tables when implementing.  

