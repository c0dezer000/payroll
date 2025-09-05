import { useState, useEffect } from "react";
import type { Employee } from "../types";
import { type DashboardStats } from "../types";
import { calculatePayroll, getCurrentPeriod } from "../utils/payroll";

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchAndCalculate = async () => {
      try {
        const res = await fetch('/api/employees');
        const employees: Employee[] = res.ok ? await res.json() : [];

        if (!mounted) return;

        const totalEmployees = employees.length;
        const activeEmployees = employees.filter((emp) => emp.status === "active").length;

        const totalPayroll = employees.reduce((sum, emp) => {
          const payslip = calculatePayroll(emp, getCurrentPeriod(), null);
          return sum + payslip.netSalary;
        }, 0);

        const departmentStats = employees.reduce((stats, emp) => {
          stats[emp.department] = (stats[emp.department] || 0) + 1;
          return stats;
        }, {} as Record<string, number>);

        // Generate realistic monthly trend data (last 12 months)
        const monthlyTrend: Array<{ month: string; amount: number; employees: number }> = [];
        const currentDate = new Date();

        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const period = `${date.getMonth() + 1}/${date.getFullYear()}`;
          const monthName = date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });

          let monthlyPayroll = 0;
          let monthlyEmployees = activeEmployees;
          if (i > 8) monthlyEmployees -= Math.floor(Math.random() * 3);
          if (i > 6) monthlyEmployees -= Math.floor(Math.random() * 2);

          employees.slice(0, monthlyEmployees).forEach((emp) => {
            const empPayroll = calculatePayroll(emp, period, null);
            monthlyPayroll += empPayroll.netSalary;
          });

          const variation = (Math.random() - 0.5) * 0.1;
          monthlyPayroll = monthlyPayroll * (1 + variation);

          monthlyTrend.push({ month: monthName, amount: Math.round(monthlyPayroll), employees: monthlyEmployees });
        }

        const payrollHistory: Array<any> = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const period = `${date.getMonth() + 1}/${date.getFullYear()}`;
          const processedDate = new Date(date.getFullYear(), date.getMonth(), 25);

          const periodPayroll = employees.reduce((sum, emp) => {
            const payslip = calculatePayroll(emp, period, null);
            return sum + payslip.netSalary;
          }, 0);

          payrollHistory.push({ period, totalAmount: Math.round(periodPayroll), employeeCount: activeEmployees, processedAt: processedDate.toISOString() });
        }

        if (mounted) {
          setStats({
            totalEmployees,
            activeEmployees,
            totalPayroll: Math.round(totalPayroll),
            departmentStats,
            monthlyTrend,
            payrollHistory,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAndCalculate();

    return () => { mounted = false };
  }, []);

  return { stats, loading };
};
