"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import LogoLight from "../app/images/logo3.png";
import LogoDark from "../app/images/logo.png";
import Profile from "../app/images/cookie.png";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import {
  Home,
  LayoutGrid,
  UserCheck,
  ScanLine,
  Smile,
  Moon,
  Sun,
  HelpCircle,
} from "lucide-react";

interface NavbarProps {
  profileUrl?: string;
  userName?: string;
  userEmail?: string;
}

const NavbarWithSidebar: React.FC<NavbarProps> = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userName, setUsername] = useState<string>("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");

    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    setIsDarkMode(theme === "dark");
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

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
    router.push("/security/home");
  };

  const handleTableClick = () => {
    router.push("/admin/database");
  };

  const handleWelcomeClick = () => {
    router.push("/admin/welcome");
  };

  const handleHelpClick = () => {
    window.open("/user-manual", "_blank");
  };

  const capitalizeFirstLetter = (string: string | undefined): string => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const isSecurity = session?.user?.role === "security";
  const isAdmin = session?.user?.role === "admin";
  const isAuthenticated = status === "authenticated";

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

  return (
    <>
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start rtl:justify-end">
              {isAuthenticated && (
                <button
                  onClick={toggleSidebar}
                  type="button"
                  className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                  <span className="sr-only">Open sidebar</span>
                  <svg
                    className="w-6 h-6"
                    aria-hidden="true"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      clipRule="evenodd"
                      fillRule="evenodd"
                      d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"></path>
                  </svg>
                </button>
              )}
              <a
                onClick={handleLogoClick}
                className="flex ms-2 md:me-24 cursor-pointer">
                <Image
                  src={isDarkMode ? LogoDark : LogoLight}
                  height={40}
                  alt="Logo"
                  className="h-10 w-auto me-3"
                  priority
                />
              </a>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleHelpClick}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600">
                <HelpCircle className="w-6 h-6" />
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                aria-label="Toggle dark mode">
                {isDarkMode ? (
                  <Sun className="w-6 h-6" />
                ) : (
                  <Moon className="w-6 h-6" />
                )}
              </button>
              {status === "authenticated" ? (
                <div className="flex items-center ms-3">
                  <div>
                    <button
                      type="button"
                      onClick={toggleUserMenu}
                      className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">
                      <span className="sr-only">Open user menu</span>
                      <Image
                        src={Profile}
                        width={32}
                        height={32}
                        className="rounded-full"
                        alt="user photo"
                      />
                    </button>
                  </div>
                  {isUserMenuOpen && (
                    <div className="absolute top-10 right-0 z-50 my-4 text-base list-none bg-white divide-y divide-gray-100 rounded shadow dark:bg-gray-700 dark:divide-gray-600">
                      <div className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white font-semibold">
                          {capitalizeFirstLetter(userName)} (
                          {capitalizeFirstLetter(session?.user?.role)})
                        </p>
                      </div>
                      <ul className="py-1">
                        <li>
                          <a
                            onClick={handleLogoClick}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white cursor-pointer">
                            {isAdmin ? "Dashboard" : "Home"}
                          </a>
                        </li>
                        <li>
                          <a
                            onClick={handleLogout}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer">
                            Sign out
                          </a>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLogin}
                  className="ml-2 text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2 dark:text-black dark:bg-gray-100 dark:hover:bg-gray-100 dark:focus:ring-gray-300 dark:border-gray-300">
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      {isAuthenticated && (
        <aside
          className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } bg-white border-r border-gray-200 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700`}>
          <div className="h-full px-3 pb-4 overflow-y-auto bg-white dark:bg-gray-800">
            <ul className="space-y-2 font-medium">
              <li>
                <a
                  onClick={handleLogoClick}
                  className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                  <Home className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                  <span className="ms-3">Home</span>
                </a>
              </li>
              <li>
                {isAdmin && (
                  <a
                    onClick={handleTableClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <LayoutGrid className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">Table</span>
                  </a>
                )}
              </li>
              <li>
                {(isSecurity || isAdmin) && (
                  <a
                    onClick={handleVisitsClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <UserCheck className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">
                      Visits
                    </span>
                  </a>
                )}
              </li>
              <li>
                {isAdmin && (
                  <a
                    onClick={handleScanClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <ScanLine className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">Scan</span>
                  </a>
                )}
              </li>
              <li>
                {(isSecurity || isAdmin) && (
                  <a
                    onClick={handleWelcomeClick}
                    className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group cursor-pointer">
                    <Smile className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                    <span className="flex-1 ms-3 whitespace-nowrap">
                      Welcome
                    </span>
                  </a>
                )}
              </li>
            </ul>
          </div>
        </aside>
      )}
    </>
  );
};

export default NavbarWithSidebar;
