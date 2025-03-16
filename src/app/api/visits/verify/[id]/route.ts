import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

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

    const updatedVisit = await prisma.visit.update({
      where: {
        visit_id: parseInt(params.id, 10),
      },
      data: {
        verification_status: true,
        security: {
          connect: {
            security_id: userWithSecurity.security.security_id,
          },
        },
      },
      include: {
        visitor: true,
        employee: true,
        security: true,
        teammember: true,
      },
    });

    return NextResponse.json(updatedVisit);
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Failed to update verification status" },
      { status: 500 }
    );
  }
}