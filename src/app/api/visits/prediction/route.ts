// app/api/visits/prediction/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import regression from 'regression';

const prisma = new PrismaClient();

// --- Helper Functions ---
function addWeeks(date: Date, weeks: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + weeks * 7);
    return result;
}

function addMonths(date: Date, months: number): Date {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    if (d.getDate() < date.getDate()) {
        d.setDate(0);
    }
    return d;
}

// Simple function to determine trend based on start/end prediction
function determineTrend(startValue: number, endValue: number): 'up' | 'down' | 'stable' {
    const diff = endValue - startValue;
    const percentageChange = startValue === 0 ? (endValue > 0 ? Infinity : 0) : (diff / startValue);

    if (Math.abs(percentageChange) < 0.05) { // Less than 5% change considered stable
        return 'stable';
    } else if (diff > 0) {
        return 'up';
    } else {
        return 'down';
    }
}

// --- Constants ---
const HISTORICAL_WEEKS = 104; // Approx 2 years for weekly prediction
const PREDICTION_HORIZON_WEEKS = 26; // Approx 6 months
const HISTORICAL_MONTHS_FOR_CATEGORY = 12; // History for Dept/Company models
const PREDICTION_HORIZON_MONTHS = 6;
const TOP_N_CATEGORIES = 3; // Number of top Depts/Companies to predict
const MIN_DATA_POINTS_WEEKLY = 8;
const MIN_DATA_POINTS_MONTHLY = 4;
const REGRESSION_DEGREE = 2; // Polynomial degree

// --- Main Handler ---
export async function GET() {
    const now = new Date();

    try {
        // === 1. Weekly Prediction for Total Visits ===
        const weeklyStartDate = addWeeks(now, -HISTORICAL_WEEKS);
        const weeklyHistoricalRaw = await prisma.$queryRaw<Array<{ week_start: Date, visit_count: bigint }>>`
            SELECT
                (entry_start_date - (EXTRACT(ISODOW FROM entry_start_date) - 1) * INTERVAL '1 day')::DATE AS week_start,
                COUNT(*) AS visit_count
            FROM visit
            WHERE entry_start_date >= ${weeklyStartDate} AND entry_start_date <= ${now}
            GROUP BY week_start
            ORDER BY week_start ASC;
        `;
        const weeklyHistorical = weeklyHistoricalRaw.map(d => ({ time: d.week_start, value: Number(d.visit_count) }));
        const weeklyPredicted: Array<{ time: Date, value: number }> = [];
        let weeklyMessage: string | undefined = undefined;
        const combinedWeeklyData: Array<{ time: Date; historicalValue: number | null; predictedValue: number | null }> = [];

        if (weeklyHistorical.length >= MIN_DATA_POINTS_WEEKLY) {
            const weeklyDataPoints: Array<[number, number]> = weeklyHistorical.map((row, index) => [index, row.value]);
            try {
                const weeklyModel = regression.polynomial(weeklyDataPoints, { order: REGRESSION_DEGREE, precision: 5 });
                const lastHistoricalWeek = weeklyHistorical[weeklyHistorical.length - 1].time;
                const historicalLength = weeklyDataPoints.length;

                for (let i = 1; i <= PREDICTION_HORIZON_WEEKS; i++) {
                    const futureIndex = historicalLength - 1 + i;
                    const prediction = weeklyModel.predict(futureIndex);
                    weeklyPredicted.push({
                        time: addWeeks(lastHistoricalWeek, i),
                        value: Math.max(0, Math.round(prediction[1]))
                    });
                }
            } catch (e) { weeklyMessage = "Could not generate weekly prediction model."; console.error("Weekly regression failed:", e); }
        } else {
            weeklyMessage = "Not enough historical weekly data for prediction.";
        }

        // Prepare combined data for the chart
        weeklyHistorical.forEach(p => combinedWeeklyData.push({ time: p.time, historicalValue: p.value, predictedValue: null }));
        weeklyPredicted.forEach(p => combinedWeeklyData.push({ time: p.time, historicalValue: null, predictedValue: p.value }));


        // === 2. Predictions for Top Departments ===
        const categoryStartDate = addMonths(now, -HISTORICAL_MONTHS_FOR_CATEGORY);
        const topDepartmentsRaw = await prisma.$queryRaw<Array<{ department: string, total_visits: bigint }>>`
            SELECT e.department, COUNT(*) as total_visits
            FROM visit v
            JOIN employee e ON v.employee_id = e.employee_id
            WHERE v.entry_start_date >= ${categoryStartDate} AND v.entry_start_date <= ${now}
              AND e.department IS NOT NULL AND e.department <> ''
            GROUP BY e.department
            ORDER BY total_visits DESC
            LIMIT ${TOP_N_CATEGORIES};
        `;
        const topDepartments = topDepartmentsRaw.map(d => d.department);
        const departmentPredictions: Array<{ name: string, predictedValue: number, trend: 'up' | 'down' | 'stable' }> = [];

        for (const dept of topDepartments) {
            const deptMonthlyRaw = await prisma.$queryRaw<Array<{ month_start: Date, visit_count: bigint }>>`
                SELECT DATE_TRUNC('month', v.entry_start_date)::DATE AS month_start, COUNT(*) AS visit_count
                FROM visit v
                JOIN employee e ON v.employee_id = e.employee_id
                WHERE e.department = ${dept}
                  AND v.entry_start_date >= ${categoryStartDate} AND v.entry_start_date <= ${now}
                GROUP BY month_start
                ORDER BY month_start ASC;
            `;
            const deptMonthly = deptMonthlyRaw.map(d => ({ time: d.month_start, value: Number(d.visit_count) }));

            if (deptMonthly.length >= MIN_DATA_POINTS_MONTHLY) {
                const dataPoints: Array<[number, number]> = deptMonthly.map((r, i) => [i, r.value]);
                try {
                    // Use linear for categories, often less volatile than polynomial
                    const model = regression.linear(dataPoints, { precision: 5 });
                    const histLen = dataPoints.length;

                    let totalPredicted = 0;
                    let firstPrediction = 0;
                    let lastPrediction = 0;

                    for (let i = 1; i <= PREDICTION_HORIZON_MONTHS; i++) {
                        const pred = model.predict(histLen - 1 + i);
                        const val = Math.max(0, Math.round(pred[1]));
                        totalPredicted += val;
                        if (i === 1) firstPrediction = val;
                        if (i === PREDICTION_HORIZON_MONTHS) lastPrediction = val;
                    }

                    departmentPredictions.push({
                        name: dept,
                        predictedValue: totalPredicted,
                        trend: determineTrend(firstPrediction, lastPrediction)
                    });
                } catch (e) { console.error(`Regression failed for Dept: ${dept}`, e); }
            }
        }

        // === 3. Predictions for Top Companies ===
        const topCompaniesRaw = await prisma.$queryRaw<Array<{ company_name: string, total_visits: bigint }>>`
            SELECT c.company_name, COUNT(*) as total_visits
            FROM visit v
            JOIN visitor vi ON v.visitor_id = vi.visitor_id
            JOIN company c ON vi.company_id = c.company_id
            WHERE v.entry_start_date >= ${categoryStartDate} AND v.entry_start_date <= ${now}
              AND c.company_name IS NOT NULL AND c.company_name <> ''
            GROUP BY c.company_name
            ORDER BY total_visits DESC
            LIMIT ${TOP_N_CATEGORIES};
        `;
        const topCompanies = topCompaniesRaw.map(c => c.company_name);
        const companyPredictions: Array<{ name: string, predictedValue: number, trend: 'up' | 'down' | 'stable' }> = [];

         for (const comp of topCompanies) {
            const compMonthlyRaw = await prisma.$queryRaw<Array<{ month_start: Date, visit_count: bigint }>>`
                SELECT DATE_TRUNC('month', v.entry_start_date)::DATE AS month_start, COUNT(*) AS visit_count
                FROM visit v
                JOIN visitor vi ON v.visitor_id = vi.visitor_id
                JOIN company c ON vi.company_id = c.company_id
                WHERE c.company_name = ${comp}
                  AND v.entry_start_date >= ${categoryStartDate} AND v.entry_start_date <= ${now}
                GROUP BY month_start
                ORDER BY month_start ASC;
            `;
            const compMonthly = compMonthlyRaw.map(d => ({ time: d.month_start, value: Number(d.visit_count) }));

            if (compMonthly.length >= MIN_DATA_POINTS_MONTHLY) {
                const dataPoints: Array<[number, number]> = compMonthly.map((r, i) => [i, r.value]);
                try {
                    const model = regression.linear(dataPoints, { precision: 5 });
                    const histLen = dataPoints.length;

                    let totalPredicted = 0;
                    let firstPrediction = 0;
                    let lastPrediction = 0;

                     for (let i = 1; i <= PREDICTION_HORIZON_MONTHS; i++) {
                        const pred = model.predict(histLen - 1 + i);
                        const val = Math.max(0, Math.round(pred[1]));
                        totalPredicted += val;
                        if (i === 1) firstPrediction = val;
                        if (i === PREDICTION_HORIZON_MONTHS) lastPrediction = val;
                    }

                    companyPredictions.push({
                        name: comp,
                        predictedValue: totalPredicted,
                        trend: determineTrend(firstPrediction, lastPrediction)
                    });
                } catch (e) { console.error(`Regression failed for Company: ${comp}`, e); }
            }
        }


        // === 4. Return All Data ===
        return NextResponse.json({
            weeklyPrediction: {
                data: combinedWeeklyData,
                message: weeklyMessage
            },
            departmentTrends: departmentPredictions,
            companyTrends: companyPredictions
        });

    } catch (error) {
        console.error("Error fetching prediction data:", error);
        return NextResponse.json(
            { error: "Failed to fetch prediction data" },
            { status: 500 }
        );
    }
}