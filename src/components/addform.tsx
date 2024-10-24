"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { hash } from "bcryptjs";

interface AddFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTable: string;
  onSubmit: (data: any) => void;
}

interface VisitorsData {
  name: string;
  company_institution: string;
  id_number: string;
  contact_phone: string;
  contact_email: string;
  address: string;
}

interface EmployeesData {
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
}

interface SecurityData {
  security_name: string;
}

interface UsersData {
  username: string;
  password: string;
  role: string;
  employee_id: string;
}

interface VisitsData {
  visitor_name: string;
  employee_name: string;
  visit_category: string;
  entry_method: string;
  vehicle_number?: string;
  brings_team: string;
  team_members_quantity?: number;
}

interface TeamMembersData {
  visit_id: string;
  member_name: string;
}

type FormDataType =
  | VisitorsData
  | EmployeesData
  | SecurityData
  | UsersData
  | VisitsData
  | TeamMembersData;

const AddForm: React.FC<AddFormProps> = ({
  isOpen,
  onClose,
  selectedTable,
  onSubmit,
}) => {
  type Employee = {
    employee_id: number;
    name: string;
  };

  const [formData, setFormData] = useState<Partial<FormDataType>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (isOpen && selectedTable === "usersdata") {
      fetchEmployees();
    }
  }, [isOpen, selectedTable]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/table/usersdata");
      const data = await response.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleChange = async (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    let { name, value } = e.target;

    if (name === "employee_id" && value) {
      value = parseInt(value, 10) as unknown as string;
    }

    if (name === "password") {
      value = await hash(value, 12);
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({});
    onClose();
  };

  if (!isOpen) return null;

  const renderForm = () => {
    const inputClass = "w-full p-2 border border-gray-300 rounded-lg";
    const labelClass = "block mb-2 text-sm font-medium text-gray-900";

    switch (selectedTable) {
      case "visitorsdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="name" className={labelClass}>
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="company_institution" className={labelClass}>
                Company/Institution
              </label>
              <input
                type="text"
                id="company_institution"
                name="company_institution"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="id_number" className={labelClass}>
                ID Number
              </label>
              <input
                type="text"
                id="id_number"
                name="id_number"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="contact_phone" className={labelClass}>
                Phone
              </label>
              <input
                type="tel"
                id="contact_phone"
                name="contact_phone"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="contact_email" className={labelClass}>
                Email
              </label>
              <input
                type="email"
                id="contact_email"
                name="contact_email"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="address" className={labelClass}>
                Address
              </label>
              <textarea
                id="address"
                name="address"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
          </>
        );

      case "employeesdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="name" className={labelClass}>
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="phone" className={labelClass}>
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="department" className={labelClass}>
                Department
              </label>
              <input
                type="text"
                id="department"
                name="department"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="position" className={labelClass}>
                Position
              </label>
              <input
                type="text"
                id="position"
                name="position"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
          </>
        );

      case "securitydata":
        return (
          <div className="mb-4">
            <label htmlFor="security_name" className={labelClass}>
              Security Name
            </label>
            <input
              type="text"
              id="security_name"
              name="security_name"
              className={inputClass}
              onChange={handleChange}
              required
            />
          </div>
        );

      case "usersdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="username" className={labelClass}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="role" className={labelClass}>
                Role
              </label>
              <select
                id="role"
                name="role"
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select role</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="security">Security</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="employee_id" className={labelClass}>
                Employee
              </label>
              <select
                id="employee_id"
                name="employee_id"
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option
                    key={employee.employee_id}
                    value={employee.employee_id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        );

      case "visitsdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="visitor_name" className={labelClass}>
                Visitor Name
              </label>
              <input
                type="text"
                id="visitor_name"
                name="visitor_name"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="employee_name" className={labelClass}>
                Employee Name
              </label>
              <input
                type="text"
                id="employee_name"
                name="employee_name"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="visit_category" className={labelClass}>
                Visit Category
              </label>
              <select
                id="visit_category"
                name="visit_category"
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select category</option>
                <option value="meeting">Meeting</option>
                <option value="low_risk_work">Low Risk Work</option>
                <option value="high_risk_work">High Risk Work</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="entry_method" className={labelClass}>
                Entry Method
              </label>
              <select
                id="entry_method"
                name="entry_method"
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select method</option>
                <option value="walking">Walking</option>
                <option value="vehicle">Vehicle</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="vehicle_number" className={labelClass}>
                Vehicle Number
              </label>
              <input
                type="text"
                id="vehicle_number"
                name="vehicle_number"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="brings_team" className={labelClass}>
                Brings Team
              </label>
              <select
                id="brings_team"
                name="brings_team"
                className={inputClass}
                onChange={handleChange}
                required>
                <option value="">Select option</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="team_members_quantity" className={labelClass}>
                Team Members Quantity
              </label>
              <input
                type="number"
                id="team_members_quantity"
                name="team_members_quantity"
                className={inputClass}
                onChange={handleChange}
              />
            </div>
          </>
        );

      case "teammembersdata":
        return (
          <>
            <div className="mb-4">
              <label htmlFor="visit_id" className={labelClass}>
                Visit ID
              </label>
              <input
                type="text"
                id="visit_id"
                name="visit_id"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="member_name" className={labelClass}>
                Member Name
              </label>
              <input
                type="text"
                id="member_name"
                name="member_name"
                className={inputClass}
                onChange={handleChange}
                required
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            Add New{" "}
            {selectedTable.replace("data", "").charAt(0).toUpperCase() +
              selectedTable.replace("data", "").slice(1)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {renderForm()}
          <div className="flex justify-end gap-2 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 ">
              Add Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddForm;
