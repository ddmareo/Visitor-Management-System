"use client";

import React, { useState } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";

const page = () => {
  const searchParams = useSearchParams();
  const nik = searchParams.get("nik") || "";
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    nomorktp: nik,
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select an ID card file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const submitFormData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value);
      });
      submitFormData.append("idCard", selectedFile);

      const response = await axios.post("/api/register", submitFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Registration successful:", response.data);
      router.push(`/visitor/booking?nik=${formData.nomorktp}`);
    } catch (error: any) {
      console.error("Registration error:", error);
      setError(
        error.response?.data?.error || "An error occurred during registration."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mt-16 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-md w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="name"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="company"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Company/Institution
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="nomorktp"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Nomor KTP (NIK)
              </label>
              <input
                type="text"
                id="nomorktp"
                name="nomorktp"
                value={formData.nomorktp}
                onChange={handleChange}
                readOnly
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
            <div className="flex mb-5 space-x-2">
              <div className="w-full">
                <label
                  htmlFor="phone"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="mb-5">
              <label
                htmlFor="address"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>
            <div className="mb-5">
              <label
                htmlFor="file"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Scan of ID Card
              </label>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept="image/*"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Supported formats: JPG, PNG (Max. 5MB)
              </p>
            </div>
            <div className="flex justify-center items-center mt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                {isLoading ? "Registering..." : "Register"}
              </button>
            </div>

            {error && (
              <div className="text-red-500 mt-5 flex justify-center items-center">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default page;
