import React, { useMemo, useState } from "react";
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building,
  DollarSign,
  X,
  Save,
  AlertCircle,
  Star,
} from "lucide-react";
import { employees as seedEmployees } from "../data/employees";
import { type Employee } from "../types";
import { formatCurrency, formatDate } from "../utils/payroll";

interface EmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  mode: "view" | "edit" | "add";
  onClose: () => void;
  onSave: (employee: Employee) => void;
  onDelete?: (employeeId: string) => void;
}

const emptyEmployee = (): Employee => ({
  id: "",
  name: "",
  dateOfBirth: "",
  maritalStatus: "",
  email: "",
  phone: "",
  address: "",
  position: "",
  department: "",
  joinDate: new Date().toISOString().split("T")[0],
  employmentType: "",
  baseSalary: 0,
  overtimeRate: 0,
  payrollFrequency: "",
  bankAccount: "",
  status: "active",
  sssNumber: "",
  philHealthNumber: "",
  pagIbigNumber: "",
  tin: "",
  taxStatus: "",
  // optional extras used in UI
  isManagement: false as any,
  religion: "" as any,
});

const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  isOpen,
  mode,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Employee>(employee ?? emptyEmployee());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  React.useEffect(() => {
    setFormData(employee ?? emptyEmployee());
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const title = mode === "view" ? "Employee Details" : mode === "edit" ? "Edit Employee" : "Add New Employee";

  const handleSave = () => {
    onSave(formData);
  };

  const handleDelete = () => {
    if (employee && onDelete) {
      onDelete(employee.id);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
  <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
              {employee && (
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {employee.id} • {employee.position}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {mode === "view" && employee && onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-160px)]">
            <div className="grid grid-cols-1 gap-8">
              {/* Left column - Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Employee ID */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employee ID *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.id}</p>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.id}
                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter employee ID"
                      />
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.name}</p>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter full name"
                      />
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date of Birth *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.dateOfBirth}</p>
                    ) : (
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    )}
                  </div>

                  {/* Marital Status */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Marital Status *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.maritalStatus}</p>
                    ) : (
                      <select
                        required
                        value={formData.maritalStatus}
                        onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select marital status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.email}</p>
                    ) : (
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter email address"
                      />
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.phone}</p>
                    ) : (
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter phone number"
                      />
                    )}
                  </div>

                  {/* Address (full width) */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Address *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.address}</p>
                    ) : (
                      <textarea
                        required
                        rows={3}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter full address"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Middle column - Employment Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                  Employment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Position */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Position *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.position}</p>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Enter position"
                      />
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Department *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.department}</p>
                    ) : (
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select department</option>
                        <option value="Human Resources">Human Resources</option>
                        <option value="Finance">Finance</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="Operations">Operations</option>
                        <option value="Legal">Legal</option>
                      </select>
                    )}
                  </div>

                  {/* Join Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Join Date *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formatDate(formData.joinDate)}</p>
                    ) : (
                      <input
                        type="date"
                        required
                        value={formData.joinDate}
                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      />
                    )}
                  </div>

                  {/* Employment Type */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employment Type *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.employmentType}</p>
                    ) : (
                      <select
                        required
                        value={formData.employmentType}
                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select employment type</option>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Contract">Contract</option>
                        <option value="Temporary">Temporary</option>
                        <option value="Intern">Intern</option>
                      </select>
                    )}
                  </div>

                  {/* Base Salary */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Base Salary *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formatCurrency(formData.baseSalary)}</p>
                    ) : (
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.baseSalary}
                        onChange={(e) => setFormData({ ...formData, baseSalary: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Enter base salary"
                      />
                    )}
                  </div>

                  {/* Payroll Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Payroll Frequency *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.payrollFrequency}</p>
                    ) : (
                      <select
                        required
                        value={formData.payrollFrequency}
                        onChange={(e) => setFormData({ ...formData, payrollFrequency: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select frequency</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Bi-weekly">Bi-weekly</option>
                        <option value="Semi-monthly">Semi-monthly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    )}
                  </div>

                  {/* Status (full width) */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status *</label>
                    {mode === "view" ? (
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        formData.status === "active"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {formData.status}
                      </span>
                    ) : (
                      <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column - Banking & Government IDs */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <div className="w-2 h-6 bg-purple-500 rounded-full mr-3"></div>
                  Banking & Government IDs
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bank Account */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bank Account *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.bankAccount}</p>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.bankAccount}
                        onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Enter bank account number"
                      />
                    )}
                  </div>

                  {/* SSS Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SSS Number *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.sssNumber}</p>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.sssNumber}
                        onChange={(e) => setFormData({ ...formData, sssNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="XX-XXXXXXX-X"
                      />
                    )}
                  </div>

                  {/* PhilHealth Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">PhilHealth Number *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.philHealthNumber}</p>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.philHealthNumber}
                        onChange={(e) => setFormData({ ...formData, philHealthNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="XX-XXXXXXXXX-X"
                      />
                    )}
                  </div>

                  {/* Pag-IBIG Number */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pag-IBIG Number *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.pagIbigNumber}</p>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.pagIbigNumber}
                        onChange={(e) => setFormData({ ...formData, pagIbigNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="XXXX-XXXX-XXXX"
                      />
                    )}
                  </div>

                  {/* TIN */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">TIN *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.tin}</p>
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.tin}
                        onChange={(e) => setFormData({ ...formData, tin: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="XXX-XXX-XXX-XXX"
                      />
                    )}
                  </div>

                  {/* Tax Status (full width) */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Tax Status *</label>
                    {mode === "view" ? (
                      <p className="text-slate-900 dark:text-white font-medium">{formData.taxStatus}</p>
                    ) : (
                      <select
                        required
                        value={formData.taxStatus}
                        onChange={(e) => setFormData({ ...formData, taxStatus: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select tax status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Head of Family">Head of Family</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 pb-8 border-t border-slate-200 dark:border-slate-700 relative z-10">
            <div>
              {mode === "view" && employee && (
                <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                  <span>Employee ID: {employee.id}</span>
                  <span>•</span>
                  <span>Joined: {formatDate(employee.joinDate)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                {mode === "view" ? "Close" : "Cancel"}
              </button>
              {mode !== "view" && (
                <button
                  onClick={handleSave}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg relative z-20 min-w-[120px]"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Employee</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && employee && onDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Employee</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete <strong>{employee.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const EmployeeList: React.FC = () => {
  const [employeeList, setEmployeeList] = useState<Employee[]>(seedEmployees as unknown as Employee[]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "add">("add");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const departments = useMemo(() => Array.from(new Set(employeeList.map(e => e.department))).filter(Boolean), [employeeList]);

  const filteredEmployees = useMemo(() => {
    return employeeList.filter(e => {
      const matchesSearch = [e.name, e.position, e.id, e.email].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDept = !selectedDepartment || e.department === selectedDepartment;
      const matchesStatus = !selectedStatus || e.status === selectedStatus;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [employeeList, searchTerm, selectedDepartment, selectedStatus]);

  const handleAddEmployee = () => {
    setModalMode("add");
    setSelectedEmployee(null);
    setShowModal(true);
  };
  const handleViewEmployee = (employee: Employee) => {
    setModalMode("view");
    setSelectedEmployee(employee);
    setShowModal(true);
  };
  const handleEditEmployee = (employee: Employee) => {
    setModalMode("edit");
    setSelectedEmployee(employee);
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);

  const handleSaveEmployee = (emp: Employee) => {
    setEmployeeList(prev => {
      const idx = prev.findIndex(e => e.id === emp.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = emp;
        return copy;
      }
      return [emp, ...prev];
    });
    setShowModal(false);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployeeList(prev => prev.filter(e => e.id !== employeeId));
    setShowModal(false);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
            <Users className="h-8 w-8 text-slate-600 dark:text-slate-400" />
            <span>Employee Management</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your team members and their information
          </p>
        </div>
        <button
          onClick={handleAddEmployee}
          className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 w-full border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Employee Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-200">
            {/* Employee Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                    {employee.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    {employee.id}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  employee.status === "active"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {employee.status}
              </span>
            </div>

            {/* Employee Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <Building className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {employee.position}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {employee.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DollarSign className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatCurrency(employee.baseSalary)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Base Salary
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatDate(employee.joinDate)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Join Date
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {employee.email}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {employee.phone}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                {(employee as any).isManagement && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 rounded-full">
                    <Star className="h-3 w-3 mr-1" />
                    Management
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewEmployee(employee)}
                  className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleEditEmployee(employee)}
                  className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                  title="Edit Employee"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteEmployee(employee.id)}
                  className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  title="Delete Employee"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-12 w-40 h-40 mx-auto mb-6 flex items-center justify-center">
            <Users className="h-16 w-16 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
            No employees found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {searchTerm || selectedDepartment || selectedStatus
              ? "Try adjusting your filters to see more results."
              : "Get started by adding your first employee."}
          </p>
          <button
            onClick={handleAddEmployee}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Add Employee</span>
          </button>
        </div>
      )}

      {/* Employee Modal */}
      <EmployeeModal
        employee={selectedEmployee}
        isOpen={showModal}
        mode={modalMode}
        onClose={handleCloseModal}
        onSave={handleSaveEmployee}
        onDelete={handleDeleteEmployee}
      />
    </div>
  );
};

export default EmployeeList;