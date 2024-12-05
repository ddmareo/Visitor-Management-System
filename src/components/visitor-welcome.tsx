"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [recentVisitor, setRecentVisitor] = useState<VisitorData | null>(null);
  const [visitorList, setVisitorList] = useState<VisitorData[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorData | null>(
    null
  );
  const [error, setError] = useState("");
  const prevVisitorRef = useRef<VisitorData | null>(null);

  const speakVisitorInfo = useCallback((visitor: VisitorData | null) => {
    if (!visitor) return;

    window.speechSynthesis.cancel();

    if (
      !prevVisitorRef.current ||
      visitor.visitorName !== prevVisitorRef.current.visitorName
    ) {
      window.speechSynthesis.cancel();

      const speechText = `Selamat datang di ALVA Plant, ${visitor.visitorName}.`;

      const utterance = new SpeechSynthesisUtterance(speechText);

      const voices = window.speechSynthesis.getVoices();
      const indonesianVoice = voices.find(
        (voice) =>
          voice.lang.startsWith("id") &&
          voice.name.toLowerCase().includes("female")
      );

      if (indonesianVoice) {
        utterance.voice = indonesianVoice;
      }

      utterance.lang = "id-ID";
      utterance.rate = 1;
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);

      prevVisitorRef.current = visitor;
    }
  }, []);

  const fetchRecentVisitor = async () => {
    try {
      const response = await axios.get("/api/visits/welcome");
      const newVisitor = response.data.data;

      setRecentVisitor(newVisitor);

      speakVisitorInfo(newVisitor);

      setError("");
    } catch (err) {
      setError("Failed to fetch visitor information");
      console.error("Error fetching visitor:", err);
    }
  };

  const fetchVisitorList = async () => {
    try {
      const response = await axios.get("/api/visits/list-welcome");
      setVisitorList(response.data.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch visitor list");
      console.error("Error fetching visitors:", err);
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
    if (mode === "auto") {
      fetchRecentVisitor();
      const pollingInterval = setInterval(fetchRecentVisitor, 5000);
      return () => {
        clearInterval(pollingInterval);
      };
    } else {
      fetchVisitorList();
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "manual" && visitorList.length > 0) {
      const firstVisitor = visitorList[0];
      setSelectedVisitor(firstVisitor);

      speakVisitorInfo(firstVisitor);
    }
  }, [visitorList, mode, speakVisitorInfo]);

  const handleModeToggle = () => {
    setMode((prevMode) => (prevMode === "auto" ? "manual" : "auto"));
  };

  const handleVisitorSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVisitorName = event.target.value;
    const visitor =
      visitorList.find((v) => v.visitorName === selectedVisitorName) || null;

    speakVisitorInfo(visitor);

    setSelectedVisitor(visitor);
  };

  const displayVisitor = mode === "auto" ? recentVisitor : selectedVisitor;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl w-full bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-12 space-y-8">
        <div className="flex justify-end items-center space-x-4 mb-4">
          <span className="text-gray-600 dark:text-gray-300">
            {mode === "auto" ? "Automatic Mode" : "Manual Mode"}
          </span>
          <label className="inline-flex relative items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={mode === "manual"}
              onChange={handleModeToggle}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300 text-2xl font-medium">
            {greeting}, Welcome to ALVA!
          </p>
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white">
            {displayVisitor?.visitorName || "No Visitor"}
          </h1>
          {displayVisitor?.teamMembers &&
            displayVisitor.teamMembers.length > 0 && (
              <div className="mt-4">
                <p className="text-gray-700 dark:text-gray-200 text-xl font-medium mb-2">
                  Team Members:
                </p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {displayVisitor.teamMembers.map((member, index) => (
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
            We are excited to have you here
          </p>
        </div>

        <div className="pt-12 border-t border-gray-200 dark:border-gray-700 mt-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-2xl">
                Visit Category
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-xl">
                {displayVisitor?.visitCategory || "N/A"}
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-2xl">
                Today Date
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
      {mode === "manual" && visitorList.length > 0 && (
        <div className="mt-6">
          <select
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={selectedVisitor?.visitorName || ""}
            onChange={handleVisitorSelect}>
            {visitorList.map((visitor) => (
              <option key={visitor.visitorName} value={visitor.visitorName}>
                {visitor.visitorName}
              </option>
            ))}
          </select>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
};

export default WelcomePage;
