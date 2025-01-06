"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const NotificationListener = () => {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource("/api/notifications");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          let toastContainer = document.getElementById("toast-container");
          if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "toast-container";
            toastContainer.className =
              "fixed top-5 right-5 flex flex-col gap-2 z-50";
            document.body.appendChild(toastContainer);
          }

          const toast = document.createElement("div");
          toast.className =
            "flex items-center w-full max-w-xs p-4 space-x-4 text-gray-500 bg-white " +
            "divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow " +
            "dark:text-gray-400 dark:divide-gray-700 dark:bg-gray-800 transition-opacity duration-300";
          toast.role = "alert";

          const messageDiv = document.createElement("div");
          messageDiv.className = "text-sm font-normal";
          messageDiv.textContent = data.message;
          toast.appendChild(messageDiv);

          toastContainer.appendChild(toast);

          setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => {
              toast.remove();
              if (toastContainer.children.length === 0) {
                toastContainer.remove();
              }
            }, 300);
          }, 4700);
        } catch (error) {
          console.error("Error processing notification:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        eventSource?.close();
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [session]);

  return null;
};

export default NotificationListener;
