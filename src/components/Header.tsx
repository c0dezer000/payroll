"use client";
import { useState } from "react";
import {
	Moon,
	Sun,
	User,
	Bell,
	X,
	Check,
	Clock,
	AlertCircle,
	Menu,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

interface Notification {
	id: string;
	title: string;
	message: string;
	type: "info" | "success" | "warning" | "error";
	time: string;
	read: boolean;
}

interface HeaderProps {
	onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
	const { theme, toggleTheme } = useTheme();
	const { user, logout } = useAuth();
	const [showNotifications, setShowNotifications] = useState(false);
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([
		{
			id: "1",
			title: "Payroll Processed",
			message:
				"December 2024 payroll has been successfully processed for all 33 employees",
			type: "success",
			time: "2 hours ago",
			read: false,
		},
		{
			id: "2",
			title: "WhatsApp Notifications Sent",
			message: "Pay slips have been delivered to all employees via WhatsApp",
			type: "info",
			time: "3 hours ago",
			read: false,
		},
		{
			id: "3",
			title: "New Employee Added",
			message: "Ketut Widiastuti has been added to Cleaning Service department",
			type: "info",
			time: "1 day ago",
			read: true,
		},
		{
			id: "4",
			title: "System Backup Complete",
			message: "Daily system backup completed successfully",
			type: "success",
			time: "1 day ago",
			read: true,
		},
		{
			id: "5",
			title: "Monthly Report Ready",
			message: "November 2024 payroll report is ready for download",
			type: "info",
			time: "2 days ago",
			read: true,
		},
	]);

	const unreadCount = notifications.filter((n) => !n.read).length;

	const markAsRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n))
		);
	};

	const markAllAsRead = () => {
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
	};

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "success":
				return <Check className="h-4 w-4 text-emerald-500" />;
			case "warning":
				return <AlertCircle className="h-4 w-4 text-amber-500" />;
			case "error":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			default:
				return <Clock className="h-4 w-4 text-blue-500" />;
		}
	};

	return (
		<header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
			<div className="flex items-center justify-between">
				{/* Mobile Menu Button */}
				<div className="flex items-center space-x-4">
					<button
						onClick={onMenuClick}
						className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
					>
						<Menu className="h-5 w-5 text-slate-600 dark:text-slate-400" />
					</button>

					<div className="min-w-0 flex-1">
						<h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white truncate">
							Payroll Management
						</h2>
						<p className="text-slate-600 dark:text-slate-400 mt-1 text-xs sm:text-sm lg:text-base hidden sm:block">
							Bali Dive Center Operations
						</p>
					</div>
				</div>

				<div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
					<button
						onClick={toggleTheme}
						className="p-2 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
					>
						{theme === "light" ? (
							<Moon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400" />
						) : (
							<Sun className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400" />
						)}
					</button>

					{/* Notifications */}
					<div className="relative">
						<button
							onClick={() => setShowNotifications(!showNotifications)}
							className="p-2 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 relative"
						>
							<Bell className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 dark:text-slate-400" />
							{unreadCount > 0 && (
								<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold">
									{unreadCount}
								</span>
							)}
						</button>

						{/* Notifications Dropdown */}
						{showNotifications && (
							<div className="absolute right-0 mt-2 w-72 sm:w-80 lg:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 max-h-96 overflow-hidden">
								<div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700">
									<div className="flex items-center justify-between">
										<h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
											Notifications
										</h3>
										<div className="flex items-center space-x-2">
											{unreadCount > 0 && (
												<button
													onClick={markAllAsRead}
													className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
												>
													Mark all read
												</button>
											)}
											<button
												onClick={() => setShowNotifications(false)}
												className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
											>
												<X className="h-4 w-4 text-slate-500" />
											</button>
										</div>
									</div>
								</div>

								<div className="max-h-80 overflow-y-auto">
									{notifications.map((notification) => (
										<div
											key={notification.id}
											className={`p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
												!notification.read
													? "bg-blue-50 dark:bg-blue-900/20"
													: ""
											}`}
											onClick={() => markAsRead(notification.id)}
										>
											<div className="flex items-start space-x-3">
												<div className="flex-shrink-0 mt-1">
													{getNotificationIcon(notification.type)}
												</div>
												<div className="flex-1 min-w-0">
													<div className="flex items-start justify-between">
														<p className="text-sm font-semibold text-slate-900 dark:text-white">
															{notification.title}
														</p>
														{!notification.read && (
															<div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
														)}
													</div>
													<p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
														{notification.message}
													</p>
													<p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
														{notification.time}
													</p>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					{/* User Menu */}
					<div className="relative">
						<button
							onClick={() => setShowUserMenu(!showUserMenu)}
							className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 pl-3 sm:pl-4 lg:pl-6 border-l border-slate-200 dark:border-slate-700"
						>
							<div className="bg-gradient-to-br from-slate-600 to-slate-800 p-2 sm:p-3 rounded-xl">
								<User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
							</div>
							<div className="hidden sm:block text-left">
								<p className="font-semibold text-slate-900 dark:text-white text-sm lg:text-base">
									{user?.name}
								</p>
								<p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400">
									{user?.role}
								</p>
							</div>
						</button>

						{/* User Dropdown */}
						{showUserMenu && (
							<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50">
								<div className="p-4 border-b border-slate-200 dark:border-slate-700">
									<p className="font-semibold text-slate-900 dark:text-white">
										{user?.name}
									</p>
									<p className="text-sm text-slate-500 dark:text-slate-400">
										{user?.email}
									</p>
									<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
										{user?.role}
									</p>
								</div>
								<div className="p-2">
									<button
										onClick={logout}
										className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
									>
										Sign Out
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
