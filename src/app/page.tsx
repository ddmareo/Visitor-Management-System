"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import axios from "axios";
import { CreditCard, AlertCircle, ArrowRight } from "lucide-react";
import { encrypt } from "@/utils/encryption";

export default function Home() {
  const router = useRouter();
  const [nik, setNik] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError("");

    const nikWithoutSpaces = nik.replace(/\s+/g, "");

    if (!/^\d+$/.test(nikWithoutSpaces)) {
      setError("NIK hanya boleh terdiri dari angka.");
      return;
    }

    if (nikWithoutSpaces.length !== 16) {
      setError("NIK harus terdiri dari 16 digit.");
      return;
    }

    try {
      const encryptedNIK = await encrypt(nikWithoutSpaces);

      const response = await axios.get(`/api/visitors/${encryptedNIK}`);

      sessionStorage.setItem("visitorNIK", encryptedNIK);

      if (response.data.exists) {
        router.push("/visitor/booking");
      } else {
        router.push("/visitor/register");
      }
    } catch (error) {
      console.error("Error checking NIK:", error);
      setError("Terjadi kesalahan. Silakan coba lagi nanti.");
    }
  };

  const formatNIK = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const chunks = numbers.match(/.{1,4}/g) || [];
    return chunks.join(" ").substr(0, 19);
  };

  const handleNIKChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNIK(e.target.value);
    setNik(formatted);
  };

  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-gray-50 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-black" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Selamat datang
            </h1>
            <p className="text-gray-500 dark:text-gray-300">
              Masukkan NIK (Nomor Induk Kependudukan) Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <div className="relative group">
                <input
                  type="text"
                  id="NIK"
                  value={nik}
                  onChange={handleNIKChange}
                  placeholder="XXXX XXXX XXXX XXXX"
                  className="w-full px-4 py-3 text-center text-lg tracking-wider border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all duration-200 ease-in-out font-medium 
               dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-gray-400"
                  maxLength={19}
                  required
                />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-800 dark:group-hover:border-gray-400 rounded-lg pointer-events-none transition-all duration-200 ease-in-out"></div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900 p-3 rounded-lg mt-5">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transform transition-all duration-200 ease-in-out hover:scale-[1.02] dark:bg-gray-100 dark:text-black dark:hover:bg-gray-200 flex items-center justify-center space-x-2">
              <span>Lanjutkan</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
