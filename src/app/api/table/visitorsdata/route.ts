import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const authResponse = await withAuth(request);

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const tableData = await prisma.visitor.findMany({
      orderBy: {
        registration_date: "desc",
      },
    });

    return NextResponse.json(tableData, { status: 200 });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return NextResponse.json(
      { message: "Failed to fetch visitors" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authResponse = await withAuth(request);

  if (authResponse instanceof Response) {
    return authResponse;
  }

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty ids array" },
        { status: 400 }
      );
    }

    const result = await prisma.visitor.deleteMany({
      where: {
        visitor_id: {
          in: ids.map((id) => parseInt(id)),
        },
      },
    });

    return NextResponse.json(
      {
        message: "Visitors deleted successfully",
        count: result.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting visitors:", error);
    return NextResponse.json(
      { message: "Failed to delete visitors" },
      { status: 500 }
    );
  }
}
