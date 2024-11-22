"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { SecureStorageService } from "@/utils/encryption";

const page = () => {
  const router = useRouter();

  type Employee = {
    employee_id: number;
    name: string;
  };

  type VisitCategory =
    | "Meeting___Visits"
    | "Delivery"
    | "Working__Project___Repair_"
    | "VIP";

  const [nik, setNik] = useState<string | null>(null);
  const [visitor, setVisitor] = useState({ name: "", company: "" });
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [categories, setCategories] = useState<VisitCategory[]>([]);
  const [methods, setMethods] = useState<string[]>([]);
  const [safetyPermitFile, setSafetyPermitFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [bringTeam, setBringTeam] = useState<boolean | null>(null);
  const [teamMemberCount, setTeamMemberCount] = useState<number>(1);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    employee: 0,
    entry_start_date: "",
    entry_end_date: "",
    category: "",
    method: "",
    vehicle: "",
  });

  useEffect(() => {
    const checkNIK = async () => {
      const storedNIK = await SecureStorageService.getItem("visitorNIK");
      if (!storedNIK) {
        router.push("/");
        return;
      }
      setNik(storedNIK);
    };

    checkNIK();
  }, [router]);

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
        const response = await axios.get(`/api/visitors/${nik}`);
        if (response.data.exists && response.data.visitor) {
          setVisitor({
            name: response.data.visitor.name,
            company: response.data.visitor.company_name,
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

  const validateDates = (): boolean => {
    const startDate = new Date(formData.entry_start_date);
    const endDate = new Date(formData.entry_end_date);

    if (endDate < startDate) {
      setDateError("End date cannot be before start date");
      return false;
    }
    return true;
  };

  const handleSafetyPermitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFileError("Safety permit file must be less than 5MB");
        setSafetyPermitFile(null);
        return;
      }

      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setFileError("Only JPEG and PNG files are allowed");
        setSafetyPermitFile(null);
        return;
      }

      setSafetyPermitFile(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const parsedValue = name === "employee" ? parseInt(value, 10) : value;

    setFormData({ ...formData, [name]: parsedValue });

    if (name === "entry_start_date" || name === "entry_end_date") {
      setDateError("");
    }
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

    if (
      formData.category === "Working__Project___Repair_" &&
      !safetyPermitFile
    ) {
      setFileError("Safety permit is required for Working (Project & Repair)");
      return;
    }

    if (!validateDates()) {
      return;
    }

    const isoEntryDate = new Date(formData.entry_start_date).toISOString();
    const isoEndDate = new Date(formData.entry_end_date).toISOString();

    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append("visitor", nik || "");
      formDataToSubmit.append("employee", formData.employee.toString());
      formDataToSubmit.append("entry_start_date", isoEntryDate);
      formDataToSubmit.append("entry_end_date", isoEndDate);
      formDataToSubmit.append("category", formData.category);
      formDataToSubmit.append("method", formData.method);
      formDataToSubmit.append("vehicle", formData.vehicle);
      formDataToSubmit.append("brings_team", bringTeam ? "true" : "false");

      if (bringTeam && teamMembers.length > 0) {
        formDataToSubmit.append("teammemberscount", teamMemberCount.toString());
        formDataToSubmit.append("teammembers", JSON.stringify(teamMembers));
      }

      if (safetyPermitFile) {
        formDataToSubmit.append("safety_permit", safetyPermitFile);
      }

      const response = await axios.post("/api/booking", formDataToSubmit, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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

  const categoryLabels: Record<VisitCategory, string> = {
    Meeting___Visits: "Meeting & Visits",
    Delivery: "Delivery",
    Working__Project___Repair_: "Working (Project & Repair)",
    VIP: "VIP",
  };
  return (
    <main className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 pt-[calc(62px)]">
      <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-md w-full max-w-xl h-[775px] overflow-y-auto">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Visit Booking
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Please fill in the visit details below
          </p>
        </div>
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
                  <span className="ml-2 text-sm dark:text-white">Yes</span>
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
                  <span className="ml-2 text-sm dark:text-white">No</span>
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
          <div className="flex mb-5 space-x-2">
            <div className="w-full">
              <label
                htmlFor="entry_start_date"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Entry Start Date
              </label>
              <input
                type="date"
                id="entry_start_date"
                name="entry_start_date"
                value={formData.entry_start_date}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="entry_end_date"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Entry End Date
              </label>
              <input
                type="date"
                id="entry_end_date"
                name="entry_end_date"
                value={formData.entry_end_date}
                onChange={handleInputChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
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
                  {categoryLabels[cat]}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-5">
            <label
              htmlFor="safety"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Safety Permit
              {formData.category === "Working__Project___Repair_" && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              type="file"
              id="safety"
              accept=".jpg,.jpeg,.png"
              onChange={handleSafetyPermitChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required={formData.category === "Working__Project___Repair_"}
              disabled={formData.category !== "Working__Project___Repair_"}
            />
            {fileError && (
              <p className="text-red-500 text-sm mt-1">{fileError}</p>
            )}
            {formData.category === "Working__Project___Repair_" && (
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: JPG, PNG (Max. 5MB)
              </p>
            )}
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
              className="text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-gray-500 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:text-black dark:bg-white dark:hover:bg-gray-100 dark:focus:ring-gray-300">
              Book Visit
            </button>
          </div>
          {dateError && (
            <p className="flex justify-center text-red-500 mt-5 text-sm">
              {dateError}
            </p>
          )}
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </div>
    </main>
  );
};

export default page;
