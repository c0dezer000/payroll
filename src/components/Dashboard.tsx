import React, { useState } from "react";
import {
	Users,
	DollarSign,
	TrendingUp,
	Calendar,
	Waves,
	MapPin,
	Phone,
	Mail,
	Download,
	RefreshCw,
	ArrowUpRight,
	ArrowDownRight,
	Activity,
	Target,
	Building,
	Briefcase,
	FileText,
	MessageSquare,
} from "lucide-react";
import { useDashboardData } from "../hooks/useDashboardData";
import { formatCurrency, getCurrentPeriod } from "../utils/payroll";
import { ensureHolidaysHydrated } from "../utils/holidays";
import DepartmentChart from "./charts/DepartmentChart";
import ReportsModal from "./modals/ReportsModal";

const Dashboard: React.FC = () => {
	const { stats, loading } = useDashboardData();
	// Company settings (phone, name, tagline, address, email) read from localStorage so Settings changes apply live
	const [companyState, setCompanyState] = React.useState({
		name: "Bayani Solutions",
		tagline: "Payroll & HR Solutions for Filipinos",
		address: "Ortigas Center, Pasig City, Metro Manila",
		phone: "+63 2 8888 1234",
		email: "info@bayanisolutions.com",
	});

	React.useEffect(() => {
		const load = () => {
			try {
				if (typeof window !== 'undefined') {
					const raw = localStorage.getItem('companySettings');
					if (raw) {
						const parsed = JSON.parse(raw);
						setCompanyState({
							name: parsed.name || 'Bayani Solutions',
							tagline: parsed.tagline || 'Payroll & HR Solutions for Filipinos',
							address: parsed.address || 'Ortigas Center, Pasig City, Metro Manila',
							phone: parsed.phone || '+63 2 8888 1234',
							email: parsed.email || 'info@bayanisolutions.com',
						});
					}
				}
			} catch (e) {
				// ignore and keep defaults
			}
		};

		load();
		const handler = () => load();
		if (typeof window !== 'undefined') window.addEventListener('companySettingsChanged', handler);
		return () => { if (typeof window !== 'undefined') window.removeEventListener('companySettingsChanged', handler); };
	}, []);

	// Hydrate public Philippine holidays for client-side payroll logic
	React.useEffect(() => {
		// fire-and-forget
		ensureHolidaysHydrated().catch(() => {
			// ignore
		});
	}, []);

	// Company settings (phone, name, email) read from localStorage so Settings changes apply live
	const [company, setCompany] = React.useState({
		name: "Bayani Solutions",
		address: "Ortigas Center, Pasig City, Metro Manila",
		phone: "+63 2 8888 1234",
		email: "info@bayanisolutions.com",
	});

	React.useEffect(() => {
		const load = () => {
			try {
				if (typeof window !== "undefined") {
					const raw = localStorage.getItem("companySettings");
					if (raw) setCompany(JSON.parse(raw));
				}
			} catch (e) {
				// ignore parse errors
			}
		};

		load();

		const handler = () => load();
		if (typeof window !== "undefined") window.addEventListener("companySettingsChanged", handler);
		return () => {
			if (typeof window !== "undefined") window.removeEventListener("companySettingsChanged", handler);
		};
	}, []);
	const [showReports, setShowReports] = useState(false);
	const [refreshing, setRefreshing] = useState(false);

	const handleRefresh = async () => {
		setRefreshing(true);
		// Simulate refresh delay
		await new Promise((resolve) => setTimeout(resolve, 1500));
		window.location.reload(); // Refresh the page to get new data
	};

	const handleQuickAction = (action: string) => {
		switch (action) {
			case "payroll":
				// Navigate to payroll processing
				window.location.hash = "#/payroll";
				break;
			case "employees":
				// Navigate to employee management
				window.location.hash = "#/employees";
				break;
			case "reports":
				setShowReports(true);
				break;
			case "payslips":
				// Navigate to payslip generator
				window.location.hash = "#/payslips";
				break;
			case "whatsapp":
				// Navigate to WhatsApp integration
				window.location.hash = "#/whatsapp";
				break;
			default:
				break;
		}
	};

	if (loading || !stats) {
		return (
			<div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-6 lg:space-y-8">
				<div className="animate-pulse">
					{/* Header skeleton */}
					<div className="bg-slate-200 dark:bg-slate-700 rounded-2xl lg:rounded-3xl h-32 sm:h-40 lg:h-48 mb-6 lg:mb-8"></div>

					{/* Cards skeleton */}
					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 lg:mb-8">
						{[...Array(4)].map((_, i) => (
							<div
								key={i}
								className="bg-slate-200 dark:bg-slate-700 rounded-xl lg:rounded-2xl h-24 sm:h-28 lg:h-32"
							></div>
						))}
					</div>

					{/* Charts skeleton */}
					<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
						<div className="xl:col-span-2 bg-slate-200 dark:bg-slate-700 rounded-xl lg:rounded-2xl h-64 lg:h-80"></div>
						<div className="bg-slate-200 dark:bg-slate-700 rounded-xl lg:rounded-2xl h-64 lg:h-80"></div>
					</div>
				</div>
			</div>
		);
	}

	const currentPeriod = getCurrentPeriod();
	const previousMonthPayroll =
		stats.payrollHistory && stats.payrollHistory.length >= 2
			? stats.payrollHistory[stats.payrollHistory.length - 2]?.totalAmount || 0
			: 0;
	const payrollGrowth =
		previousMonthPayroll > 0
			? ((stats.totalPayroll - previousMonthPayroll) / previousMonthPayroll) * 100
			: 0;

	// Calculate additional metrics
	const avgSalary =
		stats.activeEmployees && stats.activeEmployees > 0
			? Math.round(stats.totalPayroll / stats.activeEmployees)
			: 0;
	const deptEntries = Object.entries(stats.departmentStats || {});
	const largestDepartment = deptEntries.length
		? deptEntries.reduce((a, b) => (a[1] > b[1] ? a : b))
		: ["-", 0];
	const recentTrend = stats.monthlyTrend.slice(-3);
	const trendDirection =
		recentTrend.length >= 2
			? recentTrend[recentTrend.length - 1].amount >
				recentTrend[recentTrend.length - 2].amount
				? "up"
				: "down"
			: "stable";

	return (
		<div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-6 sm:space-y-8 lg:space-y-12">
			{/* Company Header */}
			<div className="bg-white dark:bg-slate-900 rounded-2xl lg:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 text-slate-900 dark:text-white shadow-lg border border-slate-200 dark:border-slate-700">
				<div className="flex flex-col space-y-6 lg:space-y-8">
					<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-6 sm:space-y-0">
						<div className="flex-1">
							<div className="flex items-center space-x-4 sm:space-x-6 mb-4 sm:mb-6">
								<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
									<Waves className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-slate-600 dark:text-slate-400" />
								</div>
								<div>
									<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-900 dark:text-white">
										{companyState.name}
										</h1>
										<p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg lg:text-xl mt-1">
											{companyState.tagline}
										</p>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 text-sm sm:text-base">
								<div className="flex items-center space-x-3">
									<MapPin className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-slate-600 dark:text-slate-400" />
										<span className="text-slate-900 dark:text-slate-200 truncate">
												{companyState.address}
											</span>
								</div>
								<div className="flex items-center space-x-3">
									<Phone className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-slate-600 dark:text-slate-400" />
									<span className="text-slate-900 dark:text-slate-200">{companyState.phone}</span>
								</div>
								<div className="flex items-center space-x-3 md:col-span-2 xl:col-span-1">
									<Mail className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-slate-600 dark:text-slate-400" />
									<span className="text-slate-900 dark:text-slate-200 truncate">
										{companyState.email}
									</span>
								</div>
							</div>
						</div>

							<div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
							<div className="text-center sm:text-right">
								<p className="text-slate-500 dark:text-slate-400 text-sm">Payroll Period</p>
								<p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 text-slate-900 dark:text-white">
									{currentPeriod}
								</p>
								<p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
									{trendDirection === "up"
										? "↗ Trending Up"
										: trendDirection === "down"
										? "↘ Trending Down"
										: "→ Stable"}
								</p>
							</div>
							<div className="flex justify-center sm:justify-start space-x-3">
								<button
									onClick={handleRefresh}
									disabled={refreshing}
									className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-xl transition-all duration-200 disabled:opacity-50"
									title="Refresh Data"
								>
									<RefreshCw
										className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
									/>
								</button>
								<button
									onClick={() => setShowReports(true)}
									className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2"
								>
									<Download className="h-5 w-5" />
									<span className="font-medium">Reports</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Key Metrics */}
			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
				{/* Total Employees Card */}
				<div
					className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group cursor-pointer"
					onClick={() => handleQuickAction("employees")}
				>
					<div className="flex flex-col space-y-4">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								<p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
									Total Employees
								</p>
							</div>
							<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
								<Users className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
							</div>
						</div>

						<div className="flex-1">
							<p className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-none">
								{stats.totalEmployees}
							</p>
						</div>

						<div className="flex items-center space-x-2 pt-2">
							<span className="text-emerald-600 text-sm font-semibold">
								{stats.activeEmployees} Active
							</span>
							<span className="text-slate-400 text-sm">
								(
								{stats.totalEmployees && stats.totalEmployees > 0
									? Math.round((stats.activeEmployees / stats.totalEmployees) * 100)
									: 0}
								%)
							</span>
						</div>
					</div>
				</div>

				{/* Monthly Payroll Card */}
				<div
					className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group cursor-pointer"
					onClick={() => handleQuickAction("payroll")}
				>
					<div className="flex flex-col space-y-4">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								<p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
									Monthly Payroll
								</p>
							</div>
							<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
								<DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
							</div>
						</div>

						<div className="flex-1">
							<p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-none break-words">
								{formatCurrency(stats.totalPayroll)}
							</p>
						</div>

						<div className="flex items-center space-x-2 pt-2">
							{payrollGrowth >= 0 ? (
								<ArrowUpRight className="h-4 w-4 text-emerald-500 flex-shrink-0" />
							) : (
								<ArrowDownRight className="h-4 w-4 text-red-500 flex-shrink-0" />
							)}
							<span
								className={`text-sm font-semibold ${
									payrollGrowth >= 0 ? "text-emerald-500" : "text-red-500"
								}`}
							>
								{payrollGrowth >= 0 ? "+" : ""}
								{payrollGrowth.toFixed(1)}% from last month
							</span>
						</div>
					</div>
				</div>

				{/* Departments Card */}
				<div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group">
					<div className="flex flex-col space-y-4">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								<p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
									Departments
								</p>
							</div>
							<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
								<Building className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
							</div>
						</div>

						<div className="flex-1">
							<p className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-none">
								{Object.keys(stats.departmentStats).length}
							</p>
						</div>

						<div className="pt-2">
							<span className="text-slate-500 dark:text-slate-400 text-sm">
								Largest: {largestDepartment[0]} ({largestDepartment[1]})
							</span>
						</div>
					</div>
				</div>

				{/* Average Salary Card */}
				<div
					className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 lg:p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group cursor-pointer"
					onClick={() => handleQuickAction("payslips")}
				>
					<div className="flex flex-col space-y-4">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								<p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-2">
									Avg. Salary
								</p>
							</div>
							<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
								<TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
							</div>
						</div>

						<div className="flex-1">
							<p className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-none break-words">
								{formatCurrency(avgSalary)}
							</p>
						</div>

						<div className="pt-2">
							<span className="text-slate-500 dark:text-slate-400 text-sm">
								Per employee
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Enhanced Department Chart and Quick Stats */}
			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
				{/* Department Distribution Chart */}
				<div className="xl:col-span-2 bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border border-slate-200 dark:border-slate-700">
					<div className="mb-6 sm:mb-8">
						<h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">
							Department Distribution
						</h3>
						<p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
							Employee allocation across departments
						</p>
					</div>
					<DepartmentChart data={stats.departmentStats} />
				</div>

				{/* Quick Stats Panel */}
				<div className="space-y-6">
					{/* Payroll Summary */}
					<div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
						<div className="flex items-center space-x-3 mb-4">
							<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
								<DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
							</div>
							<h4 className="font-bold text-slate-900 dark:text-white">
								Payroll Summary
							</h4>
						</div>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-slate-500 dark:text-slate-400 text-sm">
									Current Period
								</span>
								<span className="font-bold text-slate-900 dark:text-white">
									{currentPeriod}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-slate-500 dark:text-slate-400 text-sm">
									Total Amount
								</span>
								<span className="font-bold text-slate-900 dark:text-white">
											{formatCurrency(stats.totalPayroll)}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-slate-500 dark:text-slate-400 text-sm">
									Per Employee
								</span>
								<span className="font-bold text-slate-900 dark:text-white">
									{formatCurrency(avgSalary)}
								</span>
							</div>
						</div>
					</div>

					{/* Performance Metrics */}
					<div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
						<div className="flex items-center space-x-3 mb-4">
							<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
								<Target className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
							</div>
							<h4 className="font-bold text-slate-900 dark:text-white">
								Performance
							</h4>
						</div>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-slate-500 dark:text-slate-400 text-sm">
									Employee Retention
								</span>
								<span className="font-bold text-slate-900 dark:text-white">
									98%
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-slate-500 dark:text-slate-400 text-sm">
									Payroll Accuracy
								</span>
								<span className="font-bold text-slate-900 dark:text-white">
									100%
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-slate-500 dark:text-slate-400 text-sm">
									On-time Processing
								</span>
								<span className="font-bold text-slate-900 dark:text-white">
									100%
								</span>
							</div>
						</div>
					</div>

					{/* Quick Actions */}
					<div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
						<h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center space-x-2">
							<Briefcase className="h-5 w-5" />
							<span>Quick Actions</span>
						</h4>
						<div className="space-y-3">
							<button
								onClick={() => handleQuickAction("payroll")}
								className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-3 rounded-lg text-left transition-colors"
							>
								<div className="flex items-center space-x-3">
									<Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
									<span className="text-sm font-medium text-slate-900 dark:text-white">
										Process Payroll
									</span>
								</div>
							</button>
							<button
								onClick={() => handleQuickAction("employees")}
								className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-3 rounded-lg text-left transition-colors"
							>
								<div className="flex items-center space-x-3">
									<Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
									<span className="text-sm font-medium text-slate-900 dark:text-white">
										Manage Employees
									</span>
								</div>
							</button>
							<button
								onClick={() => handleQuickAction("payslips")}
								className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-3 rounded-lg text-left transition-colors"
							>
								<div className="flex items-center space-x-3">
									<FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
									<span className="text-sm font-medium text-slate-900 dark:text-white">
										Generate Pay Slips
									</span>
								</div>
							</button>
							<button
								onClick={() => handleQuickAction("whatsapp")}
								className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-3 rounded-lg text-left transition-colors"
							>
								<div className="flex items-center space-x-3">
									<MessageSquare className="h-4 w-4 text-slate-600 dark:text-slate-400" />
									<span className="text-sm font-medium text-slate-900 dark:text-white">
										WhatsApp Integration
									</span>
								</div>
							</button>
							<button
								onClick={() => handleQuickAction("reports")}
								className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-3 rounded-lg text-left transition-colors"
							>
								<div className="flex items-center space-x-3">
									<Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
									<span className="text-sm font-medium text-slate-900 dark:text-white">
										Generate Reports
									</span>
								</div>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Department Breakdown */}
			<div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border border-slate-200 dark:border-slate-700">
				<h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">
					Department Overview
				</h3>
				<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
					{Object.entries(stats.departmentStats).map(([department, count]) => (
						<div
							key={department}
							className="text-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all duration-200 group cursor-pointer"
							onClick={() => handleQuickAction("employees")}
						>
							<p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
								{count}
							</p>
							<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-tight font-medium">
								{department}
							</p>
						</div>
					))}
				</div>
			</div>

			{/* Recent Activity */}
			<div className="bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-10 shadow-lg border border-slate-200 dark:border-slate-700">
				<h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-6 sm:mb-8">
					Recent Activity
				</h3>
				<div className="space-y-4 sm:space-y-6">
					<div
						className="flex items-start space-x-4 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer"
						onClick={() => handleQuickAction("payroll")}
					>
						<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
							<Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
								Payroll processed for {currentPeriod}
							</p>
							<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
								All {stats.activeEmployees} employees processed successfully •
								Total: {formatCurrency(stats.totalPayroll)}
							</p>
						</div>
						<span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-shrink-0 font-medium">
							2 hours ago
						</span>
					</div>

					<div
						className="flex items-start space-x-4 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer"
						onClick={() => handleQuickAction("whatsapp")}
					>
						<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
							<MessageSquare className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
								WhatsApp notifications sent
							</p>
							<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
								{stats.activeEmployees} pay slips delivered via WhatsApp • 100%
								delivery rate
							</p>
						</div>
						<span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-shrink-0 font-medium">
							3 hours ago
						</span>
					</div>

					<div
						className="flex items-start space-x-4 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer"
						onClick={() => handleQuickAction("employees")}
					>
						<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
							<Users className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
								New employee added
							</p>
								<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
								Ketut Widiastuti joined Cleaning Service • Employee ID: EMP033
							</p>
						</div>
						<span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-shrink-0 font-medium">
							1 day ago
						</span>
					</div>

					<div className="flex items-start space-x-4 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
						<div className="bg-slate-100 dark:bg-slate-700 p-3 lg:p-4 rounded-xl group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
							<Activity className="h-6 w-6 lg:h-8 lg:w-8 text-slate-600 dark:text-slate-400" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base">
								System performance optimized
							</p>
							<p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
								Dashboard loading time improved by 40% • All components now
								optimized
							</p>
						</div>
						<span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex-shrink-0 font-medium">
							2 days ago
						</span>
					</div>
				</div>
			</div>

			{/* Reports Modal */}
			{showReports && (
				<ReportsModal
					isOpen={showReports}
					onClose={() => setShowReports(false)}
					dashboardStats={stats}
				/>
			)}
		</div>
	);
};

export default Dashboard;
