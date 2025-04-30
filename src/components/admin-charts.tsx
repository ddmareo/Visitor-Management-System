"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend, // Import Legend
  CartesianGrid, // Import CartesianGrid for better readability
  Bar,
  Line,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Building2,
  Building,
  BrainCircuit, ArrowUp, ArrowDown, Minus,
} from "lucide-react";

type VisitData = {
  day?: string;
  month?: string;
  visits: number;
};

type DepartmentData = {
  department: string;
  visits: number;
};

type CompanyData = {
  company: string;
  visits: number;
};

type TimeData = {
  time: string;
  visits: number;
};

type Stats = {
  total_visits: number;
  average_visits: number;
  peak_visits: number;
};

// Prediction Data Structure
type WeeklyPredictionPoint = {
  time: Date | string; // Store as Date object initially
  historicalValue: number | null;
  predictedValue: number | null;
};

type CategoryTrend = {
  name: string;
  predictedValue: number;
  trend: 'up' | 'down' | 'stable';
};

type FullPredictionData = {
  weeklyPrediction: {
      data: WeeklyPredictionPoint[];
      message?: string;
  };
  departmentTrends: CategoryTrend[];
  companyTrends: CategoryTrend[];
  error?: string; // General error fetching predictions
};

// Chart Data Point (formatted)
type WeeklyChartDataPoint = {
  weekLabel: string; // Formatted string for XAxis
  historicalValue: number | null;
  predictedValue: number | null;
};

const VisitorDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return selectedPeriod === "monthly"
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      : String(now.getFullYear());
  });

  const [visitData, setVisitData] = useState<VisitData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_visits: 0,
    average_visits: 0,
    peak_visits: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  // --- Prediction State ---
  const [predictionData, setPredictionData] = useState<FullPredictionData | null>(null);
  const [isPredictionLoading, setIsPredictionLoading] = useState(true);
  const [weeklyChartData, setWeeklyChartData] = useState<WeeklyChartDataPoint[]>([]);

  const formatXAxis = (tickItem: string) => {
    return tickItem;
  };

  const AngledXAxisTick = (props: {
    x: number;
    y: number;
    payload: { value: string };
  }) => {
    const { x, y, payload } = props;
    const words = payload.value.split(" ");
    return (
      <text
        x={x}
        y={y + 20}
        textAnchor="middle"
        fill="currentColor"
        className="text-sm text-gray-600 dark:text-gray-300">
        {words.map((word, index) => (
          <tspan key={index} x={x} dy={index ? "1.2em" : 0}>
            {word}
          </tspan>
        ))}
      </text>
    );
  };

  // Format week start date for chart label (e.g., "Wk of Jan 15")
  const formatWeekLabel = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }

  // Get Trend Icon Component
  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-gray-500" />;
      default: return null;
  }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/visits/charts?period=${selectedPeriod}&date=${selectedDate}`
        );
        const data = await response.json();

        if (response.ok) {
          if (selectedPeriod === "monthly") {
            const [year, month] = selectedDate.split("-").map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            const fullMonthData: VisitData[] = [];

            for (let day = 1; day <= daysInMonth; day++) {
              const dayString = `${year}-${String(month).padStart(
                2,
                "0"
              )}-${String(day).padStart(2, "0")}`;
              const existingData = data.visitsData.find(
                (item: { day: string }) => item.day === dayString
              );
              fullMonthData.push({
                day: String(day),
                visits: existingData ? existingData.visits : 0,
              });
            }
            setVisitData(fullMonthData);
          } else if (selectedPeriod === "yearly") {
            const months = [
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ];
            const fullYearData: VisitData[] = [];

            for (const month of months) {
              const existingData = data.visitsData.find(
                (item: { month: string }) => item.month === month
              );
              fullYearData.push({
                month: month,
                visits: existingData ? existingData.visits : 0,
              });
            }
            setVisitData(fullYearData);
          }

          setTimeData(data.timeDistribution);
          setStats(data.stats);
          setDepartmentData(data.departmentData || []);
          setCompanyData(data.companyData || []);
        } else {
          console.error("Failed to fetch data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod, selectedDate]);

  // --- Fetch Prediction Data ---
  useEffect(() => {
    const fetchPredictionData = async () => {
      setIsPredictionLoading(true);
      setWeeklyChartData([]); // Clear previous chart data on refetch/load
      setPredictionData(null); // Clear previous full prediction data

      try {
        const response = await fetch('/api/visits/prediction');
        const data: FullPredictionData = await response.json();

        if (response.ok) {
            // Process dates and prepare chart data
            const processedWeeklyData = data.weeklyPrediction.data.map(p => ({
                ...p,
                time: new Date(p.time) // Ensure Date object
            }));

            const chartData = processedWeeklyData.map(p => ({
                weekLabel: formatWeekLabel(p.time),
                historicalValue: p.historicalValue,
                predictedValue: p.predictedValue
            }));

            setWeeklyChartData(chartData);
            setPredictionData({ // Store the full processed data
                weeklyPrediction: {
                    data: processedWeeklyData,
                    message: data.weeklyPrediction.message
                },
                departmentTrends: data.departmentTrends,
                companyTrends: data.companyTrends
            });

        } else {
          console.error("Failed to fetch prediction data:", data);
          setPredictionData({ weeklyPrediction: { data: [], message: "Error fetching prediction." }, departmentTrends: [], companyTrends: [], error: data.error || "Unknown error" });
        }
      } catch (error: any) {
        console.error("Error fetching prediction data:", error);
        setPredictionData({ weeklyPrediction: { data: [], message: "Error fetching prediction." }, departmentTrends: [], companyTrends: [], error: error.message });
      } finally {
        setIsPredictionLoading(false);
      }
    };

    fetchPredictionData();
  }, []); // Runs once on mount

  const periods = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ];

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    setSelectedDate(
      period === "monthly"
        ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
        : String(now.getFullYear())
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Total Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.total_visits}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Average Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.average_visits}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Peak Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.peak_visits}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => handlePeriodChange(period.id)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedPeriod === period.id
                    ? "bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                {period.label}
              </button>
            ))}
          </div>

          <input
            type={selectedPeriod === "monthly" ? "month" : "number"}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={selectedPeriod === "yearly" ? "2000" : "2000-01"}
            max={selectedPeriod === "yearly" ? "2099" : "2099-12"}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Visitor Trends
          </h2>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitData}>
                  <XAxis
                    dataKey={selectedPeriod === "monthly" ? "day" : "month"}
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "0.375rem",
                      color: "var(--tooltip-text, #111827)",
                    }}
                    itemStyle={{
                      color: "var(--tooltip-text, #111827)",
                    }}
                  />
                  <Bar
                    dataKey="visits"
                    fill="currentColor"
                    className="fill-gray-900 dark:fill-gray-100"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

         {/* --- Enhanced Prediction Section --- */}
         <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-4">
            <BrainCircuit className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Future Trends & Predictions (Next 6 Months)
            </h2>
          </div>

          {/* Loading/Error State for the whole prediction section */}
          {isPredictionLoading ? (
              <div className="h-96 flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading predictions...</p>
              </div>
          ) : predictionData?.error ? (
               <div className="h-auto p-4 text-center text-red-600 dark:text-red-400">
                 <p>Could not load prediction data: {predictionData.error}</p>
               </div>
          ) : (
            <>
              {/* Weekly Prediction Chart */}
              <div>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">Weekly Visit Prediction</h3>
                {predictionData?.weeklyPrediction.message && weeklyChartData.length === 0 && (
                     <div className="h-80 flex items-center justify-center text-gray-600 dark:text-gray-300">
                        <p>{predictionData.weeklyPrediction.message}</p>
                    </div>
                )}
                {weeklyChartData.length > 0 && (
                    <div className="h-80 mb-6"> {/* Chart container */}
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-20 dark:opacity-30" />
                                {/* Adjust XAxis interval based on number of weeks if needed */}
                                <XAxis dataKey="weekLabel" stroke="currentColor" className="text-xs text-gray-600 dark:text-gray-300" interval={'preserveStartEnd'} tick={{ fontSize: 10 }} />
                                <YAxis stroke="currentColor" className="text-xs text-gray-600 dark:text-gray-300" tick={{ fontSize: 10 }}/>
                                <Tooltip contentStyle={{ backgroundColor: "var(--tooltip-bg, #fff)", border: "1px solid var(--tooltip-border, #ccc)", borderRadius: "0.375rem", fontSize: '0.8rem', color: "var(--tooltip-text, #111827)" }}
                                        formatter={(value: number, name: string) => value === null ? null : [value, name === 'historicalValue' ? 'Actual' : 'Predicted']}
                                        labelFormatter={(label: string) => label} />
                                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '0.8rem' }}/>
                                <Line type="monotone" dataKey="historicalValue" name="Actual" stroke="var(--color-historical, #4f46e5)" strokeWidth={1.5} dot={false} />
                                <Line type="monotone" dataKey="predictedValue" name="Predicted" stroke="var(--color-predicted, #f97316)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
                 {predictionData?.weeklyPrediction.message && weeklyChartData.length > 0 && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 -mt-4 mb-4">{predictionData.weeklyPrediction.message}</p>
                )}
              </div>

              {/* Department & Company Trend Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Department Trends */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Top Department Trends</h4>
                  {predictionData?.departmentTrends && predictionData.departmentTrends.length > 0 ? (
                    <ul className="space-y-2">
                      {predictionData.departmentTrends.map((dept) => (
                        <li key={dept.name} className="flex justify-between items-center text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{dept.name}</span>
                          <span className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                            <TrendIcon trend={dept.trend} />
                            <span>~{dept.predictedValue.toLocaleString()} visits</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No department trend data available.</p>
                  )}
                </div>

                {/* Company Trends */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">Top Company Trends</h4>
                   {predictionData?.companyTrends && predictionData.companyTrends.length > 0 ? (
                    <ul className="space-y-2">
                      {predictionData.companyTrends.map((comp) => (
                        <li key={comp.name} className="flex justify-between items-center text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          <span className="font-medium text-gray-800 dark:text-gray-200 truncate pr-2">{comp.name}</span>
                           <span className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                            <TrendIcon trend={comp.trend} />
                            <span>~{comp.predictedValue.toLocaleString()} visits</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No company trend data available.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-4">
            <Building2 className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Visits by Department
            </h2>
          </div>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <XAxis
                    dataKey="department"
                    stroke="currentColor"
                    height={80}
                    interval={0}
                    tick={
                      <AngledXAxisTick
                        x={0}
                        y={0}
                        payload={{
                          value: "",
                        }}
                      />
                    }
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "0.375rem",
                      color: "var(--tooltip-text, #111827)",
                    }}
                    itemStyle={{
                      color: "var(--tooltip-text, #111827)",
                    }}
                  />
                  <Bar
                    dataKey="visits"
                    fill="currentColor"
                    className="fill-gray-900 dark:fill-gray-100"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-4">
            <Building className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Visits by Company
            </h2>
          </div>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyData}>
                  <XAxis
                    dataKey="company"
                    stroke="currentColor"
                    height={80}
                    interval={0}
                    className="text-gray-600 dark:text-gray-300"
                    tick={
                      <AngledXAxisTick
                        x={0}
                        y={0}
                        payload={{
                          value: "",
                        }}
                      />
                    }
                  />
                  <YAxis
                    stroke="currentColor"
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "0.375rem",
                      color: "var(--tooltip-text, #111827)",
                    }}
                    itemStyle={{
                      color: "var(--tooltip-text, #111827)",
                    }}
                  />
                  <Bar
                    dataKey="visits"
                    fill="currentColor"
                    className="fill-gray-900 dark:fill-gray-100"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-gray-700 dark:text-gray-300 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Time Distribution
            </h2>
          </div>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-600 dark:text-gray-300">Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                  <XAxis
                    dataKey="time"
                    stroke="currentColor"
                    interval={1}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickFormatter={formatXAxis}
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <YAxis
                    stroke="currentColor"
                    tick={{ fontSize: 12 }}
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--tooltip-bg, #fff)",
                      border: "1px solid var(--tooltip-border, #e5e7eb)",
                      borderRadius: "0.375rem",
                      color: "var(--tooltip-text, #111827)",
                    }}
                    itemStyle={{
                      color: "var(--tooltip-text, #111827)",
                    }}
                    formatter={(value: number) => [`${value} visits`, "Visits"]}
                    labelFormatter={(time: string) => `Time: ${time}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="var(--tw-prose-body)"
                    strokeWidth={2}
                    dot={{
                      fill: "var(--tw-prose-body)",
                      r: 3,
                    }}
                    className="stroke-gray-900 dark:stroke-gray-100 fill-gray-900 dark:fill-gray-100"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorDashboard;
