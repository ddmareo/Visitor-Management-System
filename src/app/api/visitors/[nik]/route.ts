import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "@/utils/encryption";

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
    const visitors = await prisma.visitor.findMany({
      select: {
        id_number: true,
        name: true,
        company: {
          select: { company_name: true },
        },
      },
    });

    const matchedVisitor = visitors.find((visitor) => {
      const decryptedId = decrypt(visitor.id_number);
      const decryptedNikParams = decrypt(nik);
      return decryptedId === decryptedNikParams;
    });

    if (matchedVisitor) {
      return NextResponse.json(
        {
          exists: true,
          visitor: {
            name: matchedVisitor.name,
            company_name: matchedVisitor.company?.company_name || null,
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
