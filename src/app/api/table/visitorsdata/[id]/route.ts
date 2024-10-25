import { withAuth } from "@/lib/with-auth";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const authResponse = await withAuth(req);

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const data = await req.json();
    const updatedVisitor = await prisma.visitor.update({
      where: {
        visitor_id: parseInt(params.id, 10),
      },
      data: {
        name: data.name,
        company_institution: data.company_institution,
        id_number: data.id_number,
        contact_phone: data.contact_phone,
        contact_email: data.contact_email,
        address: data.address,
      },
    });
    return NextResponse.json(updatedVisitor);
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating visitor" },
      { status: 500 }
    );
  }
}
