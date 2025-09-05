import { type Employee, type PaySlip, type HolidayCalendar } from "../types";

// Holiday calendar for 2024-2025
export const holidayCalendar: HolidayCalendar[] = [
  {
    id: "idul_fitri_2024",
    name: "Idul Fitri 2024",
    date: "2024-04-10",
    type: "idul_fitri",
    description: "Hari Raya Idul Fitri 1445 H",
    allowanceMultiplier: 1.0, // 1x gaji pokok
    isActive: true,
    eligibleReligions: ["islam"],
  },
  {
    id: "natal_2024",
    name: "Natal 2024",
    date: "2024-12-25",
    type: "natal",
    description: "Hari Raya Natal",
    allowanceMultiplier: 0.5, // 0.5x gaji pokok
    isActive: true,
    eligibleReligions: ["kristen", "katolik"],
  },
  {
    id: "nyepi_2024",
    name: "Nyepi 2024",
    date: "2024-03-11",
    type: "nyepi",
    description: "Hari Raya Nyepi (Tahun Baru Saka)",
    allowanceMultiplier: 0.5, // 0.5x gaji pokok
    isActive: true,
    eligibleReligions: ["hindu"],
  },
  {
    id: "waisak_2024",
    name: "Waisak 2024",
    date: "2024-05-23",
    type: "waisak",
    description: "Hari Raya Waisak",
    allowanceMultiplier: 0.3, // 0.3x gaji pokok
    isActive: true,
    eligibleReligions: ["budha"],
  },
  {
    id: "anniversary_2024",
    name: "Bonus Tahunan September 2024",
    date: "2024-09-15",
    type: "anniversary",
    description: "Bonus Tahunan Enjoy Dive",
    allowanceMultiplier: 0.5, // 0.5x gaji pokok
    isActive: true,
    eligibleReligions: [
      "islam",
      "kristen",
      "katolik",
      "hindu",
      "budha",
      "other",
    ], // semua agama
  },
  {
    id: "idul_fitri_2025",
    name: "Idul Fitri 2025",
    date: "2025-03-30",
    type: "idul_fitri",
    description: "Hari Raya Idul Fitri 1446 H",
    allowanceMultiplier: 1.0, // 1x gaji pokok
    isActive: true,
    eligibleReligions: ["islam"],
  },
  {
    id: "anniversary_2025",
    name: "Bonus Tahunan September 2025",
    date: "2025-09-15",
    type: "anniversary",
    description: "Bonus Tahunan Enjoy Dive",
    allowanceMultiplier: 0.5, // 0.5x gaji pokok
    isActive: true,
    eligibleReligions: [
      "islam",
      "kristen",
      "katolik",
      "hindu",
      "budha",
      "other",
    ], // semua agama
  },
];

export const getActiveHolidayForPeriod = (
  period: string
): HolidayCalendar | null => {
  const [month, year] = period.split("/").map(Number);

  // Check if there's an active holiday in this period
  const activeHoliday = holidayCalendar.find((holiday) => {
    if (!holiday.isActive) return false;

    const holidayDate = new Date(holiday.date);
    return (
      holidayDate.getFullYear() === year && holidayDate.getMonth() === month - 1
    );
  });

  return activeHoliday || null;
};

export const calculateHolidayAllowance = (
  employee: Employee,
  period: string
): { amount: number; type: string | null } => {
  const activeHoliday = getActiveHolidayForPeriod(period);

  if (!activeHoliday) {
    return { amount: (employee.allowances?.holidayAllowance as number) || 0, type: null };
  }

  // Check if employee's religion is eligible for this holiday
  const isEligibleByReligion = activeHoliday.eligibleReligions.includes(
    employee.religion
  );
  if (!isEligibleByReligion) {
    return { amount: (employee.allowances?.holidayAllowance as number) || 0, type: null };
  }

  // Calculate holiday allowance based on multiplier
  const holidayAmount = employee.baseSalary * activeHoliday.allowanceMultiplier;
  const totalAmount = ((employee.allowances?.holidayAllowance as number) || 0) + holidayAmount;

  return { amount: totalAmount, type: activeHoliday.type };
};

export const calculateTipsDistribution = (): number => {
  // Tips dikumpulkan secara kolektif dan dibagikan hanya kepada non-manajerial
  // Simulasi total tips yang dikumpulkan per bulan
  const baseTips = 15000000; // 15 juta per bulan
  const variation = (Math.random() - 0.5) * 0.3; // ±15% variasi
  const totalTips = baseTips * (1 + variation);

  // Hitung jumlah karyawan non-manajerial yang berhak dapat tips
  // (dive master, supir, diving instructor)

  // Simulasi jumlah karyawan yang berhak (akan dihitung dari data aktual di implementasi)
  const eligibleEmployeeCount = 20; // estimasi

  return Math.round(totalTips / eligibleEmployeeCount);
};

export interface AttendancePeriod {
  workDays?: number; // total work days in period
  daysPresent?: number; // attended days
  expectedHours?: number; // expected work hours in period (for hourly prorate)
  hoursWorked?: number; // actual hours worked
  overtimeHours?: number; // overtime hours in period
}

export const calculatePayroll = (
  employee: Employee,
  period: string,
  attendance: AttendancePeriod | null = null
): PaySlip => {
  // Determine overtime hours from attendance fallback to 0
  const overtimeHours = attendance?.overtimeHours ?? 0;

  // Calculate overtime pay: use explicit overtimeRate or derive from base salary
  // derive base hourly from expectedHours if provided, otherwise assume 160 hours/month
  const expectedHours = attendance?.expectedHours ?? 160;
  const baseHourly = expectedHours > 0 ? employee.baseSalary / expectedHours : 0;
  const overtimeRate = employee.overtimeRate || baseHourly * 1.25;
  const overtimePay = Math.max(0, overtimeHours) * overtimeRate;

  // Calculate holiday allowance
  const { amount: holidayAllowanceAmount, type: holidayType } =
    calculateHolidayAllowance(employee, period);

  // Calculate tips (hanya untuk non-manajerial: dive master, supir, diving instructor)
  let tipsAmount = (employee.allowances?.tips as number) || 0;
  if (!employee.isManagement) {
    const eligiblePositions = [
      "dive master",
      "senior dive master",
      "driver",
      "senior driver",
      "diving instructor",
      "senior diving instructor",
    ];
    const isEligibleForTips = eligiblePositions.some((pos) =>
      employee.position.toLowerCase().includes(pos)
    );

    if (isEligibleForTips) {
      tipsAmount += calculateTipsDistribution();
    }
  }

  // Calculate total allowances (overtime included)
  const allowancesTotal =
    ((employee.allowances?.transport as number) || 0) +
    ((employee.allowances?.meal as number) || 0) +
    ((employee.allowances?.bonus as number) || 0) +
    tipsAmount +
    holidayAllowanceAmount +
    overtimePay;

  // Prorate base salary by attendance if attendance provided (days-based)
  let proratedBase = employee.baseSalary;
  if (attendance && typeof attendance.workDays === "number" && typeof attendance.daysPresent === "number") {
    const wd = Math.max(1, attendance.workDays);
    const dp = Math.max(0, Math.min(wd, attendance.daysPresent));
    proratedBase = (employee.baseSalary * dp) / wd;
  }

  // Calculate gross salary (before PPN)
  const grossSalaryBeforePPN = proratedBase + allowancesTotal;

  // No PPN for Philippines
  const ppnAmount = 0;

  // Government mandatory deductions (Philippines, 2025 rates)
  // SSS: 4.5% employee share, up to max salary credit of PHP 30,000
  // PhilHealth: 5% (split employee/employer, assume 2.5% employee), up to PHP 10,000 monthly premium
  // Pag-IBIG: 2% employee share, up to PHP 100 monthly
  let sssDeduction = 0;
  let philHealthDeduction = 0;
  let pagIbigDeduction = 0;
  // Validation helpers: accept either dashed format or digits-only
  const sssRegex = /^(\d{2}-\d{7}-\d{1}|\d{10})$/;
  const philHealthRegex = /^(\d{2}-\d{9}-\d{1}|\d{12})$/;
  const pagIbigRegex = /^(\d{4}-\d{4}-\d{4}|\d{12})$/;

  const isValidSSS = (val?: string) => !!val && sssRegex.test(val.trim());
  const isValidPhilHealth = (val?: string) => !!val && philHealthRegex.test(val.trim());
  const isValidPagIbig = (val?: string) => !!val && pagIbigRegex.test(val.trim());

  // SSS
  if (isValidSSS(employee.sssNumber)) {
    const sssBase = Math.min(grossSalaryBeforePPN, 30000);
    sssDeduction = sssBase * 0.045;
  }
  // PhilHealth
  if (isValidPhilHealth(employee.philHealthNumber)) {
    const philHealthBase = Math.min(grossSalaryBeforePPN, 200000); // 5% of salary, but max monthly premium is 10,000 (5% of 200,000)
    philHealthDeduction = Math.min(philHealthBase * 0.025, 10000);
  }
  // Pag-IBIG
  if (isValidPagIbig(employee.pagIbigNumber)) {
    pagIbigDeduction = Math.min(grossSalaryBeforePPN * 0.02, 100);
  }

  // Calculate total deductions (Philippines: no PPN)
  const deductionsTotal =
    ((employee.deductions?.tax as number) || 0) +
    ((employee.deductions?.insurance as number) || 0) +
    ((employee.deductions?.other as number) || 0) +
    ((employee.deductions?.cooperativeFund as number) || 0) +
    ((employee.deductions?.healthInsurance as number) || 0) +
    ((employee.deductions?.loanDeduction as number) || 0) +
    sssDeduction +
    philHealthDeduction +
    pagIbigDeduction;

  // Final calculations
  const grossSalary = grossSalaryBeforePPN;
  const netSalary = grossSalary - deductionsTotal;

  return {
    id: `PS-${employee.id}-${period.replace(/\//g, "")}`,
    employeeId: employee.id,
    employee,
    period,
  baseSalary: employee.baseSalary,
  proratedBase,
    allowances: {
      transport: ((employee.allowances?.transport as number) || 0),
      meal: ((employee.allowances?.meal as number) || 0),
      bonus: ((employee.allowances?.bonus as number) || 0),
      overtime: overtimePay,
      tips: tipsAmount,
      holidayAllowance: holidayAllowanceAmount,
      total: allowancesTotal,
    },
    deductions: {
      tax: ((employee.deductions?.tax as number) || 0),
      insurance: ((employee.deductions?.insurance as number) || 0),
      other: ((employee.deductions?.other as number) || 0),
      cooperativeFund: ((employee.deductions?.cooperativeFund as number) || 0),
      healthInsurance: ((employee.deductions?.healthInsurance as number) || 0),
      loanDeduction: ((employee.deductions?.loanDeduction as number) || 0),
      sss: sssDeduction,
      philHealth: philHealthDeduction,
      pagIbig: pagIbigDeduction,
      total: deductionsTotal,
    },
    grossSalary,
    netSalary,
    generatedAt: new Date().toISOString(),
  overtimeHours,
    holidayType: holidayType as any,
  };
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fil-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("fil-PH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getFullYear()}`;
};

export const getHolidayName = (type: string): string => {
  const names = {
    idul_fitri: "Tunjangan Idul Fitri",
    natal: "Tunjangan Natal",
    nyepi: "Tunjangan Nyepi",
    waisak: "Tunjangan Waisak",
    anniversary: "Bonus Tahunan",
  };
  return names[type as keyof typeof names] || "Tunjangan Hari Raya";
};
