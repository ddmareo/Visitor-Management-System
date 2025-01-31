import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/notifications";
import { sendTeamsNotification } from "@/lib/teamsnotifications";

const prisma = new PrismaClient();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function PUT(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const userWithSecurity = await prisma.users.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        security: true,
      },
    });

    if (session.user.role !== "security" || !userWithSecurity?.security) {
      return NextResponse.json(
        { error: "Access denied: Security role required" },
        { status: 403 }
      );
    }

    if (!userWithSecurity?.security) {
      return NextResponse.json(
        { error: "Security information not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });

    const checkInTime = new Date();
    const [hours, minutes] = timeString.split(":");
    checkInTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    const updatedVisit = await prisma.visit.update({
      where: {
        visit_id: parseInt(params.id, 10),
      },
      data: {
        check_in_time: checkInTime,
        verification_status: true,
        security: {
          connect: {
            security_id: userWithSecurity.security.security_id,
          },
        },
      },
      include: {
        visitor: {
          include: {
            company: true,
          },
        },
        employee: true,
        security: true,
        teammember: true,
      },
    });

    if (updatedVisit.employee_id) {
      const employeeUser = await prisma.users.findFirst({
        where: {
          employee_id: updatedVisit.employee_id,
        },
        include: {
          employee: true,
        },
      });

      if (employeeUser && employeeUser.employee?.email) {
        try {
          await delay(1000);
          const message = `${updatedVisit.visitor?.name} from ${updatedVisit.visitor?.company.company_name} has checked in for their visit`;
          await sendNotification(employeeUser.user_id, message);
          await sendTeamsNotification(employeeUser.employee?.email, message);
          console.log(`Notification sent to employee ${employeeUser.user_id}`);
        } catch (error) {
          console.error("Error sending notification:", error);
        }
      }
    }

    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}
