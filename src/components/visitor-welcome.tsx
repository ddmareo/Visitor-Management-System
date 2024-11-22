"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface VisitorData {
  visitorName: string;
  company: string;
  checkInTime: string;
  visitCategory: string;
  teamMembers: string[];
}

const WelcomePage = () => {
  const [time, setTime] = useState(new Date());
  const [greeting, setGreeting] = useState("");
  const [recentVisitor, setRecentVisitor] = useState<VisitorData | null>(null);
  const [error, setError] = useState("");

  const fetchRecentVisitor = async () => {
    try {
      const response = await axios.get("/api/visits/welcome");
      setRecentVisitor(response.data.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch visitor information");
      console.error("Error fetching visitor:", err);
    }
  };

  useEffect(() => {
    const hour = time.getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchRecentVisitor();

    const pollingInterval = setInterval(fetchRecentVisitor, 5000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-12 space-y-8">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-2xl font-medium">
            {greeting}, Welcome to ALVA!
          </p>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
            {recentVisitor?.visitorName}
          </h1>
          {recentVisitor?.teamMembers &&
            recentVisitor.teamMembers.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-700 dark:text-gray-200 text-xl font-medium mb-2">
                  Team Members:
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {recentVisitor.teamMembers.map((member, index) => (
                    <span
                      key={index}
                      className="px-6 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-full text-lg">
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            )}
          <p className="text-gray-500 dark:text-gray-400 text-3xl mt-4">
            We're excited to have you here
          </p>
        </div>

        <div className="pt-12 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-2xl">
                Visit Category
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xl">
                {recentVisitor?.visitCategory}
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-2xl">
                Today's Date
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xl">
                {time.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-2xl">
                Current Time
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xl">
                {time.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
