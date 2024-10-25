"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import axios from "axios";

export default function Home() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError("");

    if (!/^\d+$/.test(nik)) {
      setError("NIK should contain only numbers.");
      return;
    }

    if (nik.length !== 16) {
      setError("NIK must be exactly 16 digits.");
      return;
    }

    try {
      const response = await axios.get(`/api/visitors?nomorktp=${nik}`);

      if (response.data.exists) {
        router.push(`/visitor/booking?nik=${nik}`);
      } else {
        router.push(`/visitor/register?nik=${nik}`);
      }
    } catch (error) {
      console.error("Error checking NIK:", error);
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <div>
      <div className="mt-60 flex justify-center items-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-md w-full max-w-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-1">
              <label
                htmlFor="NIK"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                NIK
              </label>
              <input
                type="text"
                id="NIK"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Enter your NIK here"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <div className="flex justify-center items-center mt-4">
              <button
                type="submit"
                className="text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
