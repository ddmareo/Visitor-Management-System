"use client";

import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface Visitor {
  visitor_id: string;
  name: string;
  company_institution: string;
  id_number: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  registration_date: string;
}

interface Employee {
  employee_id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
}

interface Security {
  security_id: string;
  security_name: string;
}

interface Users {
  user_id: string;
  username: string;
  password: string;
  role: "admin" | "user" | "security";
  employee_id?: string | null;
}

interface Visit {
  visit_id: string;
  visitor_name?: string;
  employee_name?: string;
  security_name?: string;
  visit_category: "meeting" | "low_risk_work" | "high_risk_work";
  entry_date: string;
  entry_method: "walking" | "vehicle";
  vehicle_number?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  qr_code: string;
  verification_status: boolean;
  safety_permit?: string | null;
  brings_team: boolean;
  team_members_quantity?: number | null;
}

interface TeamMember {
  team_member_id: string;
  visit_id: string;
  member_name: string;
}

const table = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState("visitorsdata");
  const [tableData, setTableData] = useState<
    Visitor[] | Employee[] | Security[] | Users[] | Visit[] | TeamMember[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/table/${selectedTable}`);
        setTableData(data);
      } catch (error) {
        console.error("Error fetching table data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTable]);

  const handleTableChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTable(event.target.value);
    setSearchTerm("");
  };

  const handleEdit = () => {
    router.push("/");
  };

  const filterData = () => {
    if (!searchTerm) return tableData;

    const searchLower = searchTerm.toLowerCase();

    switch (selectedTable) {
      case "visitorsdata":
        return (tableData as Visitor[]).filter((visitor) =>
          Object.values(visitor).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "employeesdata":
        return (tableData as Employee[]).filter((employee) =>
          Object.values(employee).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "securitydata":
        return (tableData as Security[]).filter((security) =>
          Object.values(security).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "usersdata":
        return (tableData as Users[]).filter((user) =>
          Object.values(user)
            .filter((value) => value !== "password")
            .some(
              (value) =>
                value && value.toString().toLowerCase().includes(searchLower)
            )
        );

      case "visitsdata":
        return (tableData as Visit[]).filter((visit) =>
          Object.values(visit).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      case "teammembersdata":
        return (tableData as TeamMember[]).filter((member) =>
          Object.values(member).some(
            (value) =>
              value && value.toString().toLowerCase().includes(searchLower)
          )
        );

      default:
        return tableData;
    }
  };

  const renderTableHeaders = () => {
    switch (selectedTable) {
      case "visitorsdata":
        return (
          <tr>
            <th scope="col" className="px-6 py-3">
              Name
            </th>
            <th scope="col" className="px-6 py-3">
              Company
            </th>
            <th scope="col" className="px-6 py-3">
              ID Number
            </th>
            <th scope="col" className="px-6 py-3">
              Phone
            </th>
            <th scope="col" className="px-6 py-3">
              Email
            </th>
            <th scope="col" className="px-6 py-3">
              Address
            </th>
            <th scope="col" className="px-6 py-3">
              Registration Date
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "employeesdata":
        return (
          <tr>
            <th scope="col" className="px-6 py-3">
              Name
            </th>
            <th scope="col" className="px-6 py-3">
              Email
            </th>
            <th scope="col" className="px-6 py-3">
              Phone
            </th>
            <th scope="col" className="px-6 py-3">
              Department
            </th>
            <th scope="col" className="px-6 py-3">
              Position
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "securitydata":
        return (
          <tr>
            <th scope="col" className="px-6 py-3">
              Security ID
            </th>
            <th scope="col" className="px-6 py-3">
              Security Name
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "usersdata":
        return (
          <tr>
            <th scope="col" className="px-6 py-3">
              Username
            </th>
            <th scope="col" className="px-6 py-3">
              Password
            </th>
            <th scope="col" className="px-6 py-3">
              Role
            </th>
            <th scope="col" className="px-6 py-3">
              Employee
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "visitsdata":
        return (
          <tr>
            <th scope="col" className="px-6 py-3">
              ID
            </th>
            <th scope="col" className="px-6 py-3">
              Visitor
            </th>
            <th scope="col" className="px-6 py-3">
              Employee
            </th>
            <th scope="col" className="px-6 py-3">
              Security
            </th>
            <th scope="col" className="px-6 py-3">
              Visit Category
            </th>
            <th scope="col" className="px-6 py-3">
              Entry Date
            </th>
            <th scope="col" className="px-6 py-3">
              Entry Method
            </th>
            <th scope="col" className="px-6 py-3">
              Vehicle Number
            </th>
            <th scope="col" className="px-6 py-3">
              Check-in
            </th>
            <th scope="col" className="px-6 py-3">
              Check-out
            </th>
            <th scope="col" className="px-6 py-3">
              QR Code
            </th>
            <th scope="col" className="px-6 py-3">
              Verification Status
            </th>
            <th scope="col" className="px-6 py-3">
              Safety Permit
            </th>
            <th scope="col" className="px-6 py-3">
              Brings Team
            </th>
            <th scope="col" className="px-6 py-3">
              Team Members Quantity
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "teammembersdata":
        return (
          <tr>
            <th scope="col" className="px-6 py-3">
              Team Member ID
            </th>
            <th scope="col" className="px-6 py-3">
              Visit ID
            </th>
            <th scope="col" className="px-6 py-3">
              Member Name
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      default:
        return null;
    }
  };

  const renderTableRows = () => {
    const filteredData = filterData();

    if (selectedTable === "visitorsdata") {
      return (filteredData as Visitor[]).map((visitor) => (
        <tr
          key={visitor.visitor_id}
          className="bg-white border-b dark:bg-gray-800">
          <td className="px-6 py-4">{visitor.name}</td>
          <td className="px-6 py-4">{visitor.company_institution}</td>
          <td className="px-6 py-4">{visitor.id_number}</td>
          <td className="px-6 py-4">{visitor.contact_phone}</td>
          <td className="px-6 py-4">{visitor.contact_email}</td>
          <td className="px-6 py-4">{visitor.address}</td>
          <td className="px-6 py-4">{visitor.registration_date}</td>
          <td className="px-6 py-4 flex justify-center">
            <a
              onClick={handleEdit}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              Edit
            </a>
          </td>
        </tr>
      ));
    } else if (selectedTable === "employeesdata") {
      return (filteredData as Employee[]).map((employee) => (
        <tr
          key={employee.employee_id}
          className="bg-white border-b dark:bg-gray-800">
          <td className="px-6 py-4">{employee.name}</td>
          <td className="px-6 py-4">{employee.email}</td>
          <td className="px-6 py-4">{employee.phone}</td>
          <td className="px-6 py-4">{employee.department}</td>
          <td className="px-6 py-4">{employee.position}</td>
          <td className="px-6 py-4 flex justify-center">
            <a
              onClick={handleEdit}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              Edit
            </a>
          </td>
        </tr>
      ));
    } else if (selectedTable === "securitydata") {
      return (filteredData as Security[]).map((security) => (
        <tr
          key={security.security_id}
          className="bg-white border-b dark:bg-gray-800">
          <td className="px-6 py-4">{security.security_id}</td>
          <td className="px-6 py-4">{security.security_name}</td>
          <td className="px-6 py-4 flex justify-center">
            <a
              onClick={handleEdit}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              Edit
            </a>
          </td>
        </tr>
      ));
    } else if (selectedTable === "usersdata") {
      return (filteredData as Users[]).map((user) => (
        <tr key={user.user_id} className="bg-white border-b dark:bg-gray-800">
          <td className="px-6 py-4">{user.username}</td>
          <td className="px-6 py-4">{user.password}</td>
          <td className="px-6 py-4">{user.role}</td>
          <td className="px-6 py-4">{user.employee_id}</td>
          <td className="px-6 py-4 flex justify-center">
            <a
              onClick={handleEdit}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              Edit
            </a>
          </td>
        </tr>
      ));
    } else if (selectedTable === "visitsdata") {
      return (filteredData as Visit[]).map((visit) => (
        <tr key={visit.visit_id} className="bg-white border-b dark:bg-gray-800">
          <td className="px-6 py-4">{visit.visit_id}</td>
          <td className="px-6 py-4">{visit.visitor_name}</td>
          <td className="px-6 py-4">{visit.employee_name}</td>
          <td className="px-6 py-4">{visit.security_name}</td>
          <td className="px-6 py-4">{visit.visit_category}</td>
          <td className="px-6 py-4">
            {new Date(visit.entry_date).toLocaleDateString()}
          </td>
          <td className="px-6 py-4">{visit.entry_method}</td>
          <td className="px-6 py-4">{visit.vehicle_number}</td>
          <td className="px-6 py-4">{visit.check_in_time}</td>
          <td className="px-6 py-4">{visit.check_out_time}</td>
          <td className="px-6 py-4">{visit.qr_code}</td>
          <td className="px-6 py-4">
            {visit.verification_status ? "Verified" : "Not Verified"}
          </td>
          <td className="px-6 py-4">{visit.safety_permit}</td>
          <td className="px-6 py-4">{visit.brings_team ? "Yes" : "No"}</td>
          <td className="px-6 py-4">{visit.team_members_quantity}</td>
          <td className="px-6 py-4 flex justify-center">
            <a
              onClick={handleEdit}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              Edit
            </a>
          </td>
        </tr>
      ));
    } else if (selectedTable === "teammembersdata") {
      return (filteredData as TeamMember[]).map((teamMember) => (
        <tr
          key={teamMember.team_member_id}
          className="bg-white border-b dark:bg-gray-800">
          <td className="px-6 py-4">{teamMember.team_member_id}</td>
          <td className="px-6 py-4">{teamMember.visit_id}</td>
          <td className="px-6 py-4">{teamMember.member_name}</td>
          <td className="px-6 py-4 flex justify-center">
            <a
              onClick={handleEdit}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              Edit
            </a>
          </td>
        </tr>
      ));
    } else {
      return null;
    }
  };

  return (
    <div className="mx-16 mb-16">
      <div className="flex flex-col sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between pb-4">
        <div className="relative">
          <select
            value={selectedTable}
            onChange={handleTableChange}
            className="block p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white">
            <option value="visitorsdata">Visitor</option>
            <option value="employeesdata">Employee</option>
            <option value="securitydata">Security</option>
            <option value="usersdata">Users</option>
            <option value="visitsdata">Visit</option>
            <option value="teammembersdata">Members</option>
          </select>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            className="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50"
            placeholder="Search for items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700">
              {renderTableHeaders()}
            </thead>
            <tbody>{renderTableRows()}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default table;
