import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _request: Request,
  { params }: { params: { nik: string } }
) {
  const nik = params.nik;

  if (!nik) {
    return NextResponse.json(
      { error: "Missing NIK parameter" },
      { status: 400 }
    );
  }

  try {
    const visitor = await prisma.visitor.findUnique({
      where: { id_number: nik },
      select: {
        name: true,
        company: {
          select: {
            company_name: true,
          },
        },
      },
    });

    if (visitor) {
      return NextResponse.json(
        {
          exists: true,
          visitor: {
            name: visitor.name,
            company_name: visitor.company?.company_name || null,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ exists: false }, { status: 200 });
    }
  } catch (error) {
    console.error("Error retrieving visitor:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
