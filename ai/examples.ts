// Example usage of the AI analysis function in your routes

import { analyzeReport } from './analyze-report';

// Example CLO data structure (similar to your plogroups)
export const exampleCloData = {
  plogroups: [
    {
      cloId: "CLO1",
      cloDescription: "Demonstrate knowledge of fundamental concepts",
      targetLevel: 75,
      actualLevel: 78,
      achievementMethod: "direct",
      studentSatisfaction: 96
    },
    {
      cloId: "CLO2", 
      cloDescription: "Apply analytical skills in problem-solving",
      targetLevel: 80,
      actualLevel: 100,
      achievementMethod: "direct",
      studentSatisfaction: 98
    },
    {
      cloId: "CLO3",
      cloDescription: "Demonstrate professional values and ethics",
      targetLevel: 85,
      actualLevel: 100,
      achievementMethod: "direct", 
      studentSatisfaction: 97
    },
    {
      cloId: "CLO4",
      cloDescription: "Work autonomously and take responsibility",
      targetLevel: 80,
      actualLevel: 100,
      achievementMethod: "direct",
      studentSatisfaction: 98
    }
  ]
};

// Example SO (Student Outcomes) data structure
export const exampleSoData = {
  histogram: {
    scoreRanges: [
      { range: "60-65", count: 2 },
      { range: "65-70", count: 5 },
      { range: "70-75", count: 8 },
      { range: "75-80", count: 15 },
      { range: "80-85", count: 12 },
      { range: "85-90", count: 6 },
      { range: "90-95", count: 2 },
      { range: "95-100", count: 0 }
    ],
    totalStudents: 50,
    mean: 76.4,
    median: 78,
    mode: 78,
    standardDeviation: 8.2
  },
  bellCurve: {
    distribution: "normal",
    skewness: "slightly_left_skewed",
    kurtosis: "mesokurtic",
    outliers: []
  }
};

// Example usage in your route (like generate-clo-report/route.ts):
export const exampleRouteUsage = `
// In your route file (e.g., app/api/generate-clo-report/route.ts):

import { analyzeReport } from '../../../ai/analyze-report';

export async function POST(request: NextRequest) {
  try {
    // Your existing code...
    const plogroups = buildCloDiagnostics60(processedData, assessmentData);
    
    // Add AI analysis
    const aiAnalysis = await analyzeReport('clo-report', { plogroups });
    
    // Use the analysis in your response
    return NextResponse.json({
      // ... your existing response data
      aiAnalysis: {
        strengthPoints: aiAnalysis.strengthPoints,
        weaknessPoints: aiAnalysis.weaknessPoints,
        recommendations: aiAnalysis.recommendations
      }
    });
    
  } catch (error) {
    // Handle errors
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
`;

// Example usage for SO report:
export const exampleSoUsage = `
// For SO report analysis:

import { analyzeReport } from '../../../ai/analyze-report';

export async function POST(request: NextRequest) {
  try {
    // Your existing code to get histogram/bell curve data...
    const performanceData = {
      histogram: yourHistogramData,
      bellCurve: yourBellCurveData
    };
    
    // Add AI analysis
    const aiAnalysis = await analyzeReport('so-report', performanceData);
    
    return NextResponse.json({
      // ... your existing response data
      aiAnalysis: {
        centralTendency: aiAnalysis.centralTendency,
        distributionShape: aiAnalysis.distributionShape,
        spread: aiAnalysis.spread,
        performanceInsight: aiAnalysis.performanceInsight,
        performanceBenchmarking: aiAnalysis.performanceBenchmarking
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
`;
