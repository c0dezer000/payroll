import {
	Calendar,
	Play,
	CheckCircle,
	AlertCircle,
	DollarSign,
	Users,
	Clock,
	TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react"; // Combined import
import type { Employee } from "../types";
import {
	formatCurrency,
	getCurrentPeriod,
	calculatePayroll,
	type AttendancePeriod,
} from "../utils/payroll";

interface ProcessingStatus {
	employeeId: string;
	status: "pending" | "processing" | "completed" | "error";
	progress: number;
}

const PayrollProcessing: React.FC = () => {

	const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingStatus, setProcessingStatus] = useState<ProcessingStatus[]>([]);
	const [completedProcessing, setCompletedProcessing] = useState(false);
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [loading, setLoading] = useState(true);
	const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendancePeriod | null>>({});

	useEffect(() => {
		let mounted = true;
		const fetchEmployees = async () => {
			try {
				const res = await fetch('/api/employees');
				if (!res.ok) throw new Error('Failed to fetch employees');
				const data = await res.json();
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

	// Fetch attendance for all employees when period or employees change
	useEffect(() => {
		let mounted = true;
		if (employees.length === 0 || !selectedPeriod) return;
		const fetchAllAttendance = async () => {
			const [mStr, yStr] = selectedPeriod.split("/");
			const monthNum = Number(mStr);
			const yearNum = Number(yStr);
			if (!monthNum || !yearNum) return;
			const start = new Date(yearNum, monthNum - 1, 1);
			const end = new Date(yearNum, monthNum, 0);
			const workDaysCount = (s: Date, e: Date) => {
				let d = new Date(s);
				let count = 0;
				while (d <= e) {
					const day = d.getDay();
					if (day >= 1 && day <= 5) count++;
					d.setDate(d.getDate() + 1);
				}
				return count;
			};
			const wd = workDaysCount(start, end);
			const map: Record<string, AttendancePeriod | null> = {};
			for (const emp of employees) {
				try {
					const res = await fetch(`/api/attendance?employeeId=${encodeURIComponent(emp.id)}&start=${start.toISOString().slice(0,10)}&end=${end.toISOString().slice(0,10)}`);
					if (!res.ok) { map[emp.id] = null; continue; }
					const data = await res.json();
					const records = Array.isArray(data) ? data : [];
					const totalOvertime = records.reduce((s: number, r: any) => s + (Number(r.overtimeHours) || 0), 0);
					const daysPresent = records.filter((r: any) => r.status === 'present' || (Number(r.hoursWorked) || 0) > 0).length;
					map[emp.id] = {
						workDays: wd,
						daysPresent,
						overtimeHours: Math.round(totalOvertime * 100) / 100,
						expectedHours: wd * 8,
					};
				} catch (err) {
					console.error('Error fetching attendance for', emp.id, err);
					map[emp.id] = null;
				}
			}
			if (mounted) setAttendanceMap(map);
		};
		fetchAllAttendance();
		return () => { mounted = false };
	}, [employees, selectedPeriod]);

		// totalPayroll is computed only during processing and stored in state
		const [computedPayrolls, setComputedPayrolls] = useState<Record<string, { netSalary: number; payslip: any }>>({});
		const [computedTotalPayroll, setComputedTotalPayroll] = useState<number>(0);

	const completedCount = processingStatus.filter((s) => s.status === "completed").length;
	const overallProgress = employees.length > 0 ? (completedCount / employees.length) * 100 : 0;

	const startProcessing = async () => {
		setIsProcessing(true);
		setCompletedProcessing(false);
		setComputedPayrolls({});
		setComputedTotalPayroll(0);

		const initialStatus = employees.map((emp) => ({
			employeeId: emp.id,
			status: "pending" as const,
			progress: 0,
		}));
		setProcessingStatus(initialStatus);

		// determine period start/end
		const [mStr, yStr] = selectedPeriod.split("/");
		const monthNum = Number(mStr);
		const yearNum = Number(yStr);
		const start = new Date(yearNum, monthNum - 1, 1);
		const end = new Date(yearNum, monthNum, 0);

		const fetchAttendanceFor = async (empId: string) => {
			try {
				const res = await fetch(`/api/attendance?employeeId=${encodeURIComponent(empId)}&start=${start.toISOString().slice(0,10)}&end=${end.toISOString().slice(0,10)}`);
				if (!res.ok) return null;
				const data = await res.json();
				const records = Array.isArray(data) ? data : [];
				const totalOvertime = records.reduce((s: number, r: any) => s + (Number(r.overtimeHours) || 0), 0);
				const daysPresent = records.filter((r: any) => r.status === 'present' || (Number(r.hoursWorked) || 0) > 0).length;

				const workDaysCount = (s: Date, e: Date) => {
					let d = new Date(s);
					let count = 0;
					while (d <= e) {
						const day = d.getDay();
						if (day >= 1 && day <= 5) count++;
						d.setDate(d.getDate() + 1);
					}
					return count;
				};
				const wd = workDaysCount(start, end);

				return {
					workDays: wd,
					daysPresent,
					overtimeHours: Math.round(totalOvertime * 100) / 100,
					expectedHours: wd * 8,
				} as AttendancePeriod;
			} catch (err) {
				console.error('Error fetching attendance for', empId, err);
				return null;
			}
		};

		const newComputed: Record<string, { netSalary: number; payslip: any }> = {};
		for (let i = 0; i < employees.length; i++) {
			const employee = employees[i];

			setProcessingStatus((prev) =>
				prev.map((status) =>
					status.employeeId === employee.id
						? { ...status, status: "processing", progress: 25 }
						: status
				)
			);

			const attendance = await fetchAttendanceFor(employee.id);

			const payslip = calculatePayroll(employee, selectedPeriod, attendance ?? null);
			newComputed[employee.id] = { netSalary: payslip.netSalary, payslip };

			// small delay to keep UI responsive
			await new Promise((resolve) => setTimeout(resolve, 150));
			setProcessingStatus((prev) =>
				prev.map((status) =>
					status.employeeId === employee.id
						? { ...status, progress: 75 }
						: status
				)
			);

			setProcessingStatus((prev) =>
				prev.map((status) =>
					status.employeeId === employee.id
						? { ...status, status: "completed", progress: 100 }
						: status
				)
			);
		}

		setComputedPayrolls(newComputed);
		const total = Object.values(newComputed).reduce((s, v) => s + (v?.netSalary || 0), 0);
		setComputedTotalPayroll(Math.round(total * 100) / 100);

		setIsProcessing(false);
		setCompletedProcessing(true);
	};

	return (
		<div className="p-6 lg:p-8 space-y-8">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold text-slate-900 dark:text-white">Payroll Processing</h2>
					<p className="text-slate-600 dark:text-slate-400 text-lg mt-2">Process monthly salary calculations</p>
				</div>
			</div>

			{/* Processing Controls */}
			<div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 space-y-6 lg:space-y-0">
					<div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
						<div className="flex items-center space-x-3">
							<Calendar className="h-6 w-6 text-slate-400" />
							<span className="text-slate-600 dark:text-slate-400 font-medium">Period:</span>
						</div>
						<select
							value={selectedPeriod}
							onChange={(e) => setSelectedPeriod(e.target.value)}
							disabled={isProcessing}
							className="px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent text-base font-medium"
						>
							<option value={getCurrentPeriod()}>{getCurrentPeriod()}</option>
							<option value="11/2024">11/2024</option>
							<option value="10/2024">10/2024</option>
							<option value="9/2024">9/2024</option>
						</select>
					</div>

					<button
						onClick={startProcessing}
						disabled={isProcessing || completedProcessing}
						className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center space-x-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isProcessing ? (
							<>
								<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
								<span>Processing...</span>
							</>
						) : completedProcessing ? (
							<>
								<CheckCircle className="h-5 w-5" />
								<span>Completed</span>
							</>
						) : (
							<>
								<Play className="h-5 w-5" />
								<span>Start Processing</span>
							</>
						)}
					</button>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<div className="bg-white dark:bg-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-2">Total Employees</p>
								<p className="text-3xl font-bold text-slate-900 dark:text-white">{employees.length}</p>
							</div>
							<Users className="h-8 w-8 text-slate-500" />
						</div>
					</div>

					<div className="bg-white dark:bg-emerald-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mb-2">Total Payroll</p>
								<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{completedProcessing ? formatCurrency(computedTotalPayroll) : '—'}</p>
							</div>
							<DollarSign className="h-8 w-8 text-emerald-500" />
						</div>
					</div>

					<div className="bg-white dark:bg-violet-900/20 rounded-xl p-6 border border-violet-200 dark:border-violet-800">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-violet-600 dark:text-violet-400 text-sm font-medium mb-2">Progress</p>
								<p className="text-3xl font-bold text-violet-700 dark:text-violet-300">{Math.round(overallProgress)}%</p>
							</div>
							<div className="relative">
								<div className="w-8 h-8 bg-violet-200 dark:bg-violet-800 rounded-full flex items-center justify-center">
									<div className="w-6 h-6 bg-violet-500 rounded-full transition-transform duration-300" style={{ transform: `scale(${overallProgress / 100})` }} />
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-amber-600 dark:text-amber-400 text-sm font-medium mb-2">Avg. Salary</p>
								<p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{completedProcessing && employees.length > 0 ? formatCurrency(Math.round(computedTotalPayroll / employees.length)) : '—'}</p>
							</div>
							<TrendingUp className="h-8 w-8 text-amber-500" />
						</div>
					</div>
				</div>

				{/* Overall Progress Bar */}
				{(isProcessing || completedProcessing) && (
					<div className="mb-8">
						<div className="flex items-center justify-between mb-3">
							<span className="text-base font-semibold text-slate-700 dark:text-slate-300">Overall Progress</span>
							<span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{completedCount} / {employees.length}</span>
						</div>
						<div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
							<div className="bg-gradient-to-r from-slate-600 to-slate-800 h-4 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
						</div>
					</div>
				)}
			</div>

			{/* Processing Status */}
			{(isProcessing || completedProcessing) && (
				<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
					<div className="p-8 border-b border-slate-200 dark:border-slate-700">
						<h3 className="text-xl font-bold text-slate-900 dark:text-white">Processing Status</h3>
					</div>
					<div className="max-h-96 overflow-y-auto">
						{processingStatus.map((status) => {
							const employee = employees.find((emp) => emp.id === status.employeeId);
							if (!employee) return null;

							return (
								<div key={status.employeeId} className="p-6 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center space-x-4">
											<div className="bg-gradient-to-br from-slate-600 to-slate-800 p-3 rounded-xl text-white font-bold text-sm">
												{employee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
											</div>
											<div>
												<p className="font-semibold text-slate-900 dark:text-white text-base">{employee.name}</p>
												<p className="text-sm text-slate-500 dark:text-slate-400">{employee.position}</p>
											</div>
										</div>
										<div className="flex items-center space-x-4">
											{status.status === "completed" && (<CheckCircle className="h-6 w-6 text-emerald-500" />)}
											{status.status === "processing" && (<div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-500 border-t-transparent"></div>)}
											{status.status === "error" && (<AlertCircle className="h-6 w-6 text-red-500" />)}
											{status.status === "pending" && (<Clock className="h-6 w-6 text-slate-400" />)}
											<span className="text-base font-bold text-slate-900 dark:text-white">{formatCurrency(calculatePayroll(employee, selectedPeriod, attendanceMap[employee.id] ?? null).netSalary)}</span>
										</div>
									</div>
									{status.status !== "pending" && (
										<div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
											<div className="bg-gradient-to-r from-slate-600 to-slate-800 h-3 rounded-full transition-all duration-500" style={{ width: `${status.progress}%` }} />
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

export default PayrollProcessing;
