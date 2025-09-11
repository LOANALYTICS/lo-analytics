# AI Analysis Setup Guide

## Environment Variables

Add the following to your `.env.local` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

## Usage

### In your route files (e.g., `app/api/generate-clo-report/route.ts`):

```typescript
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
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
```

### For SO Report Analysis:

```typescript
import { analyzeReport } from '../../../ai/analyze-report';

// In your SO report route
const aiAnalysis = await analyzeReport('so-report', {
  histogram: yourHistogramData,
  bellCurve: yourBellCurveData
});
```

## Available Slugs

- `clo-report`: Analyzes CLO data for strengths, weaknesses, and recommendations
- `so-report`: Analyzes student performance data from histograms and bell curves

## Adding New Report Types

To add a new report type, simply add a new configuration to `ai/prompt-configs.ts`:

```typescript
{
  slug: 'new-report-type',
  prompt: 'Your prompt template with {{data}} placeholder',
  schema: yourZodSchema,
  description: 'Description of what this analysis does'
}
```
