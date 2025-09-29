// CLO Report HTML Generation API - Step 3
import { NextResponse } from "next/server";
import { generateCloReportHTML } from "@/templates/cloReport";
import { generatePloGroupReportHTML } from "@/templates/ploGroupReport";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { 
            course,
            college,
            assessmentData,
            indirectAssessmentData,
            plogroups,
            benchmark,
            coordinator,
            aiComments
        } = await request.json();

        // Validate required data
        if (!course || !college || !assessmentData || !plogroups) {
            return NextResponse.json({ 
                message: 'Missing required data for HTML generation' 
            }, { status: 400 });
        }

        // Generate CLO HTML content
        const cloHtml = await generateCloReportHTML({
            course: {
                ...course,
                coordinator: coordinator || 'N/A'
            },
            college,
            assessmentData,
            indirectAssessmentData,
            plogroups,
            benchmark
        });

        // Generate PLO HTML content
        const ploHtml = await generatePloGroupReportHTML({
            course: {
                ...course,
                coordinator: coordinator || 'N/A'
            },
            college,
            plogroups,
            benchmark,
            comments: aiComments
        });

        return NextResponse.json({
            cloHtml,
            ploHtml,
            plogroups
        });

    } catch (error) {
        console.error('Error generating CLO report HTML:', error);
        return NextResponse.json({
            message: 'Error generating CLO report HTML',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}