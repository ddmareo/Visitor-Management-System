import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { format } from "date-fns-tz";

const prisma = new PrismaClient();

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

export async function GET() {
  try {
    const jakartaTimeZone = "Asia/Jakarta";
    const today = new Date();
    const formattedToday = format(today, "yyyy-MM-dd", {
      timeZone: jakartaTimeZone,
    });

    const visits = await prisma.visit.findMany({
      where: {
        entry_start_date: {
          gte: new Date(formattedToday),
          lt: new Date(
            new Date(formattedToday).getTime() + 24 * 60 * 60 * 1000
          ),
        },
        visitor_id: {
          not: null,
        },
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
      take: 10,
    });

    const mappedVisitors = visits
      .map((visit) => {
        if (!visit.visitor) {
          return null;
        }

        const mappedCategory =
          visitCategoryMapping[
            visit.visit_category as keyof typeof visitCategoryMapping
          ] || visit.visit_category;

        return {
          visitorName: visit.visitor.name,
          visitCategory: mappedCategory,
          teamMembers: visit.teammember.map((member) => member.member_name),
        };
      })
      .filter(
        (visitor): visitor is NonNullable<typeof visitor> => visitor !== null
      );

    return NextResponse.json({
      success: true,
      data: mappedVisitors,
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitors" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
