export type AttendanceSource = "manual" | "csv" | "biometric" | "api";

export type AttendanceStatus =
  | "present"
  | "absent"
  | "on_leave"
  | "holiday"
  | "pending";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // yyyy-mm-dd
  timeIn?: string | null; // ISO datetime
  timeOut?: string | null; // ISO datetime
  hoursWorked?: number;
  overtimeHours?: number;
  lateMinutes?: number;
  undertimeMinutes?: number;
  status: AttendanceStatus;
  source?: AttendanceSource;
  notes?: string;
  // If true, the employee worked on a public/company holiday for that date
  workedOnHoliday?: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string; // sick, vacation, unpaid
  startDate: string;
  endDate: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
}

export interface AttendanceSummary {
  employeeId: string;
  period: string; // e.g., 9/2025 or 2025-09
  daysPresent: number;
  daysAbsent: number;
  lateCount: number;
  overtimeHours: number;
}
