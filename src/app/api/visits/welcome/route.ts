import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

export async function GET() {
  try {
    const recentVisit = await prisma.visit.findFirst({
      where: {
        check_in_time: {
          not: null,
        },
        visitor_id: {
          not: null,
        },
      },
      orderBy: {
        check_in_time: "desc",
      },
      include: {
        visitor: {
          select: {
            name: true,
            company_id: true,
          },
        },
        teammember: {
          select: {
            member_name: true,
          },
        },
      },
    });

    if (!recentVisit || !recentVisit.visitor) {
      return NextResponse.json(
        { error: "No recent check-ins found" },
        { status: 404 }
      );
    }

    const mappedCategory =
      visitCategoryMapping[
        recentVisit.visit_category as keyof typeof visitCategoryMapping
      ] || recentVisit.visit_category;

    return NextResponse.json({
      success: true,
      data: {
        visitorName: recentVisit.visitor.name,
        //company: recentVisit.visitor.company_institution,
        //checkInTime: recentVisit.check_in_time,
        visitCategory: mappedCategory,
        teamMembers: recentVisit.teammember.map((member) => member.member_name),
      },
    });
  } catch (error) {
    console.error("Error fetching recent visitor:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent visitor" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
