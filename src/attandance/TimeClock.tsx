import React, { useMemo } from "react";
import { useState } from "react";
import { useAttendance } from "./useAttendance";

type Props = { employeeId: string; employeeName?: string };

export const TimeClock: React.FC<Props> = ({ employeeId, employeeName }) => {
  const { records, loading, timeIn, timeOut } = useAttendance(employeeId);
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = useMemo(() => records.find((r) => r.date === today), [records, today]);

  const handleTimeIn = async () => {
    setBusy(true);
    await timeIn();
    setBusy(false);
  };

  const handleTimeOut = async () => {
    setBusy(true);
    await timeOut();
    setBusy(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{employeeName ?? "My Attendance"}</h3>
          <p className="text-sm text-slate-500">Today: {today}</p>
        </div>
        <div className="space-x-3">
          <button
            className={`px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-50`}
            onClick={handleTimeIn}
            disabled={busy || !!todayRecord?.timeIn}
          >
            Time In
          </button>
          <button
            className={`px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50`}
            onClick={handleTimeOut}
            disabled={busy || !!todayRecord?.timeOut}
          >
            Time Out
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm text-slate-500">Status</span>
              <div className="mt-1">
                {todayRecord ? (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      todayRecord.status === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {todayRecord.status}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm">Absent</span>
                )}
              </div>
            </div>

            {todayRecord && (
              <div className="text-sm text-slate-600">
                <div>Time In: {todayRecord.timeIn ? new Date(todayRecord.timeIn).toLocaleTimeString() : "—"}</div>
                <div>Time Out: {todayRecord.timeOut ? new Date(todayRecord.timeOut).toLocaleTimeString() : "—"}</div>
                <div>Total Hours: {todayRecord.hoursWorked ?? "—"}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeClock;
