import { useState, useEffect } from "react";
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
import { ensureHolidaysHydrated, getCachedHolidaysForYear } from "../utils/holidays";

interface UserRole {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "HR Manager" | "Accountant";
  permissions: string[];
  status: "active" | "inactive";
  lastLogin: string;
  createdAt: string;
  password?: string;
}

interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  tagline?: string;
  logo: string;
}

const Settings: React.FC = () => {
  useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState("general");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // General settings state
  const [systemLanguage, setSystemLanguage] = useState<string>("en");
  const [currency, setCurrency] = useState<string>("PHP");
  const [dateFormat, setDateFormat] = useState<string>("DD/MM/YYYY");
  const [timezone, setTimezone] = useState<string>("Asia/Manila");

  // Company Settings State
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
  name: "Bayani Solutions",
  address: "Ortigas Center, Pasig City, Metro Manila",
  phone: "+63 2 8888 1234",
  email: "info@bayanisolutions.com",
  website: "www.bayanisolutions.com",
  taxId: "TIN.123-456-789",
  tagline: "Payroll & HR Solutions for Filipinos",
  logo: "",
  });

  // Which language to display holidays in (immediate UI control). Defaults to systemLanguage.
  const [displayLanguage, setDisplayLanguage] = useState<string>(systemLanguage);

  // Keep displayLanguage in sync when user changes the System Language select
  // but allow the holiday UI control to override it independently.
  useEffect(() => {
    setDisplayLanguage(systemLanguage);
  }, [systemLanguage]);

  // User Management State
  const [users, setUsers] = useState<UserRole[]>([
    {
      id: "1",
      name: "Made Sutrisno",
      email: "owner@bayanisolutions.com",
      role: "Owner",
      permissions: ["all"],
      status: "active",
      lastLogin: "2024-12-15T10:30:00Z",
      createdAt: "2020-01-15T00:00:00Z",
    },
    {
      id: "2",
      name: "Kadek Sari Dewi",
      email: "admin@bayanisolutions.com",
      role: "Admin",
      permissions: ["payroll", "employees", "reports"],
      status: "active",
      lastLogin: "2024-12-15T09:15:00Z",
      createdAt: "2020-03-01T00:00:00Z",
    },
    {
      id: "3",
      name: "Wayan Agus Pratama",
      email: "hr@bayanisolutions.com",
      role: "HR Manager",
      permissions: ["employees", "reports"],
      status: "active",
      lastLogin: "2024-12-14T16:45:00Z",
      createdAt: "2021-06-15T00:00:00Z",
    },
  ]);

  // Hydrate users from localStorage if present (simple persistence for demo)
  useEffect(() => {
    let cancelled = false;
    // Try to load users from the server first so we use the DB-backed list
    (async () => {
      try {
        const res = await fetch(`/api/users`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data)) {
            setUsers(data);
            try { if (typeof window !== 'undefined') localStorage.setItem('appUsers', JSON.stringify(data)); } catch (e) { /* ignore */ }
            return;
          }
        }
      } catch (e) {
        // server failed, continue to localStorage fallback
        console.warn('Failed to load users from server, falling back to localStorage', e);
      }

      try {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("appUsers");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) setUsers(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load users from localStorage", err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  // Holiday list shown in the Holiday Calendar section. Start with any cached year
  const [holidayList, setHolidayList] = useState(() => {
    try {
      // Attempt to read cached holidays for current year, fall back to built-in defaults
      const cached = typeof window !== "undefined" ? getCachedHolidaysForYear() : [];
      return (cached && cached.length > 0) ? cached : holidayCalendar;
    } catch (err) {
      return holidayCalendar;
    }
  });

  // Add Holiday modal state
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    englishName: "",
    localName: "",
    date: "",
    type: "national",
    allowancePercent: 0,
    isActive: true,
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
    try {
      // Persist company settings locally so other parts of the app can read them
      if (typeof window !== "undefined") {
        localStorage.setItem("companySettings", JSON.stringify(companySettings));
        // notify other parts of the app
        window.dispatchEvent(new Event("companySettingsChanged"));
      }
      // In a real app, this would also save to backend
      alert("Company settings saved successfully!");
    } catch (err) {
      console.error("Failed to save company settings", err);
      alert("Failed to save company settings");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingUser && editingUserId) {
      // Update existing user
      const updatedUsers = users.map((u) =>
        u.id === editingUserId
          ? {
              ...u,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              permissions: newUser.permissions,
              password: newUser.password ? newUser.password : u.password,
            }
          : u
      );
      setUsers(updatedUsers);
      // Try server update first, fall back to localStorage for offline/demo
      try {
        const res = await fetch(`/api/users`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editingUserId, name: newUser.name, email: newUser.email, password: newUser.password, role: newUser.role }) });
        if (!res.ok) throw new Error("Server returned error");
        const payload = await res.json();
        setUsers(updatedUsers);
      } catch (err) {
        console.warn("Server update failed, falling back to localStorage", err);
        try { if (typeof window !== "undefined") localStorage.setItem("appUsers", JSON.stringify(updatedUsers)); } catch (e) { console.error("Failed to persist users to localStorage", e); }
        setUsers(updatedUsers);
      }
      setIsEditingUser(false);
      setEditingUserId(null);
      setShowAddUserModal(false);
      setNewUser({ name: "", email: "", role: "Admin", permissions: [], password: "" });
      return;
    }

    const user: UserRole = {
      id: (users.length + 1).toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.permissions,
      status: "active",
      lastLogin: "Never",
      createdAt: new Date().toISOString(),
  password: newUser.password || undefined,
    };

    const newUsers = [...users, user];
    // Try server create first; fallback to localStorage
    try {
      const res = await fetch(`/api/users`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: user.name, email: user.email, password: newUser.password, role: user.role }) });
      if (!res.ok) throw new Error("Server returned error");
      const payload = await res.json();
      // If created on server, replace temporary id with server id
      if (payload && payload.user && payload.user.id) {
        const serverUser = { ...user, id: payload.user.id };
        const finalUsers = [...users, serverUser];
        setUsers(finalUsers);
        if (typeof window !== "undefined") localStorage.setItem("appUsers", JSON.stringify(finalUsers));
      } else {
        setUsers(newUsers);
        if (typeof window !== "undefined") localStorage.setItem("appUsers", JSON.stringify(newUsers));
      }
    } catch (err) {
      console.warn("Server create failed, falling back to localStorage", err);
      setUsers(newUsers);
      try { if (typeof window !== "undefined") localStorage.setItem("appUsers", JSON.stringify(newUsers)); } catch (e) { console.error("Failed to persist users to localStorage", e); }
    }
    setShowAddUserModal(false);
    setNewUser({ name: "", email: "", role: "Admin", permissions: [], password: "" });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    // Try server delete first
    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(userId)}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers((prev) => {
          const newList = prev.filter((u) => u.id !== userId);
          try { if (typeof window !== 'undefined') localStorage.setItem('appUsers', JSON.stringify(newList)); } catch (e) { /* ignore */ }
          return newList;
        });
        return;
      }
      console.warn('Server returned non-ok deleting user, falling back to local update');
    } catch (err) {
      console.warn('Server delete failed, falling back to local update', err);
    }

    // Fallback: update local state / localStorage
    const newUsers = users.filter((u) => u.id !== userId);
    setUsers(newUsers);
    try { if (typeof window !== 'undefined') localStorage.setItem('appUsers', JSON.stringify(newUsers)); } catch (e) { console.error('Failed to persist users to localStorage', e); }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const updated: UserRole[] = users.map((u) =>
      u.id === userId
        ? { ...u, status: (u.status === 'active' ? 'inactive' : 'active') as UserRole['status'] }
        : u
    ) as UserRole[];
    // Try to persist to server
    try {
      const target = updated.find((u) => u.id === userId);
      if (target) {
        const res = await fetch(`/api/users`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId, status: target.status }) });
        if (res.ok) {
            setUsers(updated);
            try { if (typeof window !== 'undefined') localStorage.setItem('appUsers', JSON.stringify(updated)); } catch (e) { /* ignore */ }
            return;
          }
      }
    } catch (err) {
      console.warn('Server status toggle failed, falling back to local update', err);
    }

  // Fallback local update
  setUsers(updated as UserRole[]);
  try { if (typeof window !== 'undefined') localStorage.setItem('appUsers', JSON.stringify(updated)); } catch (e) { console.error('Failed to persist users to localStorage', e); }
  };

  const formatDateLocal = (dateString: string) => {
    if (dateString === "Never") return "Never";
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("appSettings") : null;
      const parsed = raw ? JSON.parse(raw) : {};
      const locale = parsed.language || "fil-PH";
      // choose month format based on dateFormat preference
      const df = parsed.dateFormat || "DD/MM/YYYY";
      const monthOption: Intl.DateTimeFormatOptions['month'] = df === 'MM/DD/YYYY' ? 'short' : 'long';

      return new Date(dateString).toLocaleString(locale, {
        day: "numeric",
        month: monthOption,
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return new Date(dateString).toLocaleString("fil-PH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
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
                  <button
                    onClick={() => setShowAddHolidayModal(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 sm:px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Holiday</span>
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-end mb-4 space-x-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <label className="text-slate-700 dark:text-slate-300">Display:</label>
                      <select value={displayLanguage} onChange={(e) => setDisplayLanguage(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                        <option value="en">English</option>
                        <option value="local">Local</option>
                      </select>
                    </div>

                    <div>
                    <button
                      onClick={async () => {
                        try {
                          const fetched = await ensureHolidaysHydrated();
                          if (fetched && fetched.length > 0) setHolidayList(fetched);
                          else alert("Could not load Philippine holidays. Using defaults.");
                        } catch (err) {
                          console.error("Failed to load PH holidays", err);
                          alert("Failed to load Philippine holidays. Check console for details.");
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2"
                    >
                      <span>Load Philippine Holidays</span>
                    </button>
                    </div>
                  </div>

                  {holidayList.map((holiday) => (
                    <div
                      key={holiday.id}
                      className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex items-start space-x-4">
                          <div
                            className={`p-3 rounded-xl ${
                              holiday.type === "national"
                                ? "bg-blue-100 dark:bg-blue-900/30"
                                : holiday.type === "special_non_working"
                                ? "bg-amber-100 dark:bg-amber-900/30"
                                : holiday.type === "special_working"
                                ? "bg-yellow-100 dark:bg-yellow-900/30"
                                : holiday.type === "local"
                                ? "bg-green-100 dark:bg-green-900/30"
                                : holiday.type === "anniversary"
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "bg-slate-100 dark:bg-slate-700"
                            }`}
                          >
                            <Gift
                              className={`h-6 w-6 ${
                                holiday.type === "national"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : holiday.type === "special_non_working"
                                  ? "text-amber-600 dark:text-amber-400"
                                  : holiday.type === "special_working"
                                  ? "text-yellow-600 dark:text-yellow-400"
                                  : holiday.type === "local"
                                  ? "text-green-600 dark:text-green-400"
                                  : holiday.type === "anniversary"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-slate-600 dark:text-slate-400"
                              }`}
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">
                              {displayLanguage === "en" ? (holiday.englishName || holiday.name) : (holiday.localName || holiday.name)}
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
                                  {Math.round(holiday.allowanceMultiplier * 100)}% of base salary
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

                {/* Add Holiday Modal */}
                {showAddHolidayModal && (
                  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
                      <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Add Holiday</h2>
                        <button onClick={() => setShowAddHolidayModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                          <X className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500" />
                        </button>
                      </div>

                      <div className="p-6 sm:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">English Name</label>
                            <input type="text" value={holidayForm.englishName} onChange={(e) => setHolidayForm({ ...holidayForm, englishName: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="e.g. Independence Day" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Local Name</label>
                            <input type="text" value={holidayForm.localName} onChange={(e) => setHolidayForm({ ...holidayForm, localName: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="e.g. Araw ng Kalayaan" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date</label>
                            <input type="date" value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type</label>
                            <select value={holidayForm.type} onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                              <option value="national">National</option>
                              <option value="special_non_working">Special Non-Working</option>
                              <option value="special_working">Special Working</option>
                              <option value="local">Local</option>
                              <option value="anniversary">Anniversary</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Allowance (%)</label>
                            <input type="number" value={holidayForm.allowancePercent} onChange={(e) => setHolidayForm({ ...holidayForm, allowancePercent: Number(e.target.value) })} min={0} max={1000} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="e.g. 100 for 100%" />
                          </div>

                          <div className="flex items-center space-x-3">
                            <label className="inline-flex items-center">
                              <input type="checkbox" checked={holidayForm.isActive} onChange={(e) => setHolidayForm({ ...holidayForm, isActive: e.target.checked })} className="h-4 w-4 text-slate-600 focus:ring-slate-500 border-slate-300 rounded" />
                              <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">Active</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <button type="button" onClick={() => setShowAddHolidayModal(false)} className="px-6 py-3 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700">Cancel</button>
                          <button type="button" onClick={async () => {
                            // basic validation
                            if (!holidayForm.date || (!holidayForm.englishName && !holidayForm.localName)) {
                              alert('Please provide at least a name and date for the holiday.');
                              return;
                            }

                            const newHoliday = {
                              id: `manual-${Date.now()}`,
                              name: holidayForm.localName || holidayForm.englishName,
                              localName: holidayForm.localName || holidayForm.englishName,
                              englishName: holidayForm.englishName || holidayForm.localName,
                              date: holidayForm.date,
                              type: (holidayForm.type as any) || 'national',
                              description: holidayForm.englishName || holidayForm.localName || 'Added holiday',
                              allowanceMultiplier: (holidayForm.allowancePercent || 0) / 100,
                              isActive: !!holidayForm.isActive,
                              eligibleReligions: ['all'],
                            } as any;

                            try {
                              // persist to same cache key used by holiday utils
                              const year = new Date(newHoliday.date).getFullYear();
                              const cacheKey = `holidayCache-${year}`;
                              let existing: any[] = [];
                              try {
                                const raw = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
                                if (raw) {
                                  const parsed = JSON.parse(raw);
                                  if (parsed && Array.isArray(parsed.data)) existing = parsed.data;
                                }
                              } catch (e) {
                                // ignore
                              }

                              const combined = [newHoliday, ...existing];
                              if (typeof window !== 'undefined') {
                                (window as any).__APP_HOLIDAYS = combined;
                                localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: combined }));
                              }

                              // update UI
                              setHolidayList((prev) => [newHoliday, ...prev]);
                              setShowAddHolidayModal(false);
                              // reset form
                              setHolidayForm({ englishName: '', localName: '', date: '', type: 'national', allowancePercent: 0, isActive: true });
                            } catch (err) {
                              console.error('Failed to add holiday', err);
                              alert('Failed to add holiday. See console for details.');
                            }
                          }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200">Add Holiday</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-emerald-400 mb-2">
                        Holiday Allowance Information
                      </h4>
                      <ul className="text-sm text-slate-900 dark:text-emerald-300 space-y-1">
                        <li>• National holidays: company policy applies (usually no automatic multiplier)</li>
                        <li>• Special non-working holidays: company may apply an allowance (configurable)</li>
                        <li>• Special working holidays: treated as regular working day unless company policy specifies otherwise</li>
                        <li>• Local holidays: local government holidays may be observed per branch</li>
                        <li>• Company anniversary: configurable bonus percentage</li>
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
                      <select value={systemLanguage} onChange={(e) => setSystemLanguage(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent">
                        <option value="en">English</option>
                        <option value="fil">Filipino</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Currency
                      </label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent">
                        <option value="PHP">Philippine Peso (PHP)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Date Format
                      </label>
                      <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent">
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Timezone
                      </label>
                      <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent">
                        <option value="Asia/Manila">Asia/Manila (PHT)</option>
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        // Load sensible Philippine defaults
                        setSystemLanguage("en");
                        setCurrency("PHP");
                        setDateFormat("DD/MM/YYYY");
                        setTimezone("Asia/Manila");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2"
                    >
                      <span>Load Philippine Defaults (English)</span>
                    </button>

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          try {
                            const settings = {
                              language: systemLanguage,
                              currency,
                              dateFormat,
                              timezone,
                            };
                            if (typeof window !== "undefined") {
                              localStorage.setItem("appSettings", JSON.stringify(settings));
                              // notify other parts of the app to re-read settings
                              window.dispatchEvent(new Event("appSettingsChanged"));
                            }
                            // small UX feedback
                            alert("General settings saved and applied.");
                          } catch (err) {
                            console.error("Failed to save settings", err);
                            alert("Failed to save settings");
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </button>
                    </div>
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
                      Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      value={companySettings.tagline || ""}
                      onChange={(e) =>
                        setCompanySettings({
                          ...companySettings,
                          tagline: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    />
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
                              <button
                                onClick={() => {
                                  setIsEditingUser(true);
                                  setEditingUserId(user.id);
                                  setNewUser({
                                    name: user.name,
                                    email: user.email,
                                    role: user.role as any,
                                    permissions: user.permissions || [],
                                    password: "",
                                  });
                                  setShowAddUserModal(true);
                                }}
                                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                              >
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {isEditingUser ? "Edit User" : "Add New User"}
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
                      required={!isEditingUser}
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
                  {isEditingUser ? "Save Changes" : "Add User"}
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
