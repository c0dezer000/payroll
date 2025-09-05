export interface Employee {
  id: string;
  name: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  email?: string;
  phone?: string;
  address?: string;
  position: string;
  department: string;
  joinDate?: string;
  employmentType?: string;
  baseSalary: number;
  payrollFrequency?: string;
  bankAccount?: string;
  status: "active" | "inactive";
  sssNumber?: string;
  philHealthNumber?: string;
  pagIbigNumber?: string;
  tin?: string;
  taxStatus?: string;
  overtimeRate?: number; // per hour
  religion: "islam" | "kristen" | "katolik" | "hindu" | "budha" | "other";
  isManagement: boolean; // untuk menentukan apakah dapat tips atau tidak
  // Allowances and deductions used throughout the app (seed provides these)
  allowances: {
    transport?: number;
    meal?: number;
    bonus?: number;
    overtime?: number;
    tips?: number;
    holidayAllowance?: number;
  };
  deductions: {
    tax?: number;
    insurance?: number;
    other?: number;
    cooperativeFund?: number;
    healthInsurance?: number;
    loanDeduction?: number;
    ppn?: number;
  };

  // holidaySettings shape varies per seed; accept flexible keys
  holidaySettings?: Record<string, boolean>;
}

export interface PayrollEntry {
  id: string;
  employeeId: string;
  period: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: "pending" | "processed" | "sent";
  processedAt?: string;
  sentAt?: string;
}

export interface PaySlip {
  id: string;
  employeeId: string;
  employee: Employee;
  period: string;
  baseSalary: number;
  allowances: {
    transport: number;
    meal: number;
    bonus: number;
    overtime: number;
    tips: number;
    holidayAllowance: number;
    total: number;
  };
  deductions: {
    tax: number;
    insurance: number;
    other: number;
    cooperativeFund: number;
    healthInsurance: number;
    loanDeduction: number;
    sss: number;
    philHealth: number;
    pagIbig: number;
    total: number;
  };
  grossSalary: number;
  netSalary: number;
  generatedAt: string;
  overtimeHours?: number;
  proratedBase?: number;
  holidayType?:
  | "regular"
  | "special_non_working"
  | "special_working"
  | "national"
  | "local"
  | "anniversary"
  | null;
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalPayroll: number;
  departmentStats: Record<string, number>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    employees: number;
  }>;
  payrollHistory: Array<{
    period: string;
    totalAmount: number;
    employeeCount: number;
    processedAt: string;
  }>;
}

export interface ReportData {
  period: string;
  type: "monthly" | "annual";
  totalPayroll: number;
  totalEmployees: number;
  departmentBreakdown: Array<{
    department: string;
    employeeCount: number;
    totalSalary: number;
    averageSalary: number;
  }>;
  salaryDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  trends: Array<{
    period: string;
    amount: number;
    growth: number;
  }>;
  topEarners: Array<{
    name: string;
    position: string;
    department: string;
    salary: number;
  }>;
  generatedAt: string;
}

export interface HolidayCalendar {
  id: string;
  name: string;
  date: string;
  // Philippine-specific holiday categories. Keep anniversary for company events.
  type:
    | "regular"
    | "special_non_working"
    | "special_working"
    | "national"
    | "local"
    | "anniversary";
  description: string;
  allowanceMultiplier: number; // multiplier for base salary
  isActive: boolean;
  // Optional list of religions or groups eligible for a holiday allowance
  eligibleReligions?: string[];
  // Optional language-specific names (populated when hydrating from public APIs)
  localName?: string;
  englishName?: string;
}
