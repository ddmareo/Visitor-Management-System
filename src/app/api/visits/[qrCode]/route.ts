import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { decryptBinary } from "@/utils/encryption";

const prisma = new PrismaClient();

const visitCategoryMapping = {
  Meeting___Visits: "Meeting & Visits",
  Delivery: "Delivery",
  Working__Project___Repair_: "Working (Project & Repair)",
  VIP: "VIP",
} as const;

// Function to convert Buffer to Base64
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export async function GET(
  _request: Request,
  { params }: { params: { qrCode: string } }
) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session?.user?.role !== "security" &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "sec_admin")
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { qrCode } = params;

  if (!qrCode) {
    return new Response(JSON.stringify({ error: "QR code is required" }), {
      status: 400,
    });
  }

  try {
    const visit = await prisma.visit.findFirst({
      where: { qr_code: qrCode },
      include: {
        visitor: {
          select: {
            id_card: true,
            name: true,
            company_id: true,
            company: {
              select: {
                company_name: true,
              },
            },
            face_scan: true,
          },
        },
        employee: {
          select: {
            name: true,
          },
        },
        security: {
          select: {
            security_name: true,
          },
        },
        teammember: {
          select: {
            member_name: true,
          },
        },
      },
    });

    // If no visit is found, return an error
    if (!visit) {
      return new Response(JSON.stringify({ error: "Visitor not found" }), {
        status: 404,
      });
    }

    const mappedCategory =
      visitCategoryMapping[
        visit.visit_category as keyof typeof visitCategoryMapping
      ] || visit.visit_category;

    // Process face scan - convert to base64 if it exists
    let faceScanBase64 = null;
    if (visit.visitor?.face_scan) {
      // Assuming face_scan is stored as Buffer in the database
      // If it's already encrypted, you'd need to decrypt it first
      const faceScanBuffer = decryptBinary(visit.visitor.face_scan);

      // Convert Buffer to Base64
      faceScanBase64 = bufferToBase64(faceScanBuffer);
      
      // Create data URL format for use in image elements
      faceScanBase64 = `data:image/jpeg;base64,${faceScanBase64}`;
    }

    // Transform the visit data to match the expected format
    const transformedVisit = {
      ...visit,
      id_card: visit.visitor?.id_card,
      visitor_name: visit.visitor?.name || "-",
      employee_name: visit.employee?.name || "-",
      security_name: visit.security?.security_name || "-",
      company_institution: visit.visitor?.company?.company_name,
      team_members: visit.teammember.map((member) => member.member_name),
      visit_category: mappedCategory,
      face_scan: faceScanBase64, // Now contains the base64 data URL
    };

    return new Response(JSON.stringify(transformedVisit), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching visit by QR code:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch visit" }), {
      status: 500,
    });
  }
}