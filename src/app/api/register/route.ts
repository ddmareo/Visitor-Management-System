import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { name, company, nomorktp, phone, email, address } =
      await request.json();

    if (!name || !company || !nomorktp || !phone || !email || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingVisitor = await prisma.visitor.findUnique({
      where: { id_number: nomorktp },
    });

    if (existingVisitor) {
      return NextResponse.json(
        { error: "NIK already exists" },
        { status: 400 }
      );
    }

    await prisma.visitor.create({
      data: {
        name,
        company_institution: company,
        id_number: nomorktp,
        contact_phone: phone,
        contact_email: email,
        address,
      },
    });

    return NextResponse.json(
      { message: "Visitor registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
