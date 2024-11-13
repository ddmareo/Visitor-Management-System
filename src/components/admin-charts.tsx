"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Line,
  ResponsiveContainer,
} from "recharts";
import { Calendar, Clock, Users, TrendingUp } from "lucide-react";

type VisitData = {
  day?: string;
  month?: string;
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

const VisitorDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return selectedPeriod === "monthly"
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      : String(now.getFullYear());
  });

  const [visitData, setVisitData] = useState<VisitData[]>([]);
  const [timeData, setTimeData] = useState<TimeData[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_visits: 0,
    average_visits: 0,
    peak_visits: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

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
            const year = parseInt(selectedDate);
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
        } else {
          console.error("Failed to fetch data:", data.error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false); // Ensure loading state is updated even on error
      }
    };

    fetchData();
  }, [selectedPeriod, selectedDate]);

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
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Visitor Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-gray-700 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700">
                Total Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.total_visits}
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-gray-700 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700">
                Average Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.average_visits}
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-700 mr-2" />
              <h3 className="text-lg font-semibold text-gray-700">
                Peak Visits
              </h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.peak_visits}
            </p>
          </div>
        </div>

        {/* Period Toggle and Date Picker */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => handlePeriodChange(period.id)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedPeriod === period.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {period.label}
              </button>
            ))}
          </div>

          {/* Date Picker */}
          <input
            type={selectedPeriod === "monthly" ? "month" : "number"}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={selectedPeriod === "yearly" ? "2000" : "2000-01"}
            max={selectedPeriod === "yearly" ? "2099" : "2099-12"}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Main Chart */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Visitor Trends
          </h2>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitData}>
                  <XAxis
                    dataKey={selectedPeriod === "monthly" ? "day" : "month"}
                    stroke="#374151"
                  />
                  <YAxis stroke="#374151" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Bar dataKey="visits" fill="#111827" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Time Distribution Chart */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center mb-4">
            <Clock className="w-5 h-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Time Distribution
            </h2>
          </div>
          <div className="h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <p>Loading...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeData}>
                  <XAxis dataKey="time" stroke="#374151" />
                  <YAxis stroke="#374151" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "0.375rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={{ fill: "#111827" }}
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
