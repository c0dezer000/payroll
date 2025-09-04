import {
  LayoutDashboard,
  Users,
  Calculator,
  FileText,
  Settings,
  MessageSquare,
  Waves,
  Clock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "Employees", icon: Users },
  { id: "attendance", label: "Attendance", icon: Clock },
    { id: "payroll", label: "Payroll", icon: Calculator },
    { id: "payslips", label: "Pay Slips", icon: FileText },
    { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 w-64 lg:w-72 min-h-screen flex flex-col">
      <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3 lg:space-x-4">
          <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-2.5 lg:p-3 rounded-xl">
            <Waves className="h-5 w-5 lg:h-7 lg:w-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white truncate">
              Enjoy Dive
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 truncate">
              Payroll System
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 sm:p-4 lg:p-6">
        <ul className="space-y-2 lg:space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 lg:space-x-4 px-3 lg:px-4 py-3 lg:py-4 rounded-xl text-left transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-slate-900 dark:bg-slate-700 text-white shadow-lg"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0" />
                  <span className="font-medium text-sm lg:text-base truncate">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info at Bottom */}
      <div className="p-3 sm:p-4 lg:p-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-slate-600 to-slate-800 p-2 rounded-lg">
            <span className="text-white font-bold text-sm">
              {user?.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
              {user?.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
