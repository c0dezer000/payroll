"use client";
import { useState } from "react";
import Sidebar from "../../src/components/Sidebar";
import Header from "../../src/components/Header";
import Dashboard from "../../src/components/Dashboard";
import EmployeeList from "../../src/components/EmployeeList";
import PayrollProcessing from "../../src/components/PayrollProcessing";
import PaySlipGenerator from "../../src/components/PaySlipGenerator";
import WhatsAppIntegration from "../../src/components/WhatsAppIntegration";
import Settings from "../../src/components/Settings";
import AttendancePage from "../../src/attandance/AttendancePage";

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "employees":
        return <EmployeeList />;
      case "attendance":
        return <AttendancePage />;
      case "payroll":
        return <PayrollProcessing />;
      case "payslips":
        return <PaySlipGenerator />;
      case "whatsapp":
        return <WhatsAppIntegration />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 z-50 ${sidebarOpen ? 'left-0' : '-left-full'} lg:left-0 lg:z-auto transition-all duration-300 ease-in-out w-64 lg:w-72`}
      >
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab: string) => {
            setActiveTab(tab);
            setSidebarOpen(false);
          }}
        />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}
