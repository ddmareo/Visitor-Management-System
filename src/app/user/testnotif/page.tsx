"use client";

export default function TestNotification() {
  const sendTestNotification = async () => {
    try {
      const response = await fetch("/api/testnotif", {
        method: "POST",
      });
      if (!response.ok) {
        console.error("Failed to send test notification");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <button
      onClick={sendTestNotification}
      className="fixed bottom-4 right-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      Test Notification
    </button>
  );
}
