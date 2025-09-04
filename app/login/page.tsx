"use client";
import { useState } from "react";
import { Waves, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../../src/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const success = await login(email, password);
    if (!success) {
      setError("Invalid email or password. Please try again.");
    }
    setIsLoading(false);
  };

  const demoAccounts = [
    { email: "owner@enjoydive.com", password: "owner123", role: "Owner" },
    { email: "admin@enjoydive.com", password: "admin123", role: "Admin" },
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Side - Branding */}
        <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left space-y-6 lg:space-y-8 order-2 lg:order-1">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-4 lg:p-6 rounded-2xl lg:rounded-3xl shadow-2xl">
              <Waves className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 dark:text-white">
                Enjoy Dive
              </h1>
              <p className="text-lg sm:text-xl lg:text-xl xl:text-2xl text-slate-600 dark:text-slate-400 mt-2">
                Premier Diving Center
              </p>
            </div>
          </div>
          <div className="space-y-4 lg:space-y-6 max-w-md lg:max-w-lg">
            <h2 className="text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-bold text-slate-800 dark:text-slate-200">
              Payroll Management System
            </h2>
            <p className="text-base lg:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              Streamline your dive center operations with our comprehensive payroll management solution. Manage 33+ staff members across all departments with ease.
            </p>
            <div className="grid grid-cols-2 gap-4 lg:gap-6 pt-4 lg:pt-6">
              <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">33+</div>
                <div className="text-sm lg:text-base text-slate-600 dark:text-slate-400">Employees</div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 lg:p-6 rounded-xl lg:rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                <div className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">9</div>
                <div className="text-sm lg:text-base text-slate-600 dark:text-slate-400">Departments</div>
              </div>
            </div>
          </div>
        </div>
        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center order-1 lg:order-2">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-slate-800 rounded-2xl lg:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 lg:p-8 xl:p-10">
              <div className="text-center mb-6 lg:mb-8">
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm lg:text-base">Sign in to access your dashboard</p>
              </div>
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 text-base"
                      placeholder="Enter your password"
                      required
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
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-base"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </form>
              {/* Demo Accounts */}
              <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">Demo Accounts</p>
                <div className="space-y-3">
                  {demoAccounts.map((account, index) => (
                    <button
                      key={index}
                      onClick={() => fillDemoAccount(account.email, account.password)}
                      className="w-full p-3 text-left bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-600"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{account.role}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{account.email}</p>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{account.password}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
