import { NextResponse } from "next/server";
import {
  PrismaClient,
  visit_category_enum,
  entry_method_enum,
} from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    const formData = await request.formData();

    // Extract fields from form data
    const visitor = formData.get("visitor") as string;
    const employee = parseInt(formData.get("employee") as string);
    const entry_start_date = new Date(
      formData.get("entry_start_date") as string
    );
    const entry_end_date = new Date(formData.get("entry_end_date") as string);
    const category = formData.get("category") as visit_category_enum;
    const method = formData.get("method") as entry_method_enum;
    const vehicle = formData.get("vehicle") as string;
    const brings_team = formData.get("brings_team") === "true";
    const teammemberscount = brings_team
      ? parseInt(formData.get("teammemberscount") as string)
      : 0;

    const safetyPermitFile = formData.get("safety_permit") as File | null;

    // Validate required fields
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

    // Check safety permit for high-risk work
    let safetyPermitBuffer: Buffer | null = null;
    if (category === "high_risk_work") {
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

      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(safetyPermitFile.type)) {
        return NextResponse.json(
          { error: "Only PDF, JPEG, and PNG files are allowed" },
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

    const qrCodeUUID = uuidv4();
    const qrCodeURL = `${qrCodeUUID}`;

    // Create visit record
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
        safety_permit: safetyPermitBuffer,
      },
    });

    const qrCodeDataURL = await QRCode.toDataURL(qrCodeURL);

    // Handle team members if they exist
    const teammembers = formData.getAll("teammembers") as string[];
    if (brings_team && teammemberscount > 0 && teammembers.length) {
      const teamData = teammembers.map((member) => ({
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
