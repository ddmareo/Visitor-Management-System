import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const visits = await prisma.visit.findMany({
      include: {
        visitor: {
          select: {
            name: true,
          },
        },
        employee: {
          select: {
            name: true,
          },
        },
        security: {
          select: {
            security_name: true,
          },
        },
      },
    });

    const transformedVisits = visits.map((visit) => ({
      ...visit,
      visitor_name: visit.visitor?.name || "N/A",
      employee_name: visit.employee?.name || "N/A",
      security_name: visit.security?.security_name || "N/A",
      visitor: undefined,
      employee: undefined,
      security: undefined,
    }));

    return new Response(JSON.stringify(transformedVisits), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching visits:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch visits" }), {
      status: 500,
    });
  }
}
