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
    const updatedVisit = await prisma.visit.update({
      where: {
        visit_id: parseInt(params.id, 10),
      },
      data: {
        visit_category: data.visit_category,
        entry_date: new Date(data.entry_date),
        entry_method: data.entry_method,
        vehicle_number: data.vehicle_number || null,
      },
    });
    return NextResponse.json(updatedVisit);
  } catch (error) {
    return NextResponse.json(
      { error: "Error updating visit" },
      { status: 500 }
    );
  }
}
