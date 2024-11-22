import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";

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
    const updatedCompany = await prisma.company.update({
      where: {
        company_id: parseInt(params.id, 10),
      },
      data: {
        company_name: data.company_name,
      },
    });
    return NextResponse.json(updatedCompany);
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating company" },
      { status: 500 }
    );
  }
}
