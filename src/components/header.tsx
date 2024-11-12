"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import Logo from "../app/images/logo3.png";
import Profile from "../app/images/cookie.png";

const Header = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userName, setUsername] = useState<string>("");

  useEffect(() => {
    const fetchUsername = async () => {
      if (status === "authenticated") {
        try {
          const response = await axios.get("/api/profile");
          setUsername(response.data.username);
        } catch (error) {
          console.error("Error fetching username:", error);
          setUsername("User");
        }
      }
    };

    fetchUsername();
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      setIsDropdownOpen(false);
    }
  }, [status]);

  const handleLogoClick = () => {
    router.push("/");
    router.refresh();
  };

  const handleLogin = async () => {
    router.push("/login");
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  const handleVisitsClick = () => {
    router.push("/security/visits-list");
  };

  const handleScanClick = () => {
    router.push("/security/dashboard");
  };

  const toggleDropdown = () => {
    if (status === "authenticated") {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const capitalizeFirstLetter = (string: string | undefined): string => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [session]);

  const isSecurity = session?.user?.role === "security";
  const isAdmin = session?.user?.role === "admin";

  return (
    <nav className="sticky top-0 w-full bg-white z-50 border-b shadow-sm">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <div className="flex items-center space-x-6">
          <a
            onClick={handleLogoClick}
            className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
            <img src={Logo.src} className="h-12" alt="ALVA Logo" />
          </a>
        </div>
        <div className="flex justify-center items-center">
          {status === "loading" ? (
            <div className="loader">Loading...</div>
          ) : status === "authenticated" ? (
            <div className="relative" ref={dropdownRef}>
              <img
                onClick={toggleDropdown}
                id="avatarButton"
                className="w-9 h-9 rounded-full cursor-pointer"
                src={Profile.src}
                alt="User dropdown"
              />

              {isDropdownOpen && (
                <div
                  id="userDropdown"
                  className="absolute right-0 mt-2 z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600">
                  <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    <div className="font-semibold">
                      {capitalizeFirstLetter(userName)} (
                      {capitalizeFirstLetter(session?.user?.role)})
                    </div>
                  </div>
                  <div className="py-1">
                    <a
                      onClick={handleLogoClick}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white cursor-pointer">
                      {isAdmin ? "Dashboard" : "Home"}
                    </a>
                    {(isSecurity || isAdmin) && (
                      <a
                        onClick={handleVisitsClick}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white cursor-pointer">
                        Visits
                      </a>
                    )}
                    {isAdmin && (
                      <a
                        onClick={handleScanClick}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white cursor-pointer">
                        Scan QR
                      </a>
                    )}
                    <a
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white cursor-pointer">
                      Logout
                    </a>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleLogin}
              className="text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
