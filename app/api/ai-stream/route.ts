// Streaming AI Analysis API - Bypasses 10s timeout
import { streamObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Schema for SO Report Analysis
const soReportSchema = z.object({
  centralTendency: z.string().describe("Analysis of the central tendency of the data distribution"),
  distributionShape: z.string().describe("Description of the distribution shape (normal, skewed, etc.)"),
  spread: z.string().describe("Analysis of data spread and range"),
  performanceInsight: z.string().describe("Insights about student performance patterns"),
  performanceBenchmarking: z.string().describe("Benchmarking analysis and recommendations")
});

// Schema for CLO Report Analysis
const cloReportSchema = z.object({
  strengthPoints: z.array(z.string()).describe("List of strength points identified in the CLO analysis"),
  weaknessPoints: z.array(z.string()).describe("List of weakness points identified in the CLO analysis"),
  recommendations: z.array(z.string()).describe("List of actionable recommendations for improvement")
});

const prompts = {
  'so-report': `You are a statistical analysis expert examining student performance data following international quality assurance standards for higher education.

Given the following performance data: {{data}}

Please analyze this data and provide concise insights following quality assurance guidelines:

**Analysis Guidelines:**
1. Central Tendency: Identify score clustering patterns (mean, median, mode)
2. Distribution Shape: Analyze normal distribution compliance and skewness
3. Performance Spread: Examine range, standard deviation, and outliers
4. Assessment Validity: Evaluate distribution implications for learning outcomes
5. Quality Benchmarking: Compare against NCAAA Saudi quality assurance standards

**Output Requirements:**
- Keep each point SHORT and DESCRIPTIVE (maximum 2 sentences)
- Focus on specific, measurable statistical observations
- Base recommendations on actual data evidence
- Follow quality assurance best practices
- Ensure points are actionable and implementable

**Note:** Follow NCAAA Saudi guidelines and provide analysis as a human statistical assessment expert would.`,

  'clo-report': `You are an educational assessment expert analyzing Course Learning Outcomes (CLOs) data following international quality assurance standards for higher education.

Given the following CLO groups data: {{data}}

Please analyze this data and provide a concise assessment following quality assurance guidelines:

**Analysis Guidelines:**
1. Compare achievement levels against target benchmarks
2. Evaluate direct vs indirect assessment alignment
3. Assess curriculum balance across knowledge, skills, and values domains
4. Identify performance gaps and excellence areas
5. Ensure compliance with NCAAA Saudi quality assurance standards

**Output Requirements:**
- Keep each point SHORT and DESCRIPTIVE (maximum 2 sentences)
- Focus on specific, measurable observations
- Base recommendations on actual data evidence
- Follow quality assurance best practices
- Ensure points are actionable and implementable

**Note:** Follow NCAAA Saudi guidelines and provide analysis as a human educational assessment expert would.`
};

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { slug, data } = await request.json();

    if (!slug || !data) {
      return new Response('Missing slug or data', { status: 400 });
    }

    if (!prompts[slug as keyof typeof prompts]) {
      return new Response('Invalid slug', { status: 400 });
    }

    const prompt = prompts[slug as keyof typeof prompts].replace('{{data}}', JSON.stringify(data, null, 2));
    const schema = slug === 'so-report' ? soReportSchema : cloReportSchema;

    console.log(`🚀 Starting streaming AI analysis for ${slug}...`);

    console.log(`🚀 Starting streaming for ${slug}...`);

    // Create a proper streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Start streaming immediately to keep connection alive
          controller.enqueue(encoder.encode('data: {"status":"started"}\n\n'));

          // Stream the AI response
          const result = streamObject({
            model: google('gemini-2.0-flash-exp'),
            prompt,
            schema,
            temperature: 0.3,
          });

          // Stream each partial result as it comes
          for await (const partialObject of result.partialObjectStream) {
            const chunk = JSON.stringify({
              type: 'partial',
              data: partialObject
            });
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          }

          // Send final result
          const finalResult = await result.object;
          const finalChunk = JSON.stringify({
            type: 'complete',
            data: finalResult
          });
          controller.enqueue(encoder.encode(`data: ${finalChunk}\n\n`));

          console.log(`✅ Streaming completed for ${slug}`);
          controller.close();

        } catch (error) {
          console.error(`❌ Streaming error for ${slug}:`, error);
          const errorChunk = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          controller.enqueue(encoder.encode(`data: ${errorChunk}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('❌ Streaming AI error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}