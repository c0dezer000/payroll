import prisma from "../../../src/server/prisma";
import { NextResponse } from "next/server";

function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function validateEmployeeInput(body: any) {
  const errors: string[] = [];
  if (!body) errors.push('body is required');
  if (!body.name || String(body.name).trim().length === 0) errors.push('name is required');
  if (!body.position || String(body.position).trim().length === 0) errors.push('position is required');
  if (body.email && !isValidEmail(String(body.email))) errors.push('email is invalid');
  if (body.baseSalary != null && isNaN(Number(body.baseSalary))) errors.push('baseSalary must be a number');
  if (body.overtimeRate != null && isNaN(Number(body.overtimeRate))) errors.push('overtimeRate must be a number');
  if (body.joinDate && isNaN(Date.parse(body.joinDate))) errors.push('joinDate is invalid');
  return errors;
}

function mapDbEmployee(emp: any) {
  if (!emp) return null;
  return {
    id: emp.id,
    name: emp.name,
    dateOfBirth: emp.date_of_birth ? emp.date_of_birth.toISOString().split("T")[0] : undefined,
    maritalStatus: emp.marital_status ?? undefined,
    email: emp.email ?? undefined,
    phone: emp.phone ?? undefined,
    address: emp.address ?? undefined,
    position: emp.position ?? undefined,
    department: emp.department ?? "",
    joinDate: emp.join_date ? emp.join_date.toISOString().split("T")[0] : undefined,
    employmentType: emp.employment_type ?? undefined,
    baseSalary: Number(emp.base_salary ?? 0),
    overtimeRate: Number(emp.overtime_rate ?? 0),
    payrollFrequency: emp.payroll_frequency ?? undefined,
    bankAccount: emp.bank_account ?? undefined,
    status: emp.status ?? "active",
    sssNumber: emp.sss_number ?? undefined,
    philHealthNumber: emp.philhealth_number ?? undefined,
    pagIbigNumber: emp.pagibig_number ?? undefined,
    tin: emp.tin ?? undefined,
    taxStatus: emp.tax_status ?? undefined,
    isManagement: emp.is_management ?? false,
    religion: emp.religion ?? undefined,
    holidaySettings: emp.holiday_settings ?? undefined,
    allowances: emp.allowances ?? undefined,
    deductions: emp.deductions ?? undefined,
    createdAt: emp.created_at,
    updatedAt: emp.updated_at,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const pageParam = url.searchParams.get('page');
    const pageSizeParam = url.searchParams.get('pageSize') || url.searchParams.get('limit');
    const q = url.searchParams.get('q') || url.searchParams.get('search');

    if (id) {
      const employee = await prisma.employees.findUnique({ where: { id } });
      if (!employee) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(mapDbEmployee(employee));
    }

    // If pagination/search params provided, return a paginated response
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : null;
    const pageSize = page ? Math.max(1, Math.min(500, parseInt(pageSizeParam || '50', 10) || 50)) : null;

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { position: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (page) {
      const take = pageSize!;
      const skip = (page - 1) * take;
      const [items, total] = await Promise.all([
        prisma.employees.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
        prisma.employees.count({ where }),
      ]);
      return NextResponse.json({ items: items.map(mapDbEmployee), total, page, pageSize: take });
    }

    // Backwards compatible: return plain array when no pagination requested
    const employees = await prisma.employees.findMany({ where, orderBy: { name: "asc" } });
    return NextResponse.json(employees.map(mapDbEmployee));
  } catch (e) {
    console.error("/api/employees GET error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Minimal validation
  const errors = validateEmployeeInput(body);
  if (errors.length) return NextResponse.json({ error: errors.join('; ') }, { status: 400 });

    // Map incoming camelCase fields to Prisma field names
    const data: any = {
      name: body.name,
      date_of_birth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      marital_status: body.maritalStatus ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      address: body.address ?? null,
      position: body.position ?? null,
      department: body.department ?? null,
      join_date: body.joinDate ? new Date(body.joinDate) : null,
      employment_type: body.employmentType ?? null,
      base_salary: body.baseSalary ?? 0,
      overtime_rate: body.overtimeRate ?? 0,
      payroll_frequency: body.payrollFrequency ?? null,
      bank_account: body.bankAccount ?? null,
      status: body.status ?? "active",
      sss_number: body.sssNumber ?? null,
      philhealth_number: body.philHealthNumber ?? null,
      pagibig_number: body.pagIbigNumber ?? null,
      tin: body.tin ?? null,
      tax_status: body.taxStatus ?? null,
      is_management: body.isManagement ?? false,
      religion: body.religion ?? null,
      holiday_settings: body.holidaySettings ?? null,
      allowances: body.allowances ?? null,
      deductions: body.deductions ?? null,
    };

    // Remove undefined keys to avoid accidental DB errors
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    // Create employee directly; we no longer allocate or store a separate employee_code
    const created = await prisma.employees.create({ data });

    // Map DB (snake_case) back to camelCase for frontend
    const mapped = {
      id: created.id,
      name: created.name,
      dateOfBirth: created.date_of_birth ? created.date_of_birth.toISOString().split("T")[0] : undefined,
      maritalStatus: created.marital_status ?? undefined,
      email: created.email ?? undefined,
      phone: created.phone ?? undefined,
      address: created.address ?? undefined,
      position: created.position ?? undefined,
      department: created.department ?? "",
      joinDate: created.join_date ? created.join_date.toISOString().split("T")[0] : undefined,
      employmentType: created.employment_type ?? undefined,
      baseSalary: Number(created.base_salary ?? 0),
      overtimeRate: Number(created.overtime_rate ?? 0),
      payrollFrequency: created.payroll_frequency ?? undefined,
      bankAccount: created.bank_account ?? undefined,
      status: created.status ?? "active",
      sssNumber: created.sss_number ?? undefined,
      philHealthNumber: created.philhealth_number ?? undefined,
      pagIbigNumber: created.pagibig_number ?? undefined,
      tin: created.tin ?? undefined,
      taxStatus: created.tax_status ?? undefined,
      isManagement: created.is_management ?? false,
      religion: created.religion ?? undefined,
      holidaySettings: created.holiday_settings ?? undefined,
      allowances: created.allowances ?? undefined,
      deductions: created.deductions ?? undefined,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (e) {
    console.error("/api/employees POST error", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ error: 'id is required for update' }, { status: 400 });
    }

    const id = body.id;

    const data: any = {
      name: body.name,
      date_of_birth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
      marital_status: body.maritalStatus ?? undefined,
      email: body.email ?? undefined,
      phone: body.phone ?? undefined,
      address: body.address ?? undefined,
      position: body.position ?? undefined,
      department: body.department ?? undefined,
      join_date: body.joinDate ? new Date(body.joinDate) : undefined,
      employment_type: body.employmentType ?? undefined,
      base_salary: body.baseSalary ?? undefined,
      overtime_rate: body.overtimeRate ?? undefined,
      payroll_frequency: body.payrollFrequency ?? undefined,
      bank_account: body.bankAccount ?? undefined,
      status: body.status ?? undefined,
      sss_number: body.sssNumber ?? undefined,
      philhealth_number: body.philHealthNumber ?? undefined,
      pagibig_number: body.pagIbigNumber ?? undefined,
      tin: body.tin ?? undefined,
      tax_status: body.taxStatus ?? undefined,
      is_management: body.isManagement ?? undefined,
      religion: body.religion ?? undefined,
      holiday_settings: body.holidaySettings ?? undefined,
      allowances: body.allowances ?? undefined,
      deductions: body.deductions ?? undefined,
      updated_at: new Date(),
    };

    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

    const updated = await prisma.employees.update({ where: { id }, data });

    return NextResponse.json(mapDbEmployee(updated));
  } catch (e) {
    console.error('/api/employees PUT error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Hard delete: remove the employee row from the database
  const deleted = await prisma.employees.delete({ where: { id } });

  // return deleted id so frontend can remove it from the UI
  return NextResponse.json({ id: deleted.id });
  } catch (e) {
    console.error('/api/employees DELETE error', e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
