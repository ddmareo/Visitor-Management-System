import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
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

    const hashedPassword = data.password
      ? await hash(data.password, 12)
      : undefined;

    const updatedUser = await prisma.users.update({
      where: {
        user_id: parseInt(params.id, 10),
      },
      data: {
        username: data.username,
        password: hashedPassword ? hashedPassword : undefined,
        role: data.role,
        employee_id: data.employee_id,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}
