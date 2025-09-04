import React, { useEffect, useMemo, useState } from "react";
import * as client from "./attendanceClient";
import type { AttendanceRecord } from "./types";

type Props = { employeeId: string };

export const AttendanceHistory: React.FC<Props> = ({ employeeId }) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [start, setStart] = useState<string | undefined>(undefined);
  const [end, setEnd] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLoading(true);
    client.fetchAttendance(employeeId, start, end).then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, [employeeId, start, end]);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const pageData = useMemo(() => records.slice((page - 1) * pageSize, page * pageSize), [records, page]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Attendance History</h3>
        <div className="flex items-center gap-2">
          <input type="date" className="border rounded px-2 py-1" onChange={(e) => setStart(e.target.value || undefined)} />
          <input type="date" className="border rounded px-2 py-1" onChange={(e) => setEnd(e.target.value || undefined)} />
          <button className="px-3 py-1 rounded bg-slate-100" onClick={() => { setPage(1); }}>Apply</button>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-600">
                  <th className="p-2">Date</th>
                  <th className="p-2">Time In</th>
                  <th className="p-2">Time Out</th>
                  <th className="p-2">Total Hours</th>
                  <th className="p-2">Overtime</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">{r.timeIn ? new Date(r.timeIn).toLocaleTimeString() : "—"}</td>
                    <td className="p-2">{r.timeOut ? new Date(r.timeOut).toLocaleTimeString() : "—"}</td>
                    <td className="p-2">{r.hoursWorked ?? "—"}</td>
                    <td className="p-2">{r.overtimeHours ?? "—"}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${r.status === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">Page {page} / {totalPages}</div>
        <div className="space-x-2">
          <button className="px-3 py-1 rounded border" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <button className="px-3 py-1 rounded border" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
