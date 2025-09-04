import { useState, useEffect } from "react";
import { employees } from "../data/employees";
import { type DashboardStats } from "../types";
import { calculatePayroll, getCurrentPeriod } from "../utils/payroll";

export const useDashboardData = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateStats = () => {
      const totalEmployees = employees.length;
      const activeEmployees = employees.filter(
        (emp) => emp.status === "active"
      ).length;

      const totalPayroll = employees.reduce((sum, emp) => {
        const payslip = calculatePayroll(emp, getCurrentPeriod());
        return sum + payslip.netSalary;
      }, 0);

      const departmentStats = employees.reduce((stats, emp) => {
        stats[emp.department] = (stats[emp.department] || 0) + 1;
        return stats;
      }, {} as Record<string, number>);

      // Generate realistic monthly trend data (last 12 months)
      const monthlyTrend = [];
      const currentDate = new Date();

      // Base payroll calculation for trend
      // (removed unused basePayroll variable)

      for (let i = 11; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const period = `${date.getMonth() + 1}/${date.getFullYear()}`;
        const monthName = date.toLocaleDateString("id-ID", {
          month: "short",
          year: "2-digit",
        });

        // Calculate actual payroll for each month with realistic variations
        let monthlyPayroll = 0;
        let monthlyEmployees = activeEmployees;

        // Simulate employee count changes over time
        if (i > 8) monthlyEmployees -= Math.floor(Math.random() * 3); // Fewer employees in past
        if (i > 6) monthlyEmployees -= Math.floor(Math.random() * 2);

        // Calculate payroll based on employee count and seasonal factors
        employees.slice(0, monthlyEmployees).forEach((emp) => {
          let empPayroll = calculatePayroll(emp, period);

          // Add seasonal variations
          if (date.getMonth() === 3) {
            // April - Idul Fitri
            empPayroll = calculatePayroll(emp, period);
          } else if (date.getMonth() === 11) {
            // December - Natal
            empPayroll = calculatePayroll(emp, period);
          } else if (date.getMonth() === 2) {
            // March - Nyepi
            empPayroll = calculatePayroll(emp, period);
          } else if (date.getMonth() === 8) {
            // September - Bonus
            empPayroll = calculatePayroll(emp, period);
          }

          monthlyPayroll += empPayroll.netSalary;
        });

        // Add some realistic variation (±5%)
        const variation = (Math.random() - 0.5) * 0.1;
        monthlyPayroll = monthlyPayroll * (1 + variation);

        monthlyTrend.push({
          month: monthName,
          amount: Math.round(monthlyPayroll),
          employees: monthlyEmployees,
        });
      }

      // Generate payroll history with actual calculations
      const payrollHistory = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const period = `${date.getMonth() + 1}/${date.getFullYear()}`;
        const processedDate = new Date(date.getFullYear(), date.getMonth(), 25);

        // Calculate actual payroll for this period
        const periodPayroll = employees.reduce((sum, emp) => {
          const payslip = calculatePayroll(emp, period);
          return sum + payslip.netSalary;
        }, 0);

        payrollHistory.push({
          period,
          totalAmount: Math.round(periodPayroll),
          employeeCount: activeEmployees,
          processedAt: processedDate.toISOString(),
        });
      }

      setStats({
        totalEmployees,
        activeEmployees,
        totalPayroll: Math.round(totalPayroll),
        departmentStats,
        monthlyTrend,
        payrollHistory,
      });

      setLoading(false);
    };

    // Simulate loading time
    setTimeout(calculateStats, 500);
  }, []);

  return { stats, loading };
};
