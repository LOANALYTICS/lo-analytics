import { NextResponse } from 'next/server';
import { analyzeReport } from '../../../ai/analyze-report';
import { generateCommentsReportHTML } from '@/templates/ploGroupReport';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plogroups } = body;

    if (!plogroups) {
      return NextResponse.json({
        message: 'Required data missing for AI analysis',
        status: 'error'
      }, { status: 400 });
    }

    // Perform AI analysis
    let aiAnalysis: { strengthPoints: string[]; weaknessPoints: string[]; recommendations: string[] } | undefined;
    try {
      console.log('🤖 Starting AI analysis for CLO report...');
      const result = await analyzeReport('clo-report', { plogroups });
      aiAnalysis = result as { strengthPoints: string[]; weaknessPoints: string[]; recommendations: string[] };
      console.log('✅ AI Analysis Result:', aiAnalysis, JSON.stringify(aiAnalysis, null, 2));
    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
      return NextResponse.json({
        message: 'AI analysis failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Generate Comments HTML using the separate template
    const commentsHtml = await generateCommentsReportHTML(aiAnalysis);

    return NextResponse.json({
      aiAnalysis,
      commentsHtml
    });

  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return NextResponse.json({
      message: 'Error generating AI analysis',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
