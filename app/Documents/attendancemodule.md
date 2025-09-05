Build a complete Attendance Module that integrates with our existing Payroll Management System. The module should allow tracking of employee attendance, leave, overtime, and late logins, and feed this data into payroll computation.

Requirements:

Features:

Employee daily time-in/time-out logging (manual entry and biometric/CSV import support).

Track late arrivals, undertime, absences, and overtime.

Support half-day and flexible schedules.

Leave management (sick leave, vacation leave, unpaid leave).

Holiday calendar integration (regular holidays, special non-working days).

Generate attendance summary per cutoff (weekly/semi-monthly/monthly).

Export attendance reports (Excel/CSV/PDF).

Integration with Payroll:

Attendance data should directly affect salary computation.

Deduct absences, undertime, and tardiness.

Add overtime pay based on employee’s overtime rate.

Reflect approved leaves (paid or unpaid).

Database Structure (suggested):

employees (employee_id, full_name, department, position, …)

attendance_records (attendance_id, employee_id, date, time_in, time_out, hours_worked, overtime_hours, late_minutes, undertime_minutes, status)

leaves (leave_id, employee_id, leave_type, start_date, end_date, status, remarks)

holidays (holiday_id, date, description, type)

Frontend (React/Next.js preferred):

Attendance calendar view.

Employee self-service portal to view attendance history.

Admin dashboard for managing and approving leaves, editing attendance logs.

Filtering by employee, department, and date range.

Backend (Express + PostgreSQL preferred):

REST API endpoints for CRUD operations on attendance, leaves, and holidays.

Role-based access (Admin vs Employee).

Automatic daily time calculation (late, overtime, undertime).

Validation & Automation:

Prevent duplicate time-ins for the same day.

Auto-calculate hours worked and overtime.

Auto-tag holidays and weekends.