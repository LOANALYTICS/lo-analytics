// Legacy SO report route - now orchestrates the modular APIs
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Legacy orchestrator - redirects to new modular approach
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const courseId = searchParams.get('courseId');
        const academicYear = searchParams.get('academicYear');
        const section = searchParams.get('section');
        const coordinator = searchParams.get('coordinator');
        
        if (!courseId) {
            return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
        }

        // Step 1: Get report data
        const dataResponse = await fetch(`${request.url.split('/api')[0]}/api/so-report-data?courseId=${courseId}&academicYear=${academicYear}&section=${section}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!dataResponse.ok) {
            throw new Error('Failed to get report data');
        }

        const reportData = await dataResponse.json();

        // Step 2: Get AI analysis (with fallback)
        let aiComments;
        try {
            const aiResponse = await fetch(`${request.url.split('/api')[0]}/api/so-report-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    performanceAnalysis: reportData.performanceAnalysis,
                    performanceCurveData: reportData.performanceCurveData
                })
            });

            if (aiResponse.ok) {
                aiComments = await aiResponse.json();
            } else {
                throw new Error('AI analysis failed');
            }
        } catch (error) {
            console.warn('Using default AI comments:', error);
            aiComments = {
                centralTendency: `Mean: ${reportData.performanceCurveData?.statistics.mean || 'N/A'}%`,
                distributionShape: "Normal distribution pattern",
                spread: `Range: ${reportData.performanceCurveData?.statistics.min || 'N/A'}% - ${reportData.performanceCurveData?.statistics.max || 'N/A'}%`,
                performanceInsight: "Performance analysis based on statistical distribution",
                performanceBenchmarking: "Benchmarked against normal distribution curve"
            };
        }

        // Step 3: Generate HTML
        const htmlResponse = await fetch(`${request.url.split('/api')[0]}/api/so-report-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...reportData,
                comments: aiComments,
                coordinator
            })
        });

        if (!htmlResponse.ok) {
            throw new Error('Failed to generate HTML');
        }

        const html = await htmlResponse.text();
        return new NextResponse(html, {
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
        });

    } catch (error) {
        console.error('Error in SO report orchestrator:', error);
        return NextResponse.json({
            message: 'Error generating SO report',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
