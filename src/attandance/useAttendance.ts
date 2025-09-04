import { useEffect, useState } from "react";
import type { AttendanceRecord } from "./types";
import * as client from "./attendanceClient";

export function useAttendance(employeeId: string) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload(start?: string, end?: string) {
    setLoading(true);
    const data = await client.fetchAttendance(employeeId, start, end);
    setRecords(data);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const timeIn = async (now = new Date()) => {
    const rec = await client.logTimeIn(employeeId, now);
    await reload();
    return rec;
  };

  const timeOut = async (now = new Date()) => {
    const rec = await client.logTimeOut(employeeId, now);
    await reload();
    return rec;
  };

  return { records, loading, reload, timeIn, timeOut } as const;
}

export default useAttendance;
