import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const clients = new Map();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt(session.user.id, 10);

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  let heartbeatInterval: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      clients.set(userId, controller);

      controller.enqueue('event: connected\ndata: {"status":"connected"}\n\n');

      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(": heartbeat\n\n");
        } catch (error) {
          cleanup();
        }
      }, 30000);

      const cleanup = () => {
        clearInterval(heartbeatInterval);
        clients.delete(userId);
        try {
          controller.close();
        } catch (error) {
          console.log("Controller already closed");
        }
      };

      if (headers.get("connection")?.toLowerCase() === "close") {
        cleanup();
      }
    },
    cancel() {
      clearInterval(heartbeatInterval);
      clients.delete(userId);
    },
  });

  return new NextResponse(stream, { headers });
}

export async function sendNotification(userId: number, message: string) {
  try {
    await prisma.notifications.create({
      data: {
        message,
        user_id: userId,
      },
    });

    const controller = clients.get(userId);
    if (controller) {
      try {
        const eventData = {
          type: "notification",
          message,
          timestamp: new Date().toISOString(),
        };
        const eventString = `event: notification\ndata: ${JSON.stringify(
          eventData
        )}\n\n`;
        console.log(`Sending notification to user ${userId}:`, message);
        controller.enqueue(eventString);
      } catch (error) {
        clients.delete(userId);
        console.error("Error sending notification, client removed:", error);
      }
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}
