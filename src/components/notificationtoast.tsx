"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

const NotificationListener = () => {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    let eventSource: EventSource | null = null;

    const connectSSE = () => {
      eventSource = new EventSource("/api/notifications");

      eventSource.addEventListener("connected", (_event) => {
        console.log("SSE Connection established");
      });

      eventSource.addEventListener("notification", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received notification:", data);
          toast.message(data.message, {
            duration: 5000,
            className: "dark:bg-gray-800 dark:text-gray-100",
          });
        } catch (error) {
          console.error("Error processing notification:", error);
        }
      });

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        if (eventSource) {
          eventSource.close();
          setTimeout(connectSSE, 5000);
        }
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
