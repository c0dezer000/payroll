"use client";
import React, { useMemo, useState, useEffect } from "react";
import AttendanceDashboardCard from "./AttendanceDashboardCard";
import AttendanceHistory from "./AttendanceHistory";
import * as attendanceClient from "./attendanceClient";

function toISO(date: string, time?: string): string | null {
  if (!time) return null;
  // Ensure HH:MM format; append seconds to avoid timezone ambiguity when parsing
  const hhmm = time.length === 5 ? `${time}:00` : time;
  const d = new Date(`${date}T${hhmm}`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

const AttendancePage: React.FC = () => {
  const [empOptions, setEmpOptions] = useState<{ id: string; name: string }[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setEmployeesLoading(true);
        const res = await fetch('/api/employees');
        if (!res.ok) return;
        const data = await res.json();
        // Support paginated and non-paginated responses
        const list = Array.isArray(data) ? data : (data.items || []);
        const opts = list.map((e: any) => ({ id: e.id, name: e.name }));
        if (!mounted) return;
        setEmpOptions(opts);
        if (!selectedEmployeeId && opts.length) setSelectedEmployeeId(opts[0].id);
      } catch (err) {
        console.error('Failed to load employees for attendance dropdown', err);
      } finally {
        if (mounted) setEmployeesLoading(false);
      }
    })();
    return () => { mounted = false };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [timeIn, setTimeIn] = useState<string>("");
  const [timeOut, setTimeOut] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onSave = async () => {
    if (!selectedEmployeeId || !date) return;
    setSaving(true);
    try {
      const timeInISO = toISO(date, timeIn);
      const timeOutISO = toISO(date, timeOut);
      await attendanceClient.setAttendanceForDate(selectedEmployeeId, date, { timeInISO, timeOutISO });
      setRefreshKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Owner editor: set attendance for an employee */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Set Employee Attendance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Employee</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900"
                >
                  {empOptions.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Time In</label>
                  <input type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Time Out</label>
                  <input type="time" value={timeOut} onChange={(e) => setTimeOut(e.target.value)} className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-slate-900" />
                </div>
              </div>

              <button
                onClick={onSave}
                disabled={saving || !selectedEmployeeId || !date}
                className="w-full px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>

        {/* Summary for selected employee */}
        <div className="lg:col-span-2">
          <AttendanceDashboardCard key={`summary-${refreshKey}-${selectedEmployeeId}`} employeeId={selectedEmployeeId} />
        </div>
      </div>

      {/* History filtered by selected employee */}
      <div>
        <AttendanceHistory key={`history-${refreshKey}-${selectedEmployeeId}`} employeeId={selectedEmployeeId} />
      </div>
    </div>
  );
};

export default AttendancePage;
