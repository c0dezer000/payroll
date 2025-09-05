import prisma from "../../../src/server/prisma";
import { NextResponse } from "next/server";

function mapDbAttendance(a: any) {
  if (!a) return null;
  return {
    id: a.id,
    employeeId: a.employee_id,
    date: a.date ? (a.date instanceof Date ? a.date.toISOString().slice(0, 10) : String(a.date)) : undefined,
    timeIn: a.time_in ? (a.time_in instanceof Date ? a.time_in.toISOString() : String(a.time_in)) : null,
    timeOut: a.time_out ? (a.time_out instanceof Date ? a.time_out.toISOString() : String(a.time_out)) : null,
    hoursWorked: a.hours_worked != null ? Number(a.hours_worked) : 0,
    overtimeHours: a.overtime_hours != null ? Number(a.overtime_hours) : 0,
    lateMinutes: a.late_minutes ?? 0,
    undertimeMinutes: a.undertime_minutes ?? 0,
    status: a.status ?? "absent",
    source: a.source ?? undefined,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get("employeeId");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    const where: any = {};
    if (employeeId) where.employee_id = employeeId;
    if (start || end) where.date = {} as any;
    if (start) where.date.gte = new Date(start);
    if (end) where.date.lte = new Date(end);

    const records = await prisma.attendance.findMany({ where, orderBy: { date: "desc" } });
    return NextResponse.json(records.map(mapDbAttendance));
  } catch (e) {
    console.error("/api/attendance GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// Create or update attendance for employee+date (idempotent). Body: { employeeId, date, timeIn?, timeOut?, source? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.employeeId || !body.date) {
      return NextResponse.json({ error: "employeeId and date are required" }, { status: 400 });
    }

    const employeeId = body.employeeId;
    const date = body.date; // expect YYYY-MM-DD
    const timeIn = body.timeIn ? new Date(body.timeIn) : null;
    const timeOut = body.timeOut ? new Date(body.timeOut) : null;
    const source = body.source ?? null;

    // Find existing record by employee+date
    const existing = await prisma.attendance.findFirst({ where: { employee_id: employeeId, date: new Date(date) } });
    const scheduledStart = new Date(`${date}T09:00:00`);

    function computeDerived(tIn: Date | null, tOut: Date | null) {
      let hoursWorked = 0;
      let overtimeHours = 0;
      let lateMinutes = 0;
      let undertimeMinutes = 0;
      let status = "absent";
      if (tIn && tOut) {
        hoursWorked = Math.max(0, (tOut.getTime() - tIn.getTime()) / 3600_000);
        overtimeHours = hoursWorked > 8 ? hoursWorked - 8 : 0;
        const late = Math.max(0, Math.round((tIn.getTime() - scheduledStart.getTime()) / 60000));
        lateMinutes = late > 15 ? late : 0;
        status = "present";
      } else if (tIn || tOut) {
        status = tIn ? "present" : "pending";
      }
      return { hoursWorked: Math.round(hoursWorked * 100) / 100, overtimeHours: Math.round(overtimeHours * 100) / 100, lateMinutes, undertimeMinutes, status };
    }

    const derived = computeDerived(timeIn, timeOut);

    if (existing) {
      const updated = await prisma.attendance.update({ where: { id: existing.id }, data: {
        time_in: timeIn,
        time_out: timeOut,
        hours_worked: derived.hoursWorked,
        overtime_hours: derived.overtimeHours,
        late_minutes: derived.lateMinutes,
        undertime_minutes: derived.undertimeMinutes,
        status: derived.status,
        source,
        updated_at: new Date(),
      } });
      return NextResponse.json(mapDbAttendance(updated), { status: 200 });
    }

    const created = await prisma.attendance.create({ data: {
      employee_id: employeeId,
      date: new Date(date),
      time_in: timeIn,
      time_out: timeOut,
      hours_worked: derived.hoursWorked,
      overtime_hours: derived.overtimeHours,
      late_minutes: derived.lateMinutes,
      undertime_minutes: derived.undertimeMinutes,
      status: derived.status,
      source,
      created_at: new Date(),
      updated_at: new Date(),
    } });

    return NextResponse.json(mapDbAttendance(created), { status: 201 });
  } catch (e) {
    console.error('/api/attendance POST error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

// Update attendance by id. Body may include timeIn/timeOut/status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    const id = body.id;

    const existing = await prisma.attendance.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

    const timeIn = body.timeIn ? new Date(body.timeIn) : existing.time_in;
    const timeOut = body.timeOut ? new Date(body.timeOut) : existing.time_out;
    const scheduledStart = new Date((existing.date instanceof Date ? existing.date.toISOString().slice(0,10) : String(existing.date)) + 'T09:00:00');

    function computeDerived(tIn: Date | null, tOut: Date | null) {
      let hoursWorked = 0;
      let overtimeHours = 0;
      let lateMinutes = 0;
      let undertimeMinutes = 0;
      let status = existing?.status ?? 'absent';
      if (tIn && tOut) {
        hoursWorked = Math.max(0, (tOut.getTime() - tIn.getTime()) / 3600_000);
        overtimeHours = hoursWorked > 8 ? hoursWorked - 8 : 0;
        const late = Math.max(0, Math.round((tIn.getTime() - scheduledStart.getTime()) / 60000));
        lateMinutes = late > 15 ? late : 0;
        status = 'present';
      } else if (tIn || tOut) {
        status = tIn ? 'present' : 'pending';
      }
      return { hoursWorked: Math.round(hoursWorked * 100) / 100, overtimeHours: Math.round(overtimeHours * 100) / 100, lateMinutes, undertimeMinutes, status };
    }

    const derived = computeDerived(timeIn, timeOut);

    const updated = await prisma.attendance.update({ where: { id }, data: {
      time_in: timeIn,
      time_out: timeOut,
      hours_worked: derived.hoursWorked,
      overtime_hours: derived.overtimeHours,
      late_minutes: derived.lateMinutes,
      undertime_minutes: derived.undertimeMinutes,
      status: body.status ?? derived.status,
      source: body.source ?? existing.source,
      updated_at: new Date(),
    } });

    return NextResponse.json(mapDbAttendance(updated), { status: 200 });
  } catch (e) {
    console.error('/api/attendance PUT error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
