import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

const transformData = (data: any[]) => {
  return data.map((item) => {
    const transformed = { ...item };
    if ("visits" in item) {
      transformed.visits = Number(item.visits);
    }
    if ("total_visits" in item) {
      transformed.total_visits = Number(item.total_visits);
    }
    if ("average_visits" in item) {
      transformed.average_visits = Number(item.average_visits);
    }
    if ("peak_visits" in item) {
      transformed.peak_visits = Number(item.peak_visits);
    }
    return transformed;
  });
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const date = searchParams.get("date");

  try {
    let visitsData;
    let timeDistribution;
    let statsData;

    if (period === "monthly") {
      const [year, month] = date!.split("-").map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const monthlyData = await prisma.$queryRaw`
        SELECT 
          DATE(entry_start_date)::text as day, 
          CAST(COUNT(*) AS INTEGER) as visits
        FROM visit
        WHERE entry_start_date >= ${startDate} 
        AND entry_start_date < ${endDate}
        GROUP BY DATE(entry_start_date)
        ORDER BY day
      `;

      visitsData = transformData(monthlyData as any[]);

      statsData = await prisma.$queryRaw`
  SELECT
    (SELECT COUNT(*) FROM visit WHERE entry_start_date >= ${startDate} AND entry_start_date < ${endDate}) AS total_visits,
    CAST(ROUND(AVG(daily_visits)) AS INTEGER) as average_visits,
    CAST(MAX(daily_visits) AS INTEGER) as peak_visits
  FROM (
    SELECT DATE(entry_start_date), COUNT(*) AS daily_visits
    FROM visit
    WHERE entry_start_date >= ${startDate} AND entry_start_date < ${endDate}
    GROUP BY DATE(entry_start_date)
  ) AS daily_visits;
`;
    } else if (period === "yearly") {
      const year = parseInt(date!);

      const yearlyData = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(entry_start_date, 'Mon') as month,
          CAST(COUNT(*) AS INTEGER) as visits
        FROM visit
        WHERE EXTRACT(YEAR FROM entry_start_date) = ${year}
        GROUP BY EXTRACT(MONTH FROM entry_start_date), TO_CHAR(entry_start_date, 'Mon')
        ORDER BY EXTRACT(MONTH FROM entry_start_date)
      `;

      visitsData = transformData(yearlyData as any[]);

      statsData = await prisma.$queryRaw`
  SELECT
    (SELECT COUNT(*) FROM visit WHERE EXTRACT(YEAR FROM entry_start_date) = ${year}) AS total_visits,
    CAST(ROUND(AVG(monthly_visits)) AS INTEGER) as average_visits,
    CAST(MAX(monthly_visits) AS INTEGER) as peak_visits
  FROM (
    SELECT EXTRACT(MONTH FROM entry_start_date) AS month, COUNT(*) AS monthly_visits
    FROM visit
    WHERE EXTRACT(YEAR FROM entry_start_date) = ${year}
    GROUP BY EXTRACT(MONTH FROM entry_start_date)
  ) AS monthly_visits;
`;
    }

    const timeData = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(check_in_time, 'HH24:00') as time,
        CAST(COUNT(*) AS INTEGER) as visits
      FROM visit
      WHERE check_in_time IS NOT NULL
      GROUP BY TO_CHAR(check_in_time, 'HH24:00')
      ORDER BY time
    `;
    timeDistribution = transformData(timeData as any[]);

    const stats = transformData(statsData as any[])[0];

    return NextResponse.json({
      visitsData,
      timeDistribution,
      stats,
    });
  } catch (error) {
    console.error("Error fetching visit data:", error);
    return NextResponse.json(
      { error: "Failed to fetch visit data" },
      { status: 500 }
    );
  }
}
