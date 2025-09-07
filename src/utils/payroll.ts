import { type Employee, type PaySlip, type HolidayCalendar } from "../types";
import { getCachedHolidaysForYear } from "./holidays";

// Holiday calendar for 2024-2025
export const holidayCalendar: HolidayCalendar[] = [
  {
    id: "new_year",
    name: "New Year's Day",
    date: "2024-01-01",
  type: "national",
    description: "New Year's Day",
    allowanceMultiplier: 0.0,
    isActive: true,
    eligibleReligions: ["all"],
  },
  {
    id: "independence_day",
    name: "Independence Day",
    date: "2024-06-12",
  type: "national",
    description: "Philippine Independence Day",
    allowanceMultiplier: 0.0,
    isActive: true,
    eligibleReligions: ["all"],
  },
  {
    id: "christmas_2024",
    name: "Christmas Day",
    date: "2024-12-25",
  type: "national",
    description: "Christmas Day",
    allowanceMultiplier: 0.5,
    isActive: true,
    eligibleReligions: ["christian", "catholic", "all"],
  },
  {
    id: "eid_2024",
    name: "Eid al-Fitr",
    date: "2024-04-10",
  type: "special_non_working",
    description: "Eid al-Fitr",
    allowanceMultiplier: 0.5,
    isActive: true,
    eligibleReligions: ["muslim"],
  },
  {
    id: "anniversary_2024",
    name: "Company Anniversary Bonus",
    date: "2024-09-15",
    type: "anniversary",
    description: "Company Anniversary Bonus",
    allowanceMultiplier: 0.5,
    isActive: true,
    eligibleReligions: ["all"],
  },
];

export const getActiveHolidayForPeriod = (
  period: string,
  holidays?: HolidayCalendar[]
): HolidayCalendar | null => {
  const [month, year] = period.split("/").map(Number);

  // Prefer explicit holidays array. Otherwise check cached/hydrated holidays for the year. Fall back to built-in defaults.
  const cached = getCachedHolidaysForYear(year);
  const pool = holidays && holidays.length > 0 ? holidays : (cached && cached.length > 0 ? cached : holidayCalendar);

  const activeHoliday = pool.find((holiday) => {
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
  period: string,
  holidays?: HolidayCalendar[],
  baseAmount?: number
): { amount: number; type: string | null } => {
  const activeHoliday = getActiveHolidayForPeriod(period, holidays);

  if (!activeHoliday) {
    return { amount: (employee.allowances?.holidayAllowance as number) || 0, type: null };
  }

  // Check if employee's religion (or group) is eligible for this holiday
  const eligibleList = activeHoliday.eligibleReligions || ["all"];
  const isEligibleByReligion =
    eligibleList.includes("all") || eligibleList.includes(employee.religion);

  if (!isEligibleByReligion) {
    return { amount: (employee.allowances?.holidayAllowance as number) || 0, type: null };
  }

  // Determine which base to use for holiday calculation (prorated or full base)
  const baseForCalculation = typeof baseAmount === "number" ? baseAmount : employee.baseSalary;

  // Calculate holiday allowance based on multiplier
  const holidayAmount = baseForCalculation * activeHoliday.allowanceMultiplier;
  const totalAmount = ((employee.allowances?.holidayAllowance as number) || 0) + holidayAmount;

  return { amount: totalAmount, type: activeHoliday.type };
};

export const calculateTipsDistribution = (): number => {
  // Aggregate tips distribution simulation for Philippines context
  const baseTips = 150000; // PHP 150,000 per month (example)
  const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
  const totalTips = baseTips * (1 + variation);

  const eligibleEmployeeCount = 20; // estimate for simulation

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

  // Prorate base salary by attendance if attendance provided (days-based)
  let proratedBase = employee.baseSalary;
  if (attendance && typeof attendance.workDays === "number" && typeof attendance.daysPresent === "number") {
    const wd = Math.max(1, attendance.workDays);
    const dp = Math.max(0, Math.min(wd, attendance.daysPresent));
    proratedBase = (employee.baseSalary * dp) / wd;
  }

  // Calculate holiday allowance using prorated base so holiday multiplier is prorated by attendance
  const { amount: holidayAllowanceAmount, type: holidayType } =
    calculateHolidayAllowance(employee, period, undefined, proratedBase);

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
  try {
    // Use runtime settings when available (saved by Settings page)
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("appSettings");
      if (raw) {
        const parsed = JSON.parse(raw);
        const locale = parsed.language || "fil-PH";
        const currency = parsed.currency || "PHP";
        // minimumFractionDigits can be provided by settings, default to 0 for PHP whole amounts
        const minFrac = typeof parsed.currencyDecimalDigits === "number" ? parsed.currencyDecimalDigits : 0;
        const maxFrac = typeof parsed.currencyDecimalDigits === "number" ? parsed.currencyDecimalDigits : 0;

        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: minFrac,
          maximumFractionDigits: maxFrac,
        }).format(amount);
      }
    }
  } catch (err) {
    // fall through to default
  }

  return new Intl.NumberFormat("fil-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);

    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("appSettings");
      if (raw) {
        const parsed = JSON.parse(raw);
        const locale = parsed.language || "fil-PH";
        const dateFormat = parsed.dateFormat || "long"; // expected values: long, short, numeric

        const monthOption: Intl.DateTimeFormatOptions['month'] = dateFormat === 'short' ? 'short' : (dateFormat === 'numeric' ? 'numeric' : 'long');

        return date.toLocaleDateString(locale, {
          day: 'numeric',
          month: monthOption,
          year: 'numeric',
        });
      }
    }

    return date.toLocaleDateString('fil-PH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch (err) {
    return dateString;
  }
};

export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${now.getMonth() + 1}/${now.getFullYear()}`;
};

export const getHolidayName = (type: string): string => {
  const names: Record<string, string> = {
    regular: "Holiday Allowance",
    national: "National Holiday Allowance",
    special_non_working: "Special Non-Working Holiday Allowance",
    special_working: "Special Working Holiday Allowance",
    local: "Local Holiday Allowance",
    anniversary: "Company Anniversary Bonus",
  };

  return names[type] || "Holiday Allowance";
};
