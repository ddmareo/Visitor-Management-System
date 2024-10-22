import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nomorktp = searchParams.get("nomorktp");

  if (!nomorktp) {
    return NextResponse.json(
      { error: "Missing 'nomorktp' query parameter" },
      { status: 400 }
    );
  }

  try {
    const visitor = await prisma.visitor.findUnique({
      where: { id_number: nomorktp },
      select: { name: true, company_institution: true },
    });

    if (visitor) {
      return NextResponse.json({ exists: true, visitor }, { status: 200 });
    } else {
      return NextResponse.json({ exists: false }, { status: 200 });
    }
  } catch (error) {
    console.error("Error retrieving visitor:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
