import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const idCardFile = formData.get("idCard") as File;
    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const isNewCompany = formData.get("isNewCompany") as string;
    const nomorktp = formData.get("nomorktp") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;
    const address = formData.get("address") as string;

    if (
      !name ||
      !company ||
      !nomorktp ||
      !phone ||
      !email ||
      !address ||
      !idCardFile
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const fileArrayBuffer = await idCardFile.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);

    const watermarkedImage = await sharp(fileBuffer)
      .metadata()
      .then(({ width, height }) => {
        if (!width || !height) {
          throw new Error("Could not determine image dimensions.");
        }

        const fontSize = Math.min(width, height) * 0.1;
        const spacing = fontSize * 2;

        const createTiledWatermarkSVG = () => {
          let svgContent = `<svg width="${width}" height="${height}">`;

          for (let x = -spacing; x < width + spacing; x += spacing * 1.5) {
            for (let y = -spacing; y < height + spacing; y += spacing * 1.5) {
              const rotationAngle = -30 + (Math.random() * 20 - 10);

              svgContent += `
              <text 
                x="${x}" 
                y="${y}" 
                font-size="${fontSize}" 
                font-weight="bold" 
                fill="black" 
                opacity="0.3" 
                text-anchor="middle" 
                alignment-baseline="middle" 
                transform="rotate(${rotationAngle} ${x} ${y})">
                UNTUK ALVA PLANT
              </text>`;
            }
          }

          svgContent += `</svg>`;
          return svgContent;
        };

        return sharp(fileBuffer)
          .composite([
            {
              input: Buffer.from(createTiledWatermarkSVG()),
            },
          ])
          .toBuffer();
      });

    const existingVisitor = await prisma.visitor.findUnique({
      where: { id_number: nomorktp },
    });

    if (existingVisitor) {
      return NextResponse.json(
        { error: "NIK already exists" },
        { status: 400 }
      );
    }

    let companyId: number;

    if (isNewCompany === "true") {
      const newCompany = await prisma.company.create({
        data: {
          company_name: company,
        },
      });
      companyId = newCompany.company_id;
    } else {
      companyId = parseInt(company, 10);
      if (isNaN(companyId)) {
        return NextResponse.json(
          { error: "Invalid company ID" },
          { status: 400 }
        );
      }
    }

    await prisma.visitor.create({
      data: {
        name,
        company_id: companyId,
        id_number: nomorktp,
        contact_phone: phone,
        contact_email: email,
        address,
        id_card: watermarkedImage,
      },
    });

    return NextResponse.json(
      { message: "Visitor registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      select: {
        company_id: true,
        company_name: true,
      },
      orderBy: {
        company_name: "asc",
      },
    });

    const transformedCompanies = companies.map((company) => ({
      id: company.company_id.toString(),
      name: company.company_name,
    }));

    return NextResponse.json(transformedCompanies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
