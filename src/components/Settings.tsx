import { useState } from "react";
import {
  Settings as SettingsIcon,
  Users,
  Shield,
  Bell,
  Palette,
  Database,
  Download,
  Upload,
  Save,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  X,
  AlertCircle,
  Building,
  Moon,
  Sun,
  Gift,
  Calendar,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { holidayCalendar, formatDate } from "../utils/payroll";

interface UserRole {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "HR Manager" | "Accountant";
  permissions: string[];
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
}

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  logo: string;
}

const Settings: React.FC = () => {
  useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("general");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: "Enjoy Dive",
    address: "Sanur Beach, Bali, Indonesia",
    phone: "+62 361 288 829",
    email: "info@enjoydive.com",
    website: "www.enjoydive.com",
    taxId: "NPWP.123.456.789.0-123.000",
    logo: "",
  });

  // User Management State
  const [users, setUsers] = useState<UserRole[]>([
    {
      id: "1",
      name: "Made Sutrisno",
      email: "owner@enjoydive.com",
      role: "Owner",
      permissions: ["all"],
      status: "active",
      lastLogin: "2024-12-15T10:30:00Z",
      createdAt: "2020-01-15T00:00:00Z",
    },
    {
      id: "2",
      name: "Kadek Sari Dewi",
      email: "admin@enjoydive.com",
      role: "Admin",
      permissions: ["payroll", "employees", "reports"],
      status: "active",
      lastLogin: "2024-12-15T09:15:00Z",
      createdAt: "2020-03-01T00:00:00Z",
    },
    {
      id: "3",
      name: "Wayan Agus Pratama",
      email: "hr@enjoydive.com",
      role: "HR Manager",
      permissions: ["employees", "reports"],
      status: "active",
      lastLogin: "2024-12-14T16:45:00Z",
      createdAt: "2021-06-15T00:00:00Z",
    },
  ]);

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Admin" as UserRole["role"],
    permissions: [] as string[],
    password: "",
  });

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    whatsappNotifications: true,
    payrollReminders: true,
    systemAlerts: true,
    weeklyReports: false,
    monthlyReports: true,
  });

  const availablePermissions = [
    { id: "dashboard", label: "Dashboard Access" },
    { id: "employees", label: "Employee Management" },
    { id: "payroll", label: "Payroll Processing" },
    { id: "payslips", label: "Pay Slip Generation" },
    { id: "whatsapp", label: "WhatsApp Integration" },
    { id: "reports", label: "Reports & Analytics" },
    { id: "settings", label: "System Settings" },
    { id: "users", label: "User Management" },
  ];

  const handleSaveCompanySettings = () => {
    // In a real app, this would save to backend
    alert("Company settings saved successfully!");
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();

    const user: UserRole = {
      id: (users.length + 1).toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions,
      status: "active",
      lastLogin: "Never",
      createdAt: new Date().toISOString(),
    };

    setUsers([...users, user]);
    setShowAddUserModal(false);
    setNewUser({
      name: "",
      email: "",
      role: "Admin",
      permissions: [],
      password: "",
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((u) => u.id !== userId));
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(
      users.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    );
  };

  const formatDateLocal = (dateString: string) => {
    if (dateString === "Never") return "Never";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const menuItems = [
    { id: "general", label: "General Settings", icon: SettingsIcon },
    { id: "company", label: "Company Info", icon: Building },
    { id: "holidays", label: "Holiday Calendar", icon: Gift },
    { id: "users", label: "User Management", icon: Users },
    { id: "permissions", label: "Roles & Permissions", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "backup", label: "Backup & Export", icon: Database },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Settings
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mt-2">
          Manage your payroll system configuration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* Settings Menu */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 sm:px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeSection === item.id
                        ? "bg-slate-900 dark:bg-slate-700 text-white shadow-lg"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base truncate">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            {/* Holiday Calendar */}
            {activeSection === "holidays" && (
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    Holiday Calendar & Allowances
                  </h3>
                  <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg">
                    <Plus className="h-4 w-4" />
                    <span>Add Holiday</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {holidayCalendar.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex items-start space-x-4">
                          <div
                            className={`p-3 rounded-xl ${
                              holiday.type === "idul_fitri"
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : holiday.type === "natal"
                                ? "bg-red-100 dark:bg-red-900/30"
                                : holiday.type === "nyepi"
                                ? "bg-yellow-100 dark:bg-yellow-900/30"
                                : holiday.type === "waisak"
                                ? "bg-purple-100 dark:bg-purple-900/30"
                                : "bg-blue-100 dark:bg-blue-900/30"
                            }`}
                          >
                            <Gift
                              className={`h-6 w-6 ${
                                holiday.type === "idul_fitri"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : holiday.type === "natal"
                                  ? "text-red-600 dark:text-red-400"
                                  : holiday.type === "nyepi"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : holiday.type === "waisak"
                                  ? "text-purple-600 dark:text-purple-400"
                                  : "text-blue-600 dark:text-blue-400"
                              }`}
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                              {holiday.name}
                            </h4>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                              {holiday.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-600 dark:text-slate-400">
                                  {formatDate(holiday.date)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Allowance:
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {holiday.allowanceMultiplier * 100}% dari gaji
                                  pokok
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={holiday.isActive}
                              className="sr-only peer"
                              readOnly
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 dark:peer-focus:ring-slate-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-slate-600"></div>
                          </label>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">
                        Holiday Allowance Information
                      </h4>
                      <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <li>
                          • Tunjangan Idul Fitri: 100% dari gaji pokok (wajib
                          sesuai peraturan)
                        </li>
                        <li>• Tunjangan Natal: 50% dari gaji pokok</li>
                        <li>• Tunjangan Nyepi: 50% dari gaji pokok</li>
                        <li>• Tunjangan Waisak: 30% dari gaji pokok</li>
                        <li>
                          • Bonus Anniversary: 50% dari gaji pokok (setiap 15
                          Januari)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Settings */}
            {activeSection === "general" && (
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">
                  General Settings
                </h3>

                <div className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        System Language
                      </label>
                      <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent">
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Currency
                      </label>
                      <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent">
                        <option value="IDR">Indonesian Rupiah (IDR)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Date Format
                      </label>
                      <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent">
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Timezone
                      </label>
                      <select className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent">
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar">
                          Asia/Makassar (WITA)
                        </option>
                        <option value="Asia/Jayapura">
                          Asia/Jayapura (WIT)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Company Info */}
            {activeSection === "company" && (
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">
                  Company Information
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={companySettings.name}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Tax ID / NPWP
                      </label>
                      <input
                        type="text"
                        value={companySettings.taxId}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            taxId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Address
                    </label>
                    <textarea
                      rows={3}
                      value={companySettings.address}
                      onChange={(e) =>
                        setCompanySettings({
                          ...companySettings,
                          address: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={companySettings.phone}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            phone: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={companySettings.email}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Website
                      </label>
                      <input
                        type="url"
                        value={companySettings.website}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            website: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveCompanySettings}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            {activeSection === "users" && (
              <div className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    User Management
                  </h3>
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-gradient-to-br from-slate-600 to-slate-800 p-2 sm:p-3 rounded-xl text-white font-bold text-sm mr-3 sm:mr-4">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                  {user.name}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span className="inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 sm:px-3 py-1 text-xs font-semibold rounded-full ${
                                user.status === "active"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {formatDateLocal(user.lastLogin)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <button
                                onClick={() => handleToggleUserStatus(user.id)}
                                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                                <Edit className="h-4 w-4" />
                              </button>
                              {user.id !== "1" && (
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">
                  Notification Settings
                </h3>

                <div className="space-y-6">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {key === "emailNotifications" &&
                            "Receive notifications via email"}
                          {key === "whatsappNotifications" &&
                            "Send notifications via WhatsApp"}
                          {key === "payrollReminders" &&
                            "Get reminders for payroll processing"}
                          {key === "systemAlerts" &&
                            "Receive system alerts and warnings"}
                          {key === "weeklyReports" &&
                            "Get weekly summary reports"}
                          {key === "monthlyReports" &&
                            "Get monthly detailed reports"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              [key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 dark:peer-focus:ring-slate-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-slate-600"></div>
                      </label>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg">
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance */}
            {activeSection === "appearance" && (
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">
                  Appearance Settings
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        Dark Mode
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                    >
                      {theme === "light" ? (
                        <Moon className="h-4 w-4" />
                      ) : (
                        <Sun className="h-4 w-4" />
                      )}
                      <span>
                        {theme === "light"
                          ? "Enable Dark Mode"
                          : "Enable Light Mode"}
                      </span>
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                      Color Scheme
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-600 rounded-lg text-white text-center cursor-pointer hover:bg-slate-700 transition-colors">
                        <div className="w-8 h-8 bg-slate-800 rounded-full mx-auto mb-2"></div>
                        <span className="text-sm font-medium">
                          Slate (Current)
                        </span>
                      </div>
                      <div className="p-4 bg-blue-600 rounded-lg text-white text-center cursor-pointer hover:bg-blue-700 transition-colors opacity-50">
                        <div className="w-8 h-8 bg-blue-800 rounded-full mx-auto mb-2"></div>
                        <span className="text-sm font-medium">
                          Blue (Coming Soon)
                        </span>
                      </div>
                      <div className="p-4 bg-emerald-600 rounded-lg text-white text-center cursor-pointer hover:bg-emerald-700 transition-colors opacity-50">
                        <div className="w-8 h-8 bg-emerald-800 rounded-full mx-auto mb-2"></div>
                        <span className="text-sm font-medium">
                          Emerald (Coming Soon)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup & Export */}
            {activeSection === "backup" && (
              <div className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">
                  Backup & Export
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                        Export Data
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Export your payroll data for backup or migration
                        purposes
                      </p>
                      <button className="w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Export All Data</span>
                      </button>
                    </div>

                    <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                        Import Data
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Import employee data from CSV or Excel files
                      </p>
                      <button className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2">
                        <Upload className="h-4 w-4" />
                        <span>Import Data</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-800 dark:text-amber-400 mb-2">
                          Automatic Backup
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          Your data is automatically backed up daily at 2:00 AM
                          WIB. Last backup: December 15, 2024 at 02:00 WIB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Add New User
              </h2>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value as UserRole["role"],
                      })
                    }
                    className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  >
                    <option value="Admin">Admin</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Accountant">Accountant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      className="w-full px-4 py-3 pr-12 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Permissions
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {availablePermissions.map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={newUser.permissions.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUser({
                              ...newUser,
                              permissions: [
                                ...newUser.permissions,
                                permission.id,
                              ],
                            });
                          } else {
                            setNewUser({
                              ...newUser,
                              permissions: newUser.permissions.filter(
                                (p) => p !== permission.id
                              ),
                            });
                          }
                        }}
                        className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded"
                      />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {permission.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-6 py-3 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
