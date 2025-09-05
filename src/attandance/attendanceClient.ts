import type { AttendanceRecord, LeaveRequest, OvertimeRequest } from "./types";
import { getCachedHolidaysForYear } from "../utils/holidays";

const STORAGE_KEY = "attendance.records.v1";

function readStore(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AttendanceRecord[];
  } catch (e) {
    console.error("attendanceClient: read error", e);
    return [];
  }
}

function writeStore(records: AttendanceRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function fetchAttendance(employeeId?: string, start?: string, end?: string): Promise<AttendanceRecord[]> {
  // Try API first
  try {
    const params = new URLSearchParams();
    if (employeeId) params.set("employeeId", employeeId);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const res = await fetch(`/api/attendance?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data as AttendanceRecord[];
    }
  } catch (e) {
    // ignore and fallback to localStorage
    console.debug("attendanceClient: API fetch failed, falling back to localStorage", e);
  }

  const all = readStore();
  let filtered = all;
  if (employeeId) filtered = filtered.filter((r) => r.employeeId === employeeId);
  if (start) filtered = filtered.filter((r) => r.date >= start);
  if (end) filtered = filtered.filter((r) => r.date <= end);
  filtered.sort((a, b) => (a.date < b.date ? 1 : -1));
  return filtered;
}

/**
 * Manually set attendance for a given employee and date. Either time can be null/undefined to leave unchanged.
 * Times must be ISO strings (e.g., new Date().toISOString()).
 */
export async function setAttendanceForDate(
  employeeId: string,
  date: string,
  opts: { timeInISO?: string | null; timeOutISO?: string | null }
): Promise<AttendanceRecord> {
  // Try writing to API first
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, date, timeIn: opts.timeInISO, timeOut: opts.timeOutISO }),
    });
    if (res.ok) {
      const json = await res.json();
      return json as AttendanceRecord;
    }
  } catch (e) {
    console.debug('attendanceClient: API write failed, falling back to localStorage', e);
  }

  // Fallback: write to local storage (offline)
  const records = readStore();
  let rec = records.find((r) => r.employeeId === employeeId && r.date === date);
  if (!rec) {
    const newRec: AttendanceRecord = {
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      date,
      timeIn: null,
      timeOut: null,
      hoursWorked: 0,
      overtimeHours: 0,
      lateMinutes: 0,
      undertimeMinutes: 0,
      status: "absent",
      workedOnHoliday: false,
    };
    records.push(newRec);
    rec = newRec;
  }

  if (typeof opts.timeInISO !== "undefined") rec.timeIn = opts.timeInISO;
  if (typeof opts.timeOutISO !== "undefined") rec.timeOut = opts.timeOutISO;

  // Recompute derived fields (same logic as server)
    if (rec.timeIn && rec.timeOut) {
    const tIn = new Date(rec.timeIn);
    const tOut = new Date(rec.timeOut);
    const hours = Math.max(0, (tOut.getTime() - tIn.getTime()) / 3600_000);
  rec.hoursWorked = Math.round(hours * 100) / 100;
  rec.overtimeHours = rec.hoursWorked > 8 ? Math.round((rec.hoursWorked - 8) * 100) / 100 : 0;
    const scheduledStart = new Date(rec.date + "T09:00:00");
    const late = Math.max(0, Math.round((tIn.getTime() - scheduledStart.getTime()) / 60000));
    rec.lateMinutes = late > 15 ? late : 0;
    rec.status = "present";
      // mark if this date is an active holiday
      try {
        const y = new Date(rec.date).getFullYear();
        const cached = getCachedHolidaysForYear(y) || [];
        rec.workedOnHoliday = cached.some((h) => h.date === rec.date && h.isActive);
      } catch (err) {
        rec.workedOnHoliday = false;
      }
  } else if (rec.timeIn || rec.timeOut) {
      rec.status = rec.timeIn ? "present" : "pending";
      try {
        const y = new Date(rec.date).getFullYear();
        const cached = getCachedHolidaysForYear(y) || [];
        rec.workedOnHoliday = cached.some((h) => h.date === rec.date && h.isActive) && !!rec.timeIn;
      } catch (err) {
        // ignore
      }
  } else {
    rec.status = "absent";
  }

  writeStore(records);
  return rec;
}

export async function logTimeIn(employeeId: string, now = new Date()): Promise<AttendanceRecord> {
  const date = now.toISOString().slice(0, 10);
  // Try API first
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, date, timeIn: now.toISOString() }),
    });
    if (res.ok) return (await res.json()) as AttendanceRecord;
  } catch (e) {
    console.debug('attendanceClient: API logTimeIn failed, falling back to localStorage', e);
  }

  const records = readStore();
  const existing = records.find((r) => r.employeeId === employeeId && r.date === date);
  if (existing) {
    if (existing.timeIn) return existing;
    existing.timeIn = now.toISOString();
    existing.status = "present";
    try {
      const y = new Date(existing.date).getFullYear();
      const cached = getCachedHolidaysForYear(y) || [];
      existing.workedOnHoliday = cached.some((h) => h.date === existing.date && h.isActive);
    } catch (err) {
      existing.workedOnHoliday = false;
    }
    writeStore(records);
    return existing;
  }

  const rec: AttendanceRecord = {
    id: `ATT-${employeeId}-${date}`,
    employeeId,
    date,
    timeIn: now.toISOString(),
    timeOut: null,
    hoursWorked: 0,
    overtimeHours: 0,
    lateMinutes: 0,
    undertimeMinutes: 0,
    status: "present",
    workedOnHoliday: false,
  };
  records.push(rec);
  writeStore(records);
  return rec;
}

export async function logTimeOut(employeeId: string, now = new Date()): Promise<AttendanceRecord | null> {
  const date = now.toISOString().slice(0, 10);
  // Try API first
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, date, timeOut: now.toISOString() }),
    });
    if (res.ok) return (await res.json()) as AttendanceRecord;
  } catch (e) {
    console.debug('attendanceClient: API logTimeOut failed, falling back to localStorage', e);
  }

  const records = readStore();
  const existing = records.find((r) => r.employeeId === employeeId && r.date === date);
  if (!existing) {
    const rec: AttendanceRecord = {
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      date,
      timeIn: null,
      timeOut: now.toISOString(),
      hoursWorked: 0,
      overtimeHours: 0,
      lateMinutes: 0,
      undertimeMinutes: 0,
      status: "pending",
      workedOnHoliday: false,
    };
    records.push(rec);
    writeStore(records);
    return rec;
  }

  if (existing.timeOut) return existing;
  existing.timeOut = now.toISOString();
  if (existing.timeIn) {
    const tIn = new Date(existing.timeIn);
    const tOut = now;
    const hours = Math.max(0, (tOut.getTime() - tIn.getTime()) / 3600_000);
    existing.hoursWorked = Math.round(hours * 100) / 100;
    existing.overtimeHours = existing.hoursWorked > 8 ? Math.round((existing.hoursWorked - 8) * 100) / 100 : 0;
    const scheduledStart = new Date(existing.date + "T09:00:00");
    if (existing.timeIn) {
      const tin = new Date(existing.timeIn);
      const late = Math.max(0, Math.round((tin.getTime() - scheduledStart.getTime()) / 60000));
      existing.lateMinutes = late > 15 ? late : 0;
    }
    existing.status = "present";
    try {
      const y = new Date(existing.date).getFullYear();
      const cached = getCachedHolidaysForYear(y) || [];
      existing.workedOnHoliday = cached.some((h) => h.date === existing.date && h.isActive);
    } catch (err) {
      existing.workedOnHoliday = false;
    }
  } else {
    existing.status = "pending";
  }
  writeStore(records);
  return existing;
}

export async function submitLeave(leave: Omit<LeaveRequest, "id" | "status">): Promise<LeaveRequest> {
  const id = `L-${Date.now()}`;
  const rec: LeaveRequest = { id, status: "pending", ...leave } as LeaveRequest;
  const key = "attendance.leaves.v1";
  try {
    const raw = localStorage.getItem(key);
    const arr: LeaveRequest[] = raw ? JSON.parse(raw) : [];
    arr.push(rec);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
  return rec;
}

export async function fetchLeaves(employeeId?: string): Promise<LeaveRequest[]> {
  const key = "attendance.leaves.v1";
  try {
    const raw = localStorage.getItem(key);
    const arr: LeaveRequest[] = raw ? JSON.parse(raw) : [];
    return employeeId ? arr.filter((l) => l.employeeId === employeeId) : arr;
  } catch (e) {
    return [];
  }
}

export async function submitOvertime(ot: Omit<OvertimeRequest, "id" | "status">): Promise<OvertimeRequest> {
  const id = `OT-${Date.now()}`;
  const rec: OvertimeRequest = { id, status: "pending", ...ot } as OvertimeRequest;
  const key = "attendance.overtime.v1";
  try {
    const raw = localStorage.getItem(key);
    const arr: OvertimeRequest[] = raw ? JSON.parse(raw) : [];
    arr.push(rec);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch (e) {
    console.error(e);
  }
  return rec;
}

export async function fetchOvertime(employeeId?: string): Promise<OvertimeRequest[]> {
  const key = "attendance.overtime.v1";
  try {
    const raw = localStorage.getItem(key);
    const arr: OvertimeRequest[] = raw ? JSON.parse(raw) : [];
    return employeeId ? arr.filter((o) => o.employeeId === employeeId) : arr;
  } catch (e) {
    return [];
  }
}

export default {
  fetchAttendance,
  logTimeIn,
  logTimeOut,
  submitLeave,
  fetchLeaves,
  submitOvertime,
  fetchOvertime,
};
