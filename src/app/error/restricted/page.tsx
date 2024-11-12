"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const Page = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user?.role) {
        setShowContent(true);
      }
    } else if (status === "unauthenticated") {
      setShowContent(true);
    }
  }, [session, status]);

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "admin":
        router.push("/admin/dashboard");
        break;
      case "user":
        router.push("/user/home");
        break;
      case "security":
        router.push("/security/home");
        break;
      default:
        router.push("/");
    }
  };

  const handleBackToHome = () => {
    if (session?.user?.role) {
      redirectBasedOnRole(session.user.role);
    } else {
      router.push("/");
    }
  };

  if (!showContent) {
    return null;
  }

  return (
    <section className="bg-white dark:bg-gray-900">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 mt-36">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
            You don't have access to this page.
          </p>
          <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
            Sorry, this page is restricted. You are either not logged in yet or
            you are logged in but don't have access to this page.
          </p>
          <a
            onClick={handleBackToHome}
            className="inline-flex text-white bg-black hover:bg-gray-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4 cursor-pointer">
            Back to Homepage
          </a>
        </div>
      </div>
    </section>
  );
};

export default Page;
