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

    //To fix the hashed password getting hashed, so the code matches the existing password first with the new password
    const existingUser = await prisma.users.findUnique({
      where: {
        user_id: parseInt(params.id, 10),
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const passwordToUpdate = data.password
      ? data.password !== existingUser.password
        ? await hash(data.password, 12)
        : data.password
      : undefined;

    const updatedUser = await prisma.users.update({
      where: {
        user_id: parseInt(params.id, 10),
      },
      data: {
        username: data.username,
        password: passwordToUpdate,
        role: data.role,
        employee_id: data.employee_id,
        security_id: data.security_id,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json({ error: "Error updating user" }, { status: 500 });
  }
}
