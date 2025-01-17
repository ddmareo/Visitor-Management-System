import { NextResponse } from "next/server";
import {
  PrismaClient,
  new_visit_category_enum,
  entry_method_enum,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { sendNotification } from "@/lib/notifications";

const prisma = new PrismaClient();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      select: { employee_id: true, name: true },
    });

    const visitCategories = Object.values(new_visit_category_enum);
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
    const formData = await request.formData();

    const visitor = formData.get("visitor") as string;
    const employee = parseInt(formData.get("employee") as string);
    const entry_start_date = new Date(
      formData.get("entry_start_date") as string
    );
    const category = formData.get("category") as new_visit_category_enum;
    const method = formData.get("method") as entry_method_enum;
    const vehicle = formData.get("vehicle") as string;
    const brings_team = formData.get("brings_team") === "true";
    const teammemberscount = brings_team
      ? parseInt(formData.get("teammemberscount") as string)
      : 0;

    const safetyPermitFile = formData.get("safety_permit") as File | null;

    let teammembers: string[] = [];
    const teammembersData = formData.get("teammembers");
    if (teammembersData) {
      teammembers = JSON.parse(teammembersData as string);
    }

    if (!employee || !entry_start_date || !category || !method) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let safetyPermitBuffer: Buffer | null = null;
    if (category === "Working__Project___Repair_") {
      if (!safetyPermitFile) {
        return NextResponse.json(
          { error: "Safety permit is required for high risk work" },
          { status: 400 }
        );
      }

      const fileArrayBuffer = await safetyPermitFile.arrayBuffer();
      safetyPermitBuffer = Buffer.from(fileArrayBuffer);

      if (safetyPermitFile.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Safety permit file must be less than 5MB" },
          { status: 400 }
        );
      }

      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(safetyPermitFile.type)) {
        return NextResponse.json(
          { error: "Only JPEG and PNG files are allowed" },
          { status: 400 }
        );
      }
    }

    const visitorRecord = await prisma.visitor.findUnique({
      where: { id_number: visitor },
    });

    if (!visitorRecord) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    const visitor_id = visitorRecord.visitor_id;

    const employeeRecord = await prisma.users.findFirst({
      where: { employee_id: employee },
    });

    if (!employeeRecord?.user_id) {
      return NextResponse.json(
        { error: "Employee user account not found" },
        { status: 404 }
      );
    }

    const qrCodeUUID = uuidv4();
    const qrCodeURL = `${qrCodeUUID}`;

    const newVisit = await prisma.visit.create({
      data: {
        visitor_id,
        employee_id: employee,
        entry_start_date: entry_start_date,
        visit_category: category,
        entry_method: method,
        vehicle_number:
          method === "Vehicle_Roda_Dua" || method === "Vehicle_Roda_Empat"
            ? vehicle
            : null,
        team_members_quantity: teammemberscount || 0,
        qr_code: qrCodeUUID,
        brings_team: brings_team,
        safety_permit: safetyPermitBuffer,
      },
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrCodeURL);

    if (brings_team && teammembers.length > 0) {
      const teamData = teammembers.map((member: string) => ({
        visit_id: newVisit.visit_id,
        member_name: member,
      }));
      await prisma.teammember.createMany({
        data: teamData,
      });
    }

    const formattedDate = entry_start_date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    try {
      await delay(1000);

      const notificationMessage = `${visitorRecord.name} has booked a visit on ${formattedDate} under ${visitCategoryMapping[category]}`;

      await sendNotification(employeeRecord.user_id, notificationMessage);
      console.log(`Notification sent to employee ${employeeRecord.user_id}`);
    } catch (error) {
      console.error("Error sending notification:", error);
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
