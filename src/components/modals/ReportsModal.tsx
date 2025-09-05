import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";
// ...existing imports
import { type DashboardStats, type ReportData } from "../../types";
import { formatCurrency, formatDate } from "../../utils/payroll";
import { generateReportPDF } from "../../utils/reportGenerator";
import type { Employee } from "../../types";

  

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dashboardStats: DashboardStats;
}

const ReportsModal: React.FC<ReportsModalProps> = ({
  isOpen,
  onClose,
  dashboardStats,
}) => {
  const [reportType, setReportType] = useState<"monthly" | "annual">("monthly");
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return reportType === "monthly"
      ? `${now.getMonth() + 1}/${now.getFullYear()}`
      : now.getFullYear().toString();
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) {
        // try to parse server error message
        let msg = res.statusText || `Status ${res.status}`;
        try {
          const body = await res.json();
          if (body && body.error) msg = String(body.error);
        } catch (_) {
          // ignore JSON parse errors
        }
        setFetchError(`Failed to fetch employees: ${msg}`);
        if (mountedRef.current) setEmployees([]);
        return;
      }

      const data: Employee[] = await res.json();
      setFetchError(null);
      if (mountedRef.current) setEmployees(data || []);
    } catch (err) {
      console.error("fetchEmployees error:", err);
      setFetchError("Network error while fetching employees");
      if (mountedRef.current) setEmployees([]);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchEmployees();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchEmployees]);

  const generateReportData = (): any => {
    const period = selectedPeriod;
    // Calculate department breakdown
  const departmentBreakdown = Object.entries(dashboardStats.departmentStats)
      .map(([department, employeeCount]) => {
    const deptEmployees = employees.filter((emp) => emp.department === department);
        const totalSalary = deptEmployees.reduce((sum, emp) => {
          const allowances =
            (emp.allowances?.transport || 0) +
            (emp.allowances?.meal || 0) +
            (emp.allowances?.bonus || 0);
          const deductions =
            (emp.deductions?.tax || 0) +
            (emp.deductions?.insurance || 0) +
            (emp.deductions?.other || 0);
          return sum + (emp.baseSalary + allowances - deductions);
        }, 0);

        return {
          department,
          employeeCount,
          totalSalary,
          averageSalary: totalSalary / employeeCount,
        };
      })
      .sort((a, b) => b.totalSalary - a.totalSalary);

    // Calculate salary distribution
    const salaryRanges = [
      { range: "< 5M", min: 0, max: 5000000 },
      { range: "5M - 10M", min: 5000000, max: 10000000 },
      { range: "10M - 15M", min: 10000000, max: 15000000 },
      { range: "15M - 25M", min: 15000000, max: 25000000 },
      { range: "> 25M", min: 25000000, max: Infinity },
    ];

  const salaryDistribution = salaryRanges.map(({ range, min, max }) => {
  const count = employees.filter((emp) => {
        const netSalary =
          emp.baseSalary +
          (emp.allowances?.transport || 0) +
          (emp.allowances?.meal || 0) +
          (emp.allowances?.bonus || 0) -
          (emp.deductions?.tax || 0) -
          (emp.deductions?.insurance || 0) -
          (emp.deductions?.other || 0);
        return netSalary >= min && netSalary < max;
      }).length;

      return {
        range,
        count,
        percentage: (count / employees.length) * 100,
      };
    });

    // Build per-employee computed rows (net pay primary)
  const rows = employees.map((emp) => {
    const allowancesTotal =
      (emp.allowances?.transport || 0) +
      (emp.allowances?.meal || 0) +
      (emp.allowances?.bonus || 0) +
      (emp.allowances?.overtime || 0) +
      (emp.allowances?.tips || 0) +
      (emp.allowances?.holidayAllowance || 0);

    const deductionsTotal =
      (emp.deductions?.tax || 0) +
      (emp.deductions?.insurance || 0) +
      (emp.deductions?.other || 0) +
      (emp.deductions?.cooperativeFund || 0) +
      (emp.deductions?.healthInsurance || 0) +
      (emp.deductions?.loanDeduction || 0) +
      (emp.deductions?.ppn || 0);

    const gross = emp.baseSalary + allowancesTotal;
    const net = gross - deductionsTotal;

    return {
      id: emp.id,
      name: emp.name,
      department: emp.department || "-",
      position: emp.position || "-",
      baseSalary: emp.baseSalary || 0,
      allowancesTotal,
      deductionsTotal,
      gross,
      net,
      raw: emp,
    };
  });

  // Get top earners (by net pay)
  const topEarners = rows
      .map((emp) => ({
        name: emp.name,
        position: emp.position,
        department: emp.department,
        salary: emp.net,
      }))
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 10);

    // Generate trends data
    const trends = dashboardStats.monthlyTrend
      .slice(-6)
      .map((item, index, arr) => {
        const growth =
          index > 0
            ? ((item.amount - arr[index - 1].amount) / arr[index - 1].amount) *
              100
            : 0;
        return {
          period: item.month,
          amount: item.amount,
          growth,
        };
      });

  return {
      period: period,
      type: reportType,
      totalPayroll: dashboardStats.totalPayroll,
      totalEmployees: dashboardStats.totalEmployees,
      departmentBreakdown,
      salaryDistribution,
      trends,
  topEarners,
  rows,
      generatedAt: new Date().toISOString(),
    };
  };

  const handleDownloadReport = async () => {
    setIsGenerating(true);
    try {
      const reportData = generateReportData();
      await generateReportPDF(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const reportData: any = generateReportData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Payroll Reports
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mt-1">
              Generate comprehensive payroll analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="h-6 w-6 text-slate-500" />
          </button>
        </div>

  <div className="flex flex-col xl:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Controls Sidebar */}
          <div className="xl:w-80 p-8 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-y-auto min-h-0">
            <div className="space-y-8">
              <div>
                <label className="block text-base font-semibold text-slate-700 dark:text-slate-300 mb-4">
                  Report Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReportType("monthly")}
                    className={`p-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      reportType === "monthly"
                        ? "bg-slate-900 text-white shadow-lg"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    <Calendar className="h-5 w-5 mx-auto mb-2" />
                    Monthly
                  </button>
                  <button
                    onClick={() => setReportType("annual")}
                    className={`p-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      reportType === "annual"
                        ? "bg-slate-900 text-white shadow-lg"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    <TrendingUp className="h-5 w-5 mx-auto mb-2" />
                    Annual
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-slate-700 dark:text-slate-300 mb-4">
                  Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                >
                  {reportType === "monthly" ? (
                    <>
                      <option value="12/2024">December 2024</option>
                      <option value="11/2024">November 2024</option>
                      <option value="10/2024">October 2024</option>
                      <option value="9/2024">September 2024</option>
                    </>
                  ) : (
                    <>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                    </>
                  )}
                </select>
              </div>

              <button
                onClick={handleDownloadReport}
                disabled={isGenerating}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Report Preview */}
          <div className="flex-1 p-8 overflow-y-auto min-h-0 max-h-[70vh]">
            <div className="space-y-8">
              {fetchError && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-amber-800 dark:text-amber-300">{fetchError}</div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => fetchEmployees()}
                        className="px-3 py-1 bg-amber-600 text-white rounded-lg text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {/* Report Header */}
              <div className="text-center pb-8 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                  {reportType === "monthly" ? "Monthly" : "Annual"} Payroll
                  Report
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Period: {selectedPeriod} | Generated:{" "}
                  {formatDate(reportData.generatedAt)}
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-6 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">
                        Total Payroll
                      </p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(reportData.totalPayroll)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-slate-500" />
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-2">
                        Total Employees
                      </p>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {reportData.totalEmployees}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-emerald-500" />
                  </div>
                </div>

                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-6 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-violet-600 dark:text-violet-400 text-sm font-medium mb-2">
                        Avg Salary
                      </p>
                      <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                        {formatCurrency(
                          Math.round(
                            reportData.totalPayroll / reportData.totalEmployees
                          )
                        )}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-violet-500" />
                  </div>
                </div>
              </div>

              {/* Department Breakdown */}
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Department Breakdown
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 text-slate-600 dark:text-slate-400 font-semibold">
                          Department
                        </th>
                        <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-semibold">
                          Employees
                        </th>
                        <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-semibold">
                          Total Salary
                        </th>
                        <th className="text-right py-3 text-slate-600 dark:text-slate-400 font-semibold">
                          Avg Salary
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.departmentBreakdown.map((dept: any) => (
                        <tr
                          key={dept.department}
                          className="border-b border-slate-100 dark:border-slate-800"
                        >
                          <td className="py-4 font-semibold text-slate-900 dark:text-white">
                            {dept.department}
                          </td>
                          <td className="py-4 text-right text-slate-600 dark:text-slate-400">
                            {dept.employeeCount}
                          </td>
                          <td className="py-4 text-right font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(dept.totalSalary)}
                          </td>
                          <td className="py-4 text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(dept.averageSalary)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Earners */}
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                  Top 10 Earners
                </h4>
                <div className="space-y-3">
                  {reportData.topEarners.slice(0, 5).map((employee: any, index: number) => (
                    <div
                      key={employee.name}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {employee.name}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {employee.position}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(employee.salary)}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {employee.department}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModal;
