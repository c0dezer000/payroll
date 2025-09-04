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
    return { amount: employee.allowances.holidayAllowance, type: null };
  }

  // Check if employee's religion is eligible for this holiday
  const isEligibleByReligion = activeHoliday.eligibleReligions.includes(
    employee.religion
  );
  if (!isEligibleByReligion) {
    return { amount: employee.allowances.holidayAllowance, type: null };
  }

  // Calculate holiday allowance based on multiplier
  const holidayAmount = employee.baseSalary * activeHoliday.allowanceMultiplier;
  const totalAmount = employee.allowances.holidayAllowance + holidayAmount;

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

export const calculatePayroll = (
  employee: Employee,
  period: string,
  overtimeHours: number = 0
): PaySlip => {
  // Calculate overtime pay
  const overtimePay = overtimeHours * (employee.overtimeRate || 0);

  // Calculate holiday allowance
  const { amount: holidayAllowanceAmount, type: holidayType } =
    calculateHolidayAllowance(employee, period);

  // Calculate tips (hanya untuk non-manajerial: dive master, supir, diving instructor)
  let tipsAmount = employee.allowances.tips;
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

  // Calculate total allowances
  const allowancesTotal =
    employee.allowances.transport +
    employee.allowances.meal +
    employee.allowances.bonus +
    tipsAmount +
    holidayAllowanceAmount +
    overtimePay;

  // Calculate gross salary (before PPN)
  const grossSalaryBeforePPN = employee.baseSalary + allowancesTotal;

  // Calculate PPN 11%
  const ppnAmount = grossSalaryBeforePPN * 0.11;

  // Calculate total deductions (including PPN)
  const deductionsTotal =
    employee.deductions.tax +
    employee.deductions.insurance +
    employee.deductions.other +
    employee.deductions.cooperativeFund +
    employee.deductions.healthInsurance +
    employee.deductions.loanDeduction +
    ppnAmount;

  // Final calculations
  const grossSalary = grossSalaryBeforePPN;
  const netSalary = grossSalary - deductionsTotal;

  return {
    id: `PS-${employee.id}-${period.replace(/\//g, "")}`,
    employeeId: employee.id,
    employee,
    period,
    baseSalary: employee.baseSalary,
    allowances: {
      transport: employee.allowances.transport,
      meal: employee.allowances.meal,
      bonus: employee.allowances.bonus,
      overtime: overtimePay,
      tips: tipsAmount,
      holidayAllowance: holidayAllowanceAmount,
      total: allowancesTotal,
    },
    deductions: {
      tax: employee.deductions.tax,
      insurance: employee.deductions.insurance,
      other: employee.deductions.other,
      cooperativeFund: employee.deductions.cooperativeFund,
      healthInsurance: employee.deductions.healthInsurance,
      loanDeduction: employee.deductions.loanDeduction,
      ppn: ppnAmount,
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
