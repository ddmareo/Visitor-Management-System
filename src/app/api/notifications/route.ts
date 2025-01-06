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

  const response = new NextResponse(
    new ReadableStream({
      start(controller) {
        clients.set(userId, controller);

        const cleanup = () => {
          clients.delete(userId);
          controller.close();
        };

        const headers = new Headers();
        headers.get("connection")?.toLowerCase() === "close" && cleanup();

        controller.enqueue("retry: 1000\n\n");
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    }
  );

  return response;
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
      const data = `data: ${JSON.stringify({ message })}\n\n`;
      console.log(`Sending notification to user ${userId}:`, message);
      controller.enqueue(data);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}
