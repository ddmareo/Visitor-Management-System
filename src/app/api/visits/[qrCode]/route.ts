import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { qrCode: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "security") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { qrCode } = params;

  if (!qrCode) {
    return new Response(JSON.stringify({ error: "QR code is required" }), {
      status: 400,
    });
  }

  try {
    const visit = await prisma.visit.findFirst({
      where: { qr_code: qrCode },
      include: {
        visitor: {
          select: {
            name: true,
            company_institution: true,
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
        teammember: {
          select: {
            member_name: true,
          },
        },
      },
    });

    // If no visit is found, return an error
    if (!visit) {
      return new Response(JSON.stringify({ error: "Visitor not found" }), {
        status: 404,
      });
    }

    // Transform the visit data to match the expected format
    const transformedVisit = {
      ...visit,
      visitor_name: visit.visitor?.name || "-",
      employee_name: visit.employee?.name || "-",
      security_name: visit.security?.security_name || "-",
      company_institution: visit.visitor?.company_institution,
      team_members: visit.teammember.map((member) => member.member_name),
      visitor: undefined,
      employee: undefined,
      security: undefined,
    };

    return new Response(JSON.stringify(transformedVisit), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching visit by QR code:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch visit" }), {
      status: 500,
    });
  }
}
