"use client";

import React, { useState } from "react";
import { QrCode, Search } from "lucide-react";
import QrScannerPopup from "./qrscannerwindow";

const page = () => {
  const [qrCode, setQrCode] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);

  const handleQrScanSuccess = (scannedUrl: string) => {
    setQrCode(scannedUrl);
    setShowQrScanner(false);
  };
  return (
    <div className="my-8 w-full md:w-2/3 lg:w-1/3 px-4">
      <form>
        <div className="mb-4">
          <label
            htmlFor="qr_code"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            QR Code
          </label>
          <div className="flex flex-col sm:flex-row">
            <input
              type="text"
              id="qr_code"
              name="qr_code"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              required
            />
            <button
              className="mt-2 sm:mt-0 sm:ml-3 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-black rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 active:bg-gray-900"
              aria-label="Search"
              type="button">
              <Search className="w-5 h-5" />
              <span className="sr-only">Search</span>
            </button>
            <button
              className="mt-2 sm:mt-0 sm:ml-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-black rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 active:bg-gray-900"
              aria-label="Open QR Code"
              type="button"
              onClick={() => setShowQrScanner(true)}>
              <QrCode className="w-5 h-5" />
              <span className="sr-only">QR Code</span>
            </button>
          </div>
        </div>
      </form>
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 mt-10">
        <h5 className="mb-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white text-center">
          ALVA VISIT CARD
        </h5>
        <div className="flex flex-col lg:flex-row lg:space-x-16 space-y-6 lg:space-y-0 px-5">
          <div>
            <h2 className="mb-1 text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              BASIC INFORMATION
            </h2>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Name: Dustin Mareo Istanto
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Company: President University
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Employee: John Doe
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Security: -
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              ID Card: okokok.png
            </p>
            <h2 className="mb-1 mt-3.5 text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              VISIT INFORMATION
            </h2>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Entry Date: 22-10-2024
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Check-In Time: 10:20
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Check-Out Time: 16:00
            </p>
          </div>
          <div>
            <h2 className="mb-1 text-base font-semibold tracking-tight text-gray-900 dark:text-white">
              OTHER INFORMATION
            </h2>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Visit Category: High Risk Work
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Safety Permit: safety_dustin.png
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Entry Method: Vehicle
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Vehicle Number: B 2416 JOK
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Verification Status: No
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Brings Team: No
            </p>
            <p className="font-normal text-gray-700 dark:text-gray-400">
              Team Members: -
            </p>
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <a
            href="#"
            className="inline-flex items-center px-5 py-3 text-white bg-black rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-gray-500">
            Check In
          </a>
        </div>
      </div>
      {showQrScanner && (
        <QrScannerPopup
          onClose={() => setShowQrScanner(false)}
          onScanSuccess={handleQrScanSuccess}
        />
      )}
    </div>
  );
};

export default page;
