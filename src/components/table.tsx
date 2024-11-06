"use client";

import React, { useState, useEffect } from "react";
import { Search, Eye, Edit } from "lucide-react";
import axios from "axios";
import AddForm from "./addform";
import EditForm from "./editform";

interface Visitor {
  visitor_id: string;
  name: string;
  company_institution: string;
  id_number: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  registration_date: string;
  id_card: string;
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
  employee_name?: string | null;
  security_name?: string | null;
}

interface Visit {
  visit_id: string;
  visitor_name?: string;
  employee_name?: string;
  security_name?: string;
  visit_category: "meeting" | "low_risk_work" | "high_risk_work";
  entry_start_date: string;
  entry_end_date: string;
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

type FormDataType = Visitor | Employee | Security | Users | Visit | TeamMember;

const table = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTable, setSelectedTable] = useState("visitorsdata");
  const [tableData, setTableData] = useState<
    Visitor[] | Employee[] | Security[] | Users[] | Visit[] | TeamMember[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/table/${selectedTable}`);
        if (selectedTable === "usersdata") {
          setTableData(data.users);
        } else {
          setTableData(data);
        }

        const hideAddButtonTables = [
          "visitorsdata",
          "visitsdata",
          "teammembersdata",
        ];
        setIsVisible(!hideAddButtonTables.includes(selectedTable));
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

    const hideAddButtonTables = [
      "visitorsdata",
      "visitsdata",
      "teammembersdata",
    ];
    setIsVisible(!hideAddButtonTables.includes(event.target.value));
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);

    if (checked) {
      const allIds = filterData().map((item: any) => {
        switch (selectedTable) {
          case "visitorsdata":
            return (item as Visitor).visitor_id;
          case "employeesdata":
            return (item as Employee).employee_id;
          case "securitydata":
            return (item as Security).security_id;
          case "usersdata":
            return (item as Users).user_id;
          case "visitsdata":
            return (item as Visit).visit_id;
          case "teammembersdata":
            return (item as TeamMember).team_member_id;
          default:
            return "";
        }
      });
      setSelectedItems(new Set(allIds));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelectedItems = new Set(selectedItems);
    if (selectedItems.has(id)) {
      newSelectedItems.delete(id);
    } else {
      newSelectedItems.add(id);
    }
    setSelectedItems(newSelectedItems);

    setSelectAll(newSelectedItems.size === filterData().length);
  };

  const openIdCard = async (visitorId: string) => {
    try {
      const response = await axios.get(
        `/api/table/visitorsdata/idcard/${visitorId}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const imageUrl = URL.createObjectURL(blob);

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>ID Card</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="ID Card" />
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("Error fetching ID card:", error);
      alert("Failed to load ID Card image");
    }
  };

  const openSafetyPermit = async (visitId: string) => {
    try {
      const response = await axios.get(
        `/api/table/visitsdata/safety/${visitId}`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const imageUrl = URL.createObjectURL(blob);

      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>ID Card</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${imageUrl}" alt="ID Card" />
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("Error fetching safety permit:", error);
      alert("Failed to load safety permit image");
    }
  };

  const handleSubmit = async (formData: FormDataType) => {
    try {
      await axios.post(`/api/table/${selectedTable}`, formData);
      const { data } = await axios.get(`/api/table/${selectedTable}`);
      if (selectedTable === "usersdata") {
        setTableData(data.users);
      } else {
        setTableData(data);
      }
    } catch (error) {
      console.error("Error adding new item:", error);
      alert("Failed to add new item");
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) {
      alert("Select at least one of the checkboxes!");
      return;
    }

    if (!confirm("Are you sure you want to delete the selected items?")) return;

    try {
      await axios.delete(`/api/table/${selectedTable}`, {
        data: {
          ids: Array.from(selectedItems),
        },
      });

      const { data } = await axios.get(`/api/table/${selectedTable}`);
      if (selectedTable === "usersdata") {
        setTableData(data.users);
      } else {
        setTableData(data);
      }
      setSelectedItems(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Error deleting items", error);
      alert("Failed to delete items");
    }
  };

  const handleAdd = () => {
    setIsModalOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: any) => {
    try {
      let id;
      switch (selectedTable) {
        case "visitorsdata":
          id = selectedItem.visitor_id;
          break;
        case "employeesdata":
          id = selectedItem.employee_id;
          break;
        case "securitydata":
          id = selectedItem.security_id;
          break;
        case "usersdata":
          id = selectedItem.user_id;
          break;
        case "visitsdata":
          id = selectedItem.visit_id;
          break;
        case "teammembersdata":
          id = selectedItem.team_member_id;
          break;
        default:
          throw new Error("Invalid table selected");
      }

      await axios.put(`/api/table/${selectedTable}/${id}`, formData);
      const { data } = await axios.get(`/api/table/${selectedTable}`);
      if (selectedTable === "usersdata") {
        setTableData(data.users);
      } else {
        setTableData(data);
      }
      setIsEditModalOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item");
    }
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
    const commonCheckbox = (
      <th scope="col" className="p-4">
        <div className="flex items-center">
          <input
            id="checkbox-all-search"
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="checkbox-all-search" className="sr-only">
            checkbox
          </label>
        </div>
      </th>
    );
    switch (selectedTable) {
      case "visitorsdata":
        return (
          <tr>
            {commonCheckbox}
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
            {commonCheckbox}
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
            {commonCheckbox}
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
            {commonCheckbox}
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
              Security
            </th>
            <th scope="col" className="px-6 py-3">
              Action
            </th>
          </tr>
        );
      case "visitsdata":
        return (
          <tr>
            {commonCheckbox}
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
              Entry Start Date
            </th>
            <th scope="col" className="px-6 py-3">
              Entry End Date
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
            {commonCheckbox}
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
    const commonRowCheckbox = (id: string) => (
      <td className="w-4 p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedItems.has(id)}
            onChange={() => handleSelectItem(id)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label className="sr-only">checkbox</label>
        </div>
      </td>
    );

    const actionLogo = (item: any) => (
      <td className="px-6 py-4">
        <div className="flex justify-center items-center space-x-4">
          <a
            onClick={() => handleEdit(item)}
            className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
            <Edit className="w-5 h-5" />
          </a>
          {selectedTable === "visitorsdata" && (
            <a
              onClick={() => openIdCard(item.visitor_id)}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              <Eye className="w-5 h-5" />
            </a>
          )}
          {selectedTable === "visitsdata" && (
            <a
              onClick={() => openSafetyPermit(item.visit_id)}
              className="font-medium text-blue-600 dark:text-blue-500 hover:underline cursor-pointer">
              <Eye className="w-5 h-5" />
            </a>
          )}
        </div>
      </td>
    );

    if (selectedTable === "visitorsdata") {
      return (filteredData as Visitor[]).map((visitor) => (
        <tr
          key={visitor.visitor_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(visitor.visitor_id)}
          <td className="px-6 py-4">{visitor.name}</td>
          <td className="px-6 py-4">{visitor.company_institution}</td>
          <td className="px-6 py-4">{visitor.id_number}</td>
          <td className="px-6 py-4">{visitor.contact_phone}</td>
          <td className="px-6 py-4">{visitor.contact_email}</td>
          <td className="px-6 py-4">{visitor.address}</td>
          <td className="px-6 py-4">
            {new Date(visitor.registration_date).toLocaleDateString("en-GB")}
          </td>
          {actionLogo(visitor)}
        </tr>
      ));
    } else if (selectedTable === "employeesdata") {
      return (filteredData as Employee[]).map((employee) => (
        <tr
          key={employee.employee_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(employee.employee_id)}
          <td className="px-6 py-4">{employee.name}</td>
          <td className="px-6 py-4">{employee.email}</td>
          <td className="px-6 py-4">{employee.phone}</td>
          <td className="px-6 py-4">{employee.department}</td>
          <td className="px-6 py-4">{employee.position}</td>
          {actionLogo(employee)}
        </tr>
      ));
    } else if (selectedTable === "securitydata") {
      return (filteredData as Security[]).map((security) => (
        <tr
          key={security.security_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(security.security_id)}
          <td className="px-6 py-4">{security.security_id}</td>
          <td className="px-6 py-4">{security.security_name}</td>
          {actionLogo(security)}
        </tr>
      ));
    } else if (selectedTable === "usersdata") {
      return (filteredData as Users[]).map((user) => (
        <tr key={user.user_id} className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(user.user_id)}
          <td className="px-6 py-4">{user.username}</td>
          <td className="px-6 py-4">{user.password}</td>
          <td className="px-6 py-4">{user.role}</td>
          <td className="px-6 py-4">{user.employee_name}</td>
          <td className="px-6 py-4">{user.security_name}</td>
          {actionLogo(user)}
        </tr>
      ));
    } else if (selectedTable === "visitsdata") {
      return (filteredData as Visit[]).map((visit) => (
        <tr key={visit.visit_id} className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(visit.visit_id)}
          <td className="px-6 py-4">{visit.visit_id}</td>
          <td className="px-6 py-4">{visit.visitor_name}</td>
          <td className="px-6 py-4">{visit.employee_name}</td>
          <td className="px-6 py-4">{visit.security_name}</td>
          <td className="px-6 py-4">{visit.visit_category}</td>
          <td className="px-6 py-4">
            {new Date(visit.entry_start_date).toLocaleDateString("en-GB")}
          </td>
          <td className="px-6 py-4">
            {new Date(visit.entry_end_date).toLocaleDateString("en-GB")}
          </td>
          <td className="px-6 py-4">{visit.entry_method}</td>
          <td className="px-6 py-4">{visit.vehicle_number}</td>
          <td className="px-6 py-4">
            {visit.check_in_time
              ? new Date(visit.check_in_time).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </td>
          <td className="px-6 py-4">
            {visit.check_out_time
              ? new Date(visit.check_out_time).toLocaleTimeString("en-US", {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-"}
          </td>
          <td className="px-6 py-4">{visit.qr_code}</td>
          <td className="px-6 py-4">
            {visit.verification_status ? "Verified" : "Not Verified"}
          </td>
          <td className="px-6 py-4">{visit.brings_team ? "Yes" : "No"}</td>
          <td className="px-6 py-4">{visit.team_members_quantity}</td>
          {actionLogo(visit)}
        </tr>
      ));
    } else if (selectedTable === "teammembersdata") {
      return (filteredData as TeamMember[]).map((teamMember) => (
        <tr
          key={teamMember.team_member_id}
          className="bg-white border-b dark:bg-gray-800">
          {commonRowCheckbox(teamMember.team_member_id)}
          <td className="px-6 py-4">{teamMember.team_member_id}</td>
          <td className="px-6 py-4">{teamMember.visit_id}</td>
          <td className="px-6 py-4">{teamMember.member_name}</td>
          {actionLogo(teamMember)}
        </tr>
      ));
    } else {
      return null;
    }
  };

  return (
    <div className="mx-16 mb-16">
      <div className="flex flex-col sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-between pb-4">
        <div className="flex items-center space-x-1">
          <div className="relative mr-2.5">
            <select
              value={selectedTable}
              onChange={handleTableChange}
              className="block p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white">
              <option value="visitorsdata">Visitor</option>
              <option value="employeesdata">Employee</option>
              <option value="securitydata">Security</option>
              <option value="usersdata">User</option>
              <option value="visitsdata">Visit</option>
              <option value="teammembersdata">Member</option>
            </select>
          </div>
          {isVisible && (
            <button
              onClick={handleAdd}
              className="text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-4 py-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-4 py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 0V4a1 1 0 011-1h2a1 1 0 011 1v3m-7 0h10"
              />
            </svg>
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center ps-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          <input
            type="text"
            className="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-75 bg-gray-50"
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
      <AddForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTable={selectedTable}
        onSubmit={handleSubmit}
      />
      <EditForm
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        selectedTable={selectedTable}
        initialData={selectedItem}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
};

export default table;
