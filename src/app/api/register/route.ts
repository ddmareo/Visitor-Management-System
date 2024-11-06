import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const idCardFile = formData.get("idCard") as File;
    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const nomorktp = formData.get("nomorktp") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;

    if (
      !name ||
      !company ||
      !nomorktp ||
      !phone ||
      !email ||
      !address ||
      !idCardFile
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const fileArrayBuffer = await idCardFile.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);

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
        id_card: fileBuffer,
      },
    });

    return NextResponse.json(
      { message: "Visitor registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
