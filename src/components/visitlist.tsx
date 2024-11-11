"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Building2,
  UserCircle,
  Car,
  DoorOpen,
} from "lucide-react";

interface Visit {
  id: string;
  visitorName: string;
  company: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  category: string;
  entryMethod: string;
  vehicleNumber: string;
  status: "Pending" | "Ongoing" | "Completed";
}

interface VisitsSectionProps {
  title: string;
  visits: Visit[];
}

const VisitsSection: React.FC<VisitsSectionProps> = ({ title, visits }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center gap-2 mb-4">
      <Calendar className="w-5 h-5 text-black" />
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <span className="ml-auto text-sm text-gray-500">
        {visits.length} visits
      </span>
    </div>

    <div className="space-y-4">
      {visits.map((visit) => (
        <div
          key={visit.id}
          className="flex flex-col p-4 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors duration-150">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">
                {visit.visitorName}
              </span>
            </div>
            <span
              className={`
                px-2 py-0.5 text-xs rounded-full
                ${
                  visit.status === "Completed"
                    ? "bg-green-100 text-green-700"
                    : ""
                }
                ${
                  visit.status === "Ongoing"
                    ? "bg-yellow-100 text-yellow-700"
                    : ""
                }
                ${visit.status === "Pending" ? "bg-gray-100 text-gray-700" : ""}
              `}>
              {visit.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-gray-500">Company</div>
                <div className="text-gray-900">{visit.company}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-gray-500">Employee</div>
                <div className="text-gray-900">{visit.employeeName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-gray-500">Start Date</div>
                <div className="text-gray-900">
                  {new Date(visit.startDate).toLocaleDateString("en-GB")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-gray-500">End Date</div>
                <div className="text-gray-900">
                  {new Date(visit.endDate).toLocaleDateString("en-GB")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-gray-500">Entry Method</div>
                <div className="text-gray-900">{visit.entryMethod}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-gray-500">Vehicle</div>
                <div className="text-gray-900">
                  {visit.vehicleNumber || "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
              {visit.category}
            </div>
          </div>
        </div>
      ))}

      {visits.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No visits scheduled
        </div>
      )}
    </div>
  </div>
);

const VisitsPage = () => {
  const [todayVisits, setTodayVisits] = useState<Visit[]>([]);
  const [tomorrowVisits, setTomorrowVisits] = useState<Visit[]>([]);

  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch("/api/visits/list-security");
        const data = await response.json();

        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayVisits = data.filter((visit: Visit) => {
          const visitDate = new Date(visit.startDate);
          return (
            visitDate.getFullYear() === today.getFullYear() &&
            visitDate.getMonth() === today.getMonth() &&
            visitDate.getDate() === today.getDate()
          );
        });

        const tomorrowVisits = data.filter((visit: Visit) => {
          const visitDate = new Date(visit.startDate);
          return (
            visitDate.getFullYear() === tomorrow.getFullYear() &&
            visitDate.getMonth() === tomorrow.getMonth() &&
            visitDate.getDate() === tomorrow.getDate()
          );
        });

        console.log("Today:", today);
        console.log("Today Visits:", todayVisits);

        setTodayVisits(todayVisits);
        setTomorrowVisits(tomorrowVisits);
      } catch (error) {
        console.error("Error fetching visits:", error);
      }
    };

    fetchVisits();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visit Schedule</h1>

      <div className="space-y-6">
        <VisitsSection title="Today's Visits" visits={todayVisits} />
        <VisitsSection title="Tomorrow's Visits" visits={tomorrowVisits} />
      </div>
    </div>
  );
};

export default VisitsPage;
