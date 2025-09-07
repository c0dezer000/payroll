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
import { formatCurrency, formatDate, calculatePayroll } from "../../utils/payroll";
import { generateReportPDF } from "../../utils/reportGenerator";
import type { Employee } from "../../types";
import { getCachedHolidaysForYear } from "../../utils/holidays";

  

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
  const [reportPreview, setReportPreview] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
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

  // Build report data using attendance-aware payroll calculations when possible
  const buildReportData = async () => {
    const period = selectedPeriod;
    const isMonthly = reportType === "monthly";

    // parse period for monthly start/end
    let start: Date | null = null;
    let end: Date | null = null;
    if (isMonthly) {
      const [mStr, yStr] = period.split("/");
      const monthNum = Number(mStr);
      const yearNum = Number(yStr);
      if (!monthNum || !yearNum) {
        // fallback to current month
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        start = new Date(yearNum, monthNum - 1, 1);
        end = new Date(yearNum, monthNum, 0);
      }
    }

    // Helper: count work days excluding non-working holidays
    const countWorkDays = (s: Date, e: Date, holidaysForYear: any[] = []) => {
      let d = new Date(s);
      let count = 0;
      while (d <= e) {
        const day = d.getDay();
        if (day >= 1 && day <= 5) count++;
        d.setDate(d.getDate() + 1);
      }

      try {
        const holidayCount = (holidaysForYear || []).filter((h: any) => {
          if (!h || !h.date) return false;
          if (h.isActive === false) return false;
          if (h.type === "special_working") return false;
          const hd = new Date(h.date);
          return hd >= s && hd <= e && hd.getDay() >= 1 && hd.getDay() <= 5;
        }).length;

        count = Math.max(0, count - holidayCount);
      } catch (err) {}

      return count;
    };

    const holidays = start ? getCachedHolidaysForYear(start.getFullYear()) : [];

    const rows: any[] = [];
    let totalPayroll = 0;

    // Build per-employee rows in parallel
    await Promise.all(
      employees.map(async (emp) => {
        let attendance: any = null;

        if (isMonthly && start && end) {
          try {
            const res = await fetch(
              `/api/attendance?employeeId=${encodeURIComponent(emp.id)}&start=${start.toISOString().slice(0,10)}&end=${end.toISOString().slice(0,10)}`
            );
            if (res.ok) {
              const recs = await res.json();
              const records = Array.isArray(recs) ? recs : [];

              const totalOvertime = records.reduce((sum: number, rec: any) => sum + (Number(rec.overtimeHours) || 0), 0);
              const daysPresent = records.filter((rec: any) => rec.status === 'present' || (Number(rec.hoursWorked) || 0) > 0).length;
              const workDays = countWorkDays(start!, end!, holidays);

              attendance = {
                workDays,
                daysPresent,
                overtimeHours: Math.round(totalOvertime * 100) / 100,
                expectedHours: workDays * 8,
              };
            }
          } catch (err) {
            // ignore and use null attendance
          }
        }

        const payslip = calculatePayroll(emp, period, attendance);

        const allowancesTotal = payslip.allowances.total || 0;
        const deductionsTotal = payslip.deductions.total || 0;

        rows.push({
          id: emp.id,
          name: emp.name,
          department: emp.department || "-",
          position: emp.position || "-",
          baseSalary: payslip.baseSalary || 0,
          proratedBase: payslip.proratedBase || 0,
          allowancesTotal,
          deductionsTotal,
          gross: payslip.grossSalary || 0,
          net: payslip.netSalary || 0,
          raw: emp,
        });

        totalPayroll += payslip.netSalary || 0;
      })
    );

    // Department breakdown
    const departmentBreakdown = Object.entries(dashboardStats.departmentStats)
      .map(([department, employeeCount]) => {
        const deptRows = rows.filter((r) => r.department === department);
        const totalSalary = deptRows.reduce((s, r) => s + (r.net || 0), 0);
        return {
          department,
          employeeCount,
          totalSalary,
          averageSalary: employeeCount > 0 ? totalSalary / employeeCount : 0,
        };
      })
      .sort((a, b) => b.totalSalary - a.totalSalary);

    // Salary distribution based on net
    const salaryRanges = [
      { range: "< 5M", min: 0, max: 5000000 },
      { range: "5M - 10M", min: 5000000, max: 10000000 },
      { range: "10M - 15M", min: 10000000, max: 15000000 },
      { range: "15M - 25M", min: 15000000, max: 25000000 },
      { range: "> 25M", min: 25000000, max: Infinity },
    ];

    const salaryDistribution = salaryRanges.map(({ range, min, max }) => {
      const count = rows.filter((r) => {
        const val = r.net || 0;
        return val >= min && val < max;
      }).length;
      return {
        range,
        count,
        percentage: employees.length > 0 ? (count / employees.length) * 100 : 0,
      };
    });

    const topEarners = rows
      .map((r) => ({ name: r.name, position: r.position, department: r.department, salary: r.net }))
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 10);

    const trends = dashboardStats.monthlyTrend
      .slice(-6)
      .map((item, index, arr) => {
        const growth = index > 0 && arr[index - 1].amount > 0 ? ((item.amount - arr[index - 1].amount) / arr[index - 1].amount) * 100 : 0;
        return { period: item.month, amount: item.amount, growth };
      });

    return {
      period,
      type: reportType,
      totalPayroll,
      totalEmployees: employees.length,
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
      const data = reportPreview || (await buildReportData());
      await generateReportPDF(data);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Build preview when employees or period changes
  useEffect(() => {
    let mounted = true;
    const build = async () => {
      if (!employees || employees.length === 0) return;
      setPreviewLoading(true);
      try {
        const data = await buildReportData();
        if (!mounted) return;
        setReportPreview(data);
      } catch (err) {
        // ignore preview errors
      } finally {
        if (mounted) setPreviewLoading(false);
      }
    };
    build();
    return () => { mounted = false };
  }, [employees, selectedPeriod, reportType]);

  const reportData: any = reportPreview || buildReportData();

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
