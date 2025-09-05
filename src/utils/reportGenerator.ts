import jsPDF from "jspdf";
import type { ReportData } from "../types";
import { formatCurrency, formatDate } from "./payroll";

export const generateReportPDF = async (
  reportData: ReportData
): Promise<void> => {
  try {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Colors
    const primaryColor = [2, 132, 199]; // sky-600
    const secondaryColor = [15, 23, 42]; // slate-900
    const lightGray = [156, 163, 175]; // gray-400
    const darkGray = [75, 85, 99]; // gray-600

    let yPosition = 20;

    // Header
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 50, "F");

    // Company logo area
    pdf.setFillColor(255, 255, 255);
    pdf.circle(25, 25, 10, "F");
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFontSize(16);
    pdf.text("~", 21, 28);

    // Company name and report title
    pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  pdf.text("BAYANI SOLUTIONS", 45, 25);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text("Payroll & HR Solutions for Filipinos", 45, 32);

    // Report title
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      `${reportData.type.toUpperCase()} PAYROLL REPORT`,
      pageWidth - 10,
      25,
      { align: "right" }
    );
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Period: ${reportData.period}`, pageWidth - 10, 35, {
      align: "right",
    });
    pdf.text(
      `Generated: ${formatDate(reportData.generatedAt)}`,
      pageWidth - 10,
      42,
      { align: "right" }
    );

    yPosition = 70;

    // Executive Summary
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("EXECUTIVE SUMMARY", 20, yPosition);

    yPosition += 15;

    // Summary boxes
    const summaryData = [
      {
        label: "Total Payroll",
        value: formatCurrency(reportData.totalPayroll),
        color: [34, 197, 94],
      },
      {
        label: "Total Employees",
        value: reportData.totalEmployees.toString(),
        color: [59, 130, 246],
      },
      {
        label: "Average Salary",
        value: formatCurrency(Math.round(reportData.totalPayroll / reportData.totalEmployees)),
        color: [168, 85, 247],
      },
    ];

    const boxWidth = (pageWidth - 60) / 3;
    summaryData.forEach((item, index) => {
      const xPos = 20 + index * (boxWidth + 10);

      // Box background
      pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
      pdf.rect(xPos, yPosition, boxWidth, 25, "F");

      // Text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(item.label, xPos + 5, yPosition + 8);

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(item.value, xPos + 5, yPosition + 18);
    });

    yPosition += 45;

    // Department Breakdown
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("DEPARTMENT BREAKDOWN", 20, yPosition);

    yPosition += 10;

    // Table header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPosition, pageWidth - 40, 8, "F");

    pdf.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Department", 25, yPosition + 5);
    pdf.text("Employees", 80, yPosition + 5);
    pdf.text("Total Salary", 120, yPosition + 5);
    pdf.text("Avg Salary", 160, yPosition + 5);

    yPosition += 12;

    // Table rows
    pdf.setFont("helvetica", "normal");
    reportData.departmentBreakdown.forEach((dept, index) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(20, yPosition - 3, pageWidth - 40, 8, "F");
      }

      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.text(dept.department.substring(0, 20), 25, yPosition + 2);
      pdf.text(dept.employeeCount.toString(), 85, yPosition + 2);
      pdf.text(
        formatCurrency(dept.totalSalary).substring(0, 15),
        125,
        yPosition + 2
      );
      pdf.text(
        formatCurrency(dept.averageSalary).substring(0, 15),
        165,
        yPosition + 2
      );

      yPosition += 8;
    });

    yPosition += 15;

    // Salary Distribution
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("SALARY DISTRIBUTION", 20, yPosition);

    yPosition += 15;

    reportData.salaryDistribution.forEach((range) => {
      if (range.count > 0) {
        const barWidth = (range.percentage / 100) * 120;

        // Bar
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.rect(70, yPosition - 3, barWidth, 6, "F");

        // Labels
        pdf.setTextColor(
          secondaryColor[0],
          secondaryColor[1],
          secondaryColor[2]
        );
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.text(range.range, 25, yPosition + 1);
        pdf.text(
          `${range.count} (${range.percentage.toFixed(1)}%)`,
          195,
          yPosition + 1,
          { align: "right" }
        );

        yPosition += 10;
      }
    });

    yPosition += 15;

    // Top Earners
    if (yPosition > pageHeight - 80) {
      pdf.addPage();
      yPosition = 20;
    }

    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("TOP 10 EARNERS", 20, yPosition);

    yPosition += 15;

    reportData.topEarners.slice(0, 10).forEach((employee, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      // Rank circle
      pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      pdf.circle(30, yPosition, 4, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text((index + 1).toString(), 30, yPosition + 1, { align: "center" });

      // Employee info
      pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(employee.name, 40, yPosition - 2);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(
        `${employee.position} - ${employee.department}`,
        40,
        yPosition + 3
      );

      // Salary
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(formatCurrency(employee.salary), pageWidth - 25, yPosition + 1, {
        align: "right",
      });

      yPosition += 12;
    });

    // Footer
    const footerY = pageHeight - 15;
    pdf.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      "This report is confidential and generated automatically by Bayani Solutions Payroll System",
      pageWidth / 2,
      footerY,
      { align: "center" }
    );
    pdf.text(`Page 1 of ${pdf.getNumberOfPages()}`, pageWidth - 20, footerY, {
      align: "right",
    });

    // Save the PDF
    const fileName = `payroll-report-${
      reportData.type
    }-${reportData.period.replace(/\//g, "-")}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating report PDF:", error);
    throw error;
  }
};
