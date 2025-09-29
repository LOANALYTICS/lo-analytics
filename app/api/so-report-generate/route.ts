// SO Report HTML Generation API - Step 3
import { NextResponse } from "next/server";
import { generateSOHTML } from "@/templates/so-report";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { 
            assessmentData, 
            overallGrades, 
            course, 
            college, 
            performanceAnalysis, 
            performanceCurveData, 
            comments,
            coordinator 
        } = await request.json();

        // Validate required data
        if (!assessmentData || !overallGrades || !course || !college) {
            return NextResponse.json({ 
                message: 'Missing required data for HTML generation' 
            }, { status: 400 });
        }

        // Generate HTML content
        const htmlContent = generateSOHTML({
            assessmentData,
            overallGrades,
            course: {
                ...course,
                coordinator: coordinator || 'N/A'
            },
            college,
            performanceAnalysis,
            performanceCurveData,
            comments
        });

        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
        });

    } catch (error) {
        console.error('Error generating SO report HTML:', error);
        return NextResponse.json({
            message: 'Error generating SO report HTML',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}