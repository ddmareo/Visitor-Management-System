import { NextResponse } from "next/server";
import {
  PrismaClient,
  visit_category_enum,
  entry_method_enum,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      select: { employee_id: true, name: true },
    });

    const visitCategories = Object.values(visit_category_enum);
    const entryMethods = Object.values(entry_method_enum);

    return NextResponse.json({
      employees,
      visitCategories,
      entryMethods,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const {
      visitor,
      employee,
      entry_start_date,
      entry_end_date,
      category,
      teammemberscount,
      method,
      vehicle,
      teammembers,
      brings_team,
    } = await request.json();

    if (
      !employee ||
      !entry_start_date ||
      !entry_end_date ||
      !category ||
      !method
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const visitorRecord = await prisma.visitor.findUnique({
      where: { id_number: visitor },
    });

    if (!visitorRecord) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    const visitor_id = visitorRecord.visitor_id;

    const qrCodeUUID = uuidv4();
    const qrCodeURL = `${qrCodeUUID}`;

    const newVisit = await prisma.visit.create({
      data: {
        visitor_id,
        employee_id: employee,
        entry_start_date: entry_start_date,
        entry_end_date: entry_end_date,
        visit_category: category,
        entry_method: method,
        vehicle_number: method === "vehicle" ? vehicle : null,
        team_members_quantity: teammemberscount || 0,
        qr_code: qrCodeUUID,
        brings_team: brings_team,
      },
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrCodeURL);

    if (teammemberscount && teammemberscount > 0 && teammembers.length) {
      const teamData = teammembers.map((member: string) => ({
        visit_id: newVisit.visit_id,
        member_name: member,
      }));
      await prisma.teammember.createMany({
        data: teamData,
      });
    }

    return NextResponse.json({
      status: 201,
      qrCodeImage: qrCodeDataURL,
    });
  } catch (error) {
    console.error("Error during booking process:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
