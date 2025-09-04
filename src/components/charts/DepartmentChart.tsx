import React from "react";

interface DepartmentChartProps {
  data: Record<string, number>;
}

const DepartmentChart: React.FC<DepartmentChartProps> = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 dark:text-slate-400">
        <p>No department data available</p>
      </div>
    );
  }

  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  const sortedData = Object.entries(data).sort(([, a], [, b]) => b - a);

  const colors = [
    { bg: "bg-slate-600", border: "border-slate-600", text: "text-slate-600" },
    {
      bg: "bg-emerald-600",
      border: "border-emerald-600",
      text: "text-emerald-600",
    },
    { bg: "bg-blue-600", border: "border-blue-600", text: "text-blue-600" },
    {
      bg: "bg-violet-600",
      border: "border-violet-600",
      text: "text-violet-600",
    },
    { bg: "bg-amber-600", border: "border-amber-600", text: "text-amber-600" },
    { bg: "bg-red-600", border: "border-red-600", text: "text-red-600" },
    { bg: "bg-pink-600", border: "border-pink-600", text: "text-pink-600" },
    {
      bg: "bg-indigo-600",
      border: "border-indigo-600",
      text: "text-indigo-600",
    },
    { bg: "bg-teal-600", border: "border-teal-600", text: "text-teal-600" },
    {
      bg: "bg-orange-600",
      border: "border-orange-600",
      text: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Distribution by Department
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {total} total employees
        </span>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-3 sm:space-y-4">
        {sortedData.map(([department, count], index) => {
          const percentage = (count / total) * 100;
          const colorSet = colors[index % colors.length];

          return (
            <div key={department} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${colorSet.bg}`}></div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                    {department}
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {count}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 sm:h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${colorSet.bg} group-hover:opacity-80 relative`}
                  style={{ width: `${percentage}%` }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
                </div>

                {/* Percentage label inside bar for larger percentages */}
                {percentage > 15 && (
                  <div className="absolute inset-0 flex items-center pl-3">
                    <span className="text-xs font-semibold text-white">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Department Insights */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {sortedData[0]?.[1] || 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Largest Dept
          </div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">
            {sortedData[0]?.[0] || "N/A"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {Object.keys(data).length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total Depts
          </div>
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Active
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-400 font-medium text-sm sm:text-base">
            Total Employees
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-lg sm:text-xl">
            {total}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Distributed across {Object.keys(data).length} departments
        </div>
      </div>
    </div>
  );
};

export default DepartmentChart;
