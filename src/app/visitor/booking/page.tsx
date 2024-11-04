"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const page = () => {
  const router = useRouter();

  type Employee = {
    employee_id: number;
    name: string;
  };

  const searchParams = useSearchParams();
  const nik = searchParams.get("nik");
  const [visitor, setVisitor] = useState({ name: "", company: "" });
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [bringTeam, setBringTeam] = useState<boolean | null>(null);
  const [teamMemberCount, setTeamMemberCount] = useState<number>(1);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    employee: 0,
    date: "",
    category: "",
    method: "",
    vehicle: "",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await axios.get("/api/booking");
        setEmployees(response.data.employees);
        setCategories(response.data.visitCategories);
        setMethods(response.data.entryMethods);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };

    const fetchVisitor = async () => {
      try {
        const response = await axios.get(`/api/visitors?nomorktp=${nik}`);
        if (response.data.exists && response.data.visitor) {
          setVisitor({
            name: response.data.visitor.name,
            company: response.data.visitor.company_institution,
          });
        } else {
          setError("Visitor not found");
        }
      } catch (error) {
        console.error("Error fetching visitor details:", error);
        setError("An error occurred while fetching visitor details.");
      }
    };

    fetchInitialData();
    if (nik) {
      fetchVisitor();
    }
  }, [nik]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const parsedValue = name === "employee" ? parseInt(value, 10) : value;

    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleTeamChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === "yes";
    setBringTeam(value);
    if (!value) {
      setTeamMembers([]);
      setTeamMemberCount(1);
    }
  };

  const handleTeamMemberCountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const count = parseInt(event.target.value, 10);
    if (count >= 1) {
      setTeamMemberCount(count);
      const newTeamMembers = Array(count)
        .fill("")
        .map((_, i) => teamMembers[i] || "");
      setTeamMembers(newTeamMembers);
    }
  };

  const handleTeamMemberNameChange = (
    index: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newTeamMembers = [...teamMembers];
    newTeamMembers[index] = event.target.value;
    setTeamMembers(newTeamMembers);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const isoDate = new Date(formData.date).toISOString();

    try {
      const response = await axios.post("/api/booking", {
        visitor: nik,
        employee: formData.employee,
        date: isoDate,
        category: formData.category,
        teammemberscount: bringTeam ? teamMemberCount : null,
        method: formData.method,
        vehicle: formData.vehicle,
        teammembers: teamMembers,
        brings_team: bringTeam,
      });

      if (response.data && response.data.qrCodeImage) {
        router.push(
          `/visitor/showqr?qrCode=${encodeURIComponent(
            response.data.qrCodeImage
          )}`
        );
      } else {
        console.error("QR Code not received in response");
        alert("Visit booked, but there was an issue generating the QR code.");
      }
    } catch (error) {
      console.error("Error booking visit:", error);
      alert("An error occurred during booking.");
    }
  };

  return (
    <div>
      <div className="mt-8 mb-5 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-md w-full max-w-lg h-[750px] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex mb-5 space-x-2">
              <div className="w-full">
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={visitor.name}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                  readOnly
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="company"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Company/Institution
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={visitor.company}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                  readOnly
                />
              </div>
            </div>
            <div className="mb-5">
              <label
                htmlFor="team-members"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Do you bring team members?
              </label>
              <div className="bg-gray-50 p-2.5 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 mb-3">
                <div className="flex space-x-4 ml-1">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="bringTeam"
                      value="yes"
                      checked={bringTeam === true}
                      onChange={handleTeamChange}
                      className="w-4 h-4 accent-black border-gray-300 focus:ring-black"
                      required
                    />
                    <span className="ml-2 text-sm">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="bringTeam"
                      value="no"
                      checked={bringTeam === false}
                      onChange={handleTeamChange}
                      className="w-4 h-4 accent-black border-gray-300 focus:ring-black"
                      required
                    />
                    <span className="ml-2 text-sm">No</span>
                  </label>
                </div>
              </div>
              {bringTeam && (
                <div>
                  <label
                    htmlFor="team-member-count"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Number of team members
                  </label>
                  <input
                    type="number"
                    id="teamMemberCount"
                    value={teamMemberCount}
                    onChange={handleTeamMemberCountChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required={bringTeam}
                    min="1"
                  />
                  {teamMemberCount > 0 &&
                    Array.from({ length: teamMemberCount }).map((_, index) => (
                      <div key={index} className="mt-4">
                        <label
                          htmlFor={`team-member-${index}`}
                          className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                          Team Member {index + 1} Name
                        </label>
                        <input
                          type="text"
                          id={`teamMember${index}`}
                          value={teamMembers[index]}
                          onChange={(e) => handleTeamMemberNameChange(index, e)}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          required
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
            <div className="mb-5">
              <label
                htmlFor="employee"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Employee
              </label>
              <select
                id="employee"
                name="employee"
                value={formData.employee}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required>
                <option value="">Select an employee</option>
                {employees.map((emp) => (
                  <option key={emp.employee_id} value={emp.employee_id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <label
                htmlFor="date"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Visit Entry Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="category"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Visit Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required>
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <label
                htmlFor="safety"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Safety Permit
              </label>
              <input
                type="file"
                id="safety"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required={formData.category === "high_risk_work"}
                disabled={formData.category !== "high_risk_work"}
              />
            </div>
            <div className="flex mb-5 space-x-2">
              <div className="w-full">
                <label
                  htmlFor="method"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Entry Method
                </label>
                <select
                  id="method"
                  name="method"
                  value={formData.method}
                  onChange={handleInputChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required>
                  <option value="">Select an entry method</option>
                  {methods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {formData.method === "vehicle" && (
                <div className="w-full">
                  <label
                    htmlFor="vehicle"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    id="vehicle"
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleInputChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    required
                  />
                </div>
              )}
            </div>
            <div className="flex justify-center items-center mt-8">
              <button
                type="submit"
                className="text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Book Visit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default page;
