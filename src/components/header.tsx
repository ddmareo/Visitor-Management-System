"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Logo from "../app/images/logo3.png";
import Profile from "../app/images/cookie.png";

const Header = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const toggleDropdown = () => {
    if (status === "authenticated") {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Capitalize the first letter of 'role' as it's currently in all lowercase letters.
  const capitalizeFirstLetter = (string: string | undefined): string => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Closes the dropdown menu if the user clicks anywhere on the screen.
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

  // To fix the dropdown menu keeps on automatically appearing when redirected.
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [session]);

  return (
    <nav className="sticky top-0 w-full bg-white z-50 border-b shadow-sm">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a
          onClick={handleLogoClick}
          className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer">
          <img src={Logo.src} className="h-12" alt="ALVA Logo" />
        </a>
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
                      {capitalizeFirstLetter(session.user?.role)}
                    </div>
                  </div>
                  <div className="py-1">
                    <a
                      onClick={handleLogoClick}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white cursor-pointer">
                      Dashboard
                    </a>
                    <a
                      onClick={handleLogout}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white cursor-pointer">
                      Sign out
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
