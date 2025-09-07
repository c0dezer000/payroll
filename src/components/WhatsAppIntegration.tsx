import { useEffect, useState } from "react";
import {
  MessageSquare,
  Send,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
} from "lucide-react";
import type { Employee } from "../types";
import {
  formatCurrency,
  getCurrentPeriod,
  calculatePayroll,
} from "../utils/payroll";
import { getCachedHolidaysForYear } from "../utils/holidays";

interface MessageStatus {
  employeeId: string;
  status: "pending" | "sending" | "sent" | "failed";
  sentAt?: string;
}

const WhatsAppIntegration: React.FC = () => {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [messageStatus, setMessageStatus] = useState<MessageStatus[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [selectedPeriod] = useState(getCurrentPeriod());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [computedPayslips, setComputedPayslips] = useState<Record<string, any>>({});
  const [payslipsLoading, setPayslipsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Failed to load employees');
        const data: Employee[] = await res.json();
        if (mounted) setEmployees(data || []);
      } catch (err) {
        console.error(err);
        if (mounted) setEmployees([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchEmployees();
    return () => { mounted = false };
  }, []);

  // Compute attendance-aware payslips for list preview
  useEffect(() => {
    let mounted = true;
    const buildPayslips = async () => {
      if (!employees || employees.length === 0) return;
      setPayslipsLoading(true);
      const isMonthly = selectedPeriod.includes("/");
      const entries = await Promise.all(
        employees.map(async (emp) => {
          try {
            let attendance: any = null;
            if (isMonthly) {
              const [mStr, yStr] = selectedPeriod.split("/");
              const monthNum = Number(mStr);
              const yearNum = Number(yStr);
              if (monthNum && yearNum) {
                const start = new Date(yearNum, monthNum - 1, 1);
                const end = new Date(yearNum, monthNum, 0);
                const holidays = getCachedHolidaysForYear(yearNum);
                const countWorkDays = (s: Date, e: Date) => {
                  let d = new Date(s);
                  let count = 0;
                  while (d <= e) {
                    const day = d.getDay();
                    if (day >= 1 && day <= 5) count++;
                    d.setDate(d.getDate() + 1);
                  }
                  try {
                    const holidayCount = (holidays || []).filter((h: any) => {
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

                const res = await fetch(
                  `/api/attendance?employeeId=${encodeURIComponent(emp.id)}&start=${start.toISOString().slice(0,10)}&end=${end.toISOString().slice(0,10)}`
                );
                if (res.ok) {
                  const recs = await res.json();
                  const records = Array.isArray(recs) ? recs : [];
                  const totalOvertime = records.reduce((sum: number, rec: any) => sum + (Number(rec.overtimeHours) || 0), 0);
                  const daysPresent = records.filter((rec: any) => rec.status === 'present' || (Number(rec.hoursWorked) || 0) > 0).length;
                  const workDays = countWorkDays(start, end);
                  attendance = {
                    workDays,
                    daysPresent,
                    overtimeHours: Math.round(totalOvertime * 100) / 100,
                    expectedHours: workDays * 8,
                  };
                }
              }
            }

            const payslip = calculatePayroll(emp, selectedPeriod, attendance);
            return [emp.id, payslip];
          } catch (err) {
            return [emp.id, null];
          }
        })
      );

      if (!mounted) return;
      const map: Record<string, any> = {};
      for (const pair of entries as Array<[string, any]>) {
        const id = pair[0];
        const ps = pair[1];
        if (ps) map[id] = ps;
      }
      setComputedPayslips(map);
      setPayslipsLoading(false);
    };

    buildPayslips();
    return () => { mounted = false };
  }, [employees, selectedPeriod]);

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((emp) => emp.id));
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const sendWhatsAppMessages = async () => {
    if (selectedEmployees.length === 0) return;

    setIsSending(true);
    const initialStatus = selectedEmployees.map((id) => ({
      employeeId: id,
      status: "pending" as const,
    }));
    setMessageStatus(initialStatus);

    for (const employeeId of selectedEmployees) {
      const employee = employees.find((emp) => emp.id === employeeId);
      if (!employee) continue;

      // Update to sending
      setMessageStatus((prev) =>
        prev.map((status) =>
          status.employeeId === employeeId
            ? { ...status, status: "sending" }
            : status
        )
      );

      // Prefer precomputed attendance-aware payslip when available
      const precomputed = computedPayslips[employeeId];
      const payslip = precomputed ?? calculatePayroll(employee, selectedPeriod, null);

      const message = `💼 *BAYANI PAYROLL*\n\nHello ${employee.name},\n\nYour pay slip for ${selectedPeriod} is ready!\n\n💰 Net Salary (Take-home): ${formatCurrency(
        payslip.netSalary
      )}` +
        (payslip.proratedBase && payslip.proratedBase !== payslip.baseSalary ? `\n📌 Prorated Base: ${formatCurrency(payslip.proratedBase)}` : "") +
        `\n\nThank you for your dedication to Bayani Solutions!`;

      // Simulate sending delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate success (in real implementation, this would be actual WhatsApp API call)
      const success = Math.random() > 0.1; // 90% success rate

      setMessageStatus((prev) =>
        prev.map((status) =>
          status.employeeId === employeeId
            ? {
                ...status,
                status: success ? "sent" : "failed",
                sentAt: success ? new Date().toISOString() : undefined,
              }
            : status
        )
      );

      // Open WhatsApp for demonstration
      if (success) {
          const phone = employee.phone || "";
          const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
            message
          )}`;
        setTimeout(() => window.open(whatsappUrl, "_blank"), 500);
      }
    }

    setIsSending(false);
  };

  const sentCount = messageStatus.filter((s) => s.status === "sent").length;
  const failedCount = messageStatus.filter((s) => s.status === "failed").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            WhatsApp Integration
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mt-2">
            Send pay slips via WhatsApp to employees
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
                Selected
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {selectedEmployees.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-slate-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
                Sent
              </p>
              <p className="text-3xl font-bold text-emerald-600">{sentCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
                Failed
              </p>
              <p className="text-3xl font-bold text-red-600">{failedCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
                Pending
              </p>
              <p className="text-3xl font-bold text-amber-600">
                {
                  messageStatus.filter(
                    (s) => s.status === "pending" || s.status === "sending"
                  ).length
                }
              </p>
            </div>
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-6 lg:space-y-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Send Pay Slips
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-base mt-1">
              Period: {selectedPeriod}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSelectAll}
              className="px-6 py-3 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 font-medium"
            >
              {selectedEmployees.length === employees.length
                ? "Deselect All"
                : "Select All"}
            </button>
            <button
              onClick={sendWhatsAppMessages}
              disabled={selectedEmployees.length === 0 || isSending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send to WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Employee List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {employees.map((employee) => {
            const isSelected = selectedEmployees.includes(employee.id);
            const status = messageStatus.find(
              (s) => s.employeeId === employee.id
            );
            const payslip = calculatePayroll(employee, selectedPeriod, null);

            return (
              <div
                key={employee.id}
                className={`flex items-center justify-between p-6 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectEmployee(employee.id)}
                    disabled={isSending}
                    className="h-5 w-5 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                  />
                  <div className="bg-gradient-to-br from-slate-600 to-slate-800 p-3 rounded-xl text-white font-bold text-sm">
                    {employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-base">
                      {employee.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {employee.position}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{employee.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white text-base">
                      {formatCurrency(payslip.netSalary)}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {employee.department}
                    </p>
                  </div>

                  {status && (
                    <div className="flex items-center space-x-2">
                      {status.status === "pending" && (
                        <Clock className="h-5 w-5 text-slate-400" />
                      )}
                      {status.status === "sending" && (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-500 border-t-transparent"></div>
                      )}
                      {status.status === "sent" && (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      )}
                      {status.status === "failed" && (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sample Message Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Message Preview
        </h3>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl max-w-md border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            <span className="font-semibold text-emerald-800 dark:text-emerald-400">
              WhatsApp Message
            </span>
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            🌊 <strong>ENJOY DIVE PAYROLL</strong>
            {"\n\n"}Hello [Employee Name],
            {"\n\n"}Your pay slip for {selectedPeriod} is ready!
            {"\n\n"}💰 Net Salary: [Amount]
            {"\n\n"}Thank you for your dedication to Enjoy Dive! 🏊‍♂️
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppIntegration;
