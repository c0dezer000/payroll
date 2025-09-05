import jsPDF from "jspdf";
import { type PaySlip } from "../types";
import { formatCurrency, formatDate } from "./payroll";

export const generatePDF = async (payslip: PaySlip): Promise<void> => {
  try {
    // Create a new jsPDF instance
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Colors
    const primaryColor = [2, 132, 199]; // sky-600
    const secondaryColor = [15, 23, 42]; // slate-900
    const lightGray = [156, 163, 175]; // gray-400

    // Header with company branding
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 40, "F");

    // Company logo area (wave icon simulation)
    pdf.setFillColor(255, 255, 255);
    pdf.circle(25, 20, 8, "F");
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFontSize(12);
    pdf.text("~", 22, 23);

  // Company name and details (Philippines)
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("BAYANI SOLUTIONS", 40, 20);

  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Payroll & HR Solutions for Filipinos", 40, 27);
  pdf.text("Ortigas Center, Pasig City, Metro Manila | +63 2 8888 1234", 40, 33);

    // Pay slip title
    pdf.setFillColor(255, 255, 255);
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(pageWidth - 50, 10, 40, 20, "F");
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("PAY SLIP", pageWidth - 30, 23, { align: "center" });

    // Employee information section
    let yPosition = 60;

    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Employee Information", 20, yPosition);

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    const employeeInfo = [
      ["Employee ID:", (payslip.employee as any).employeeCode || payslip.employee.id],
      ["Name:", payslip.employee.name],
      ["Position:", payslip.employee.position],
      ["Department:", payslip.employee.department],
      ["Bank Account:", payslip.employee.bankAccount],
    ];

    employeeInfo.forEach(([label, value]) => {
      pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.text(String(label || ""), 20, yPosition);
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text(String(value || ""), 70, yPosition);
      yPosition += 7;
    });

    // Pay period information (right side)
    yPosition = 70;
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Pay Period", pageWidth - 80, yPosition);

    yPosition += 10;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    const periodInfo = [
      ["Period:", payslip.period],
      ["Generated:", formatDate(payslip.generatedAt)],
      ["Pay Slip ID:", payslip.id],
    ];

    if (payslip.overtimeHours && payslip.overtimeHours > 0) {
      periodInfo.push(["Overtime Hours:", `${payslip.overtimeHours} hours`]);
    }

    periodInfo.forEach(([label, value]) => {
      pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      pdf.text(String(label || ""), pageWidth - 80, yPosition);
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text(String(value || ""), pageWidth - 30, yPosition);
      yPosition += 7;
    });

    // Salary breakdown section
    yPosition = 120;

    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Salary Breakdown", 20, yPosition);

    yPosition += 15;

    // Earnings section
    pdf.setFillColor(220, 252, 231); // green-50
    pdf.rect(20, yPosition - 5, (pageWidth - 50) / 2 - 5, 80, "F");

    pdf.setTextColor(22, 163, 74); // green-600
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Earnings", 25, yPosition + 5);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    yPosition += 12;

    const earnings = [
      ["Base Salary", formatCurrency(payslip.baseSalary)],
      ["Transport Allowance", formatCurrency(payslip.allowances.transport)],
      ["Meal Allowance", formatCurrency(payslip.allowances.meal)],
      ["Bonus", formatCurrency(payslip.allowances.bonus)],
    ];

    if (payslip.allowances.overtime > 0) {
      earnings.push([
        "Overtime Pay",
        formatCurrency(payslip.allowances.overtime),
      ]);
    }
    if (payslip.allowances.tips > 0) {
      earnings.push(["Tips", formatCurrency(payslip.allowances.tips)]);
    }
    if (payslip.allowances.holidayAllowance > 0) {
      earnings.push(["Holiday Allowance", formatCurrency(payslip.allowances.holidayAllowance)]);
    }

    earnings.forEach(([label, amount]) => {
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text(label, 25, yPosition);
      pdf.text(amount, 90, yPosition, { align: "right" });
      yPosition += 7;
    });

    // Gross salary
    pdf.setDrawColor(22, 163, 74);
    pdf.line(25, yPosition + 2, 90, yPosition + 2);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(22, 163, 74);
    pdf.text("Gross Salary", 25, yPosition + 8);
    pdf.text(formatCurrency(payslip.grossSalary), 90, yPosition + 8, {
      align: "right",
    });

    // Deductions section
    yPosition = 135;

    pdf.setFillColor(254, 226, 226); // red-50
    pdf.rect(
      pageWidth / 2 + 5,
      yPosition - 5,
      (pageWidth - 50) / 2 - 5,
      80,
      "F"
    );

    pdf.setTextColor(220, 38, 38); // red-600
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Deductions", pageWidth / 2 + 10, yPosition + 5);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    yPosition += 12;

    const deductions = [
      ["Tax", formatCurrency(payslip.deductions.tax)],
      ["Insurance", formatCurrency(payslip.deductions.insurance)],
    ];

    if (payslip.deductions.cooperativeFund > 0) {
      deductions.push(["Cooperative Fund", formatCurrency(payslip.deductions.cooperativeFund)]);
    }
    if (payslip.deductions.healthInsurance > 0) {
      deductions.push(["Health Insurance", formatCurrency(payslip.deductions.healthInsurance)]);
    }
    if (payslip.deductions.loanDeduction > 0) {
      deductions.push(["Loan Deduction", formatCurrency(payslip.deductions.loanDeduction)]);
    }

  // Government mandatory deductions for Philippines - always show rows
  deductions.push(["SSS", formatCurrency(payslip.deductions.sss)]);
  deductions.push(["PhilHealth", formatCurrency(payslip.deductions.philHealth)]);
  deductions.push(["Pag-IBIG", formatCurrency(payslip.deductions.pagIbig)]);

    if (payslip.deductions.other > 0) {
      deductions.push(["Other", formatCurrency(payslip.deductions.other)]);
    }

    deductions.forEach(([label, amount]) => {
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text(label, pageWidth / 2 + 10, yPosition);
      pdf.text(amount, pageWidth - 25, yPosition, { align: "right" });
      yPosition += 7;
    });

    // Total deductions
    pdf.setDrawColor(220, 38, 38);
    pdf.line(pageWidth / 2 + 10, yPosition + 2, pageWidth - 25, yPosition + 2);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(220, 38, 38);
    pdf.text("Total Deductions", pageWidth / 2 + 10, yPosition + 8);
    pdf.text(
      formatCurrency(payslip.deductions.total),
      pageWidth - 25,
      yPosition + 8,
      { align: "right" }
    );

    // Net salary section
    yPosition = 230;

    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(20, yPosition, pageWidth - 40, 25, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Net Salary", 25, yPosition + 10);
    pdf.text("Amount to be paid", 25, yPosition + 17);

    pdf.setFontSize(20);
    pdf.text(
      formatCurrency(payslip.netSalary),
      pageWidth - 25,
      yPosition + 15,
      { align: "right" }
    );

    // Footer
    yPosition = 270;

    pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "This is a computer-generated pay slip. No signature required.",
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    pdf.text(
      "For queries, contact HR at hr@bayanisolutions.com",
      pageWidth / 2,
      yPosition + 5,
      { align: "center" }
    );

    // Save the PDF
    pdf.save(`payslip-${payslip.employee.name.replace(/\s+/g, "-")}-${payslip.period.replace("/", "-")}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
