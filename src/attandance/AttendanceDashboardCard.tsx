import React, { useMemo } from "react";
import { useAttendance } from "./useAttendance";
import type { AttendanceSummary } from "./types";

type Props = { employeeId: string };

export const AttendanceDashboardCard: React.FC<Props> = ({ employeeId }) => {
  const { records } = useAttendance(employeeId);
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;

  const summary: AttendanceSummary = useMemo(() => {
    const monthRecs = records.filter((r) => r.date >= periodStart);
    const daysPresent = monthRecs.filter((r) => r.status === "present").length;
    const daysAbsent = monthRecs.filter((r) => r.status === "absent").length;
    const lateCount = monthRecs.filter((r) => (r.lateMinutes || 0) > 0).length;
    const overtimeHours = monthRecs.reduce((s, r) => s + (r.overtimeHours || 0), 0);
    return { employeeId, period: `${month}/${year}`, daysPresent, daysAbsent, lateCount, overtimeHours };
  }, [records, employeeId, periodStart, month, year]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Current Month Summary</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <div className="text-sm text-slate-500">Days Present</div>
          <div className="text-2xl font-bold">{summary.daysPresent}</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <div className="text-sm text-slate-500">Days Absent</div>
          <div className="text-2xl font-bold">{summary.daysAbsent}</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <div className="text-sm text-slate-500">Late Count</div>
          <div className="text-2xl font-bold">{summary.lateCount}</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
          <div className="text-sm text-slate-500">Overtime Hours</div>
          <div className="text-2xl font-bold">{summary.overtimeHours}</div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboardCard;
