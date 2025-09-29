import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Schema for CLO Report Analysis
const cloReportSchema = z.object({
  strengthPoints: z.array(z.string()).describe("List of strength points identified in the CLO analysis"),
  weaknessPoints: z.array(z.string()).describe("List of weakness points identified in the CLO analysis"),
  recommendations: z.array(z.string()).describe("List of actionable recommendations for improvement")
});

// Schema for SO Report Analysis
const soReportSchema = z.object({
  centralTendency: z.string().describe("Analysis of the central tendency of the data distribution"),
  distributionShape: z.string().describe("Description of the distribution shape (normal, skewed, etc.)"),
  spread: z.string().describe("Analysis of data spread and range"),
  performanceInsight: z.string().describe("Insights about student performance patterns"),
  performanceBenchmarking: z.string().describe("Benchmarking analysis and recommendations")
});

// Prompt configurations
const promptConfigs = [
  {
    slug: 'clo-report',
    prompt: `You are an educational assessment expert analyzing Course Learning Outcomes (CLOs) data following international quality assurance standards for higher education.

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

**Format Guidelines:**
- Strengths: Highlight what is working well
- Weaknesses: Identify specific improvement areas
- Recommendations: Provide clear, actionable steps

**Example Format:**
Strengths:
- Students demonstrated high proficiency in critical thinking and problem-solving tasks.
- The majority of learners met or exceeded knowledge benchmarks in all modules.

Weaknesses:
- Practical skill application is inconsistent across students.
- Assessment alignment with soft skills is weak in certain courses.

Recommendations:
- Incorporate more hands-on projects to strengthen practical skills.
- Review and revise assessments to better measure soft skills outcomes.

**Note:** Follow NCAAA Saudi guidelines and provide analysis as a human educational assessment expert would.`,
    schema: cloReportSchema,
    description: "Analyzes CLO (Course Learning Outcomes) data to identify strengths, weaknesses, and recommendations"
  },
  
  {
    slug: 'so-report',
    prompt: `You are a statistical analysis expert examining student performance data following international quality assurance standards for higher education.

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

**Format Guidelines:**
- Strengths: Highlight effective assessment patterns
- Weaknesses: Identify specific statistical concerns
- Recommendations: Provide clear, actionable improvement steps

**Example Format:**
Distribution Shape:
- The curve presents a symmetrical bell-shaped pattern, closely resembling a normal distribution.
- This shape suggests a balanced assessment where student scores are evenly distributed around a central value, without significant skewness.

Performance Insight:
- There is a complete absence of scores below 70 and above 85, indicating no representation of either low-performing or top-performing students.
- These tiers can be mapped to Course Learning Outcomes (CLOs) to evaluate how well students are achieving expected competencies and to identify areas needing reinforcement or enrichment.

Assessment Quality:
- The bell-shaped curve indicates effective assessment design with appropriate difficulty levels.
- Performance tiers can be used to define actionable improvement steps for assessments.

**Note:** Follow NCAAA Saudi guidelines and provide analysis as a human statistical assessment expert would.`,
    schema: soReportSchema,
    description: "Analyzes student performance data from histograms and bell curves to provide statistical insights"
  }
];

// Helper function to get config by slug
function getPromptConfig(slug) {
  const config = promptConfigs.find(config => config.slug === slug);
  if (!config) {
    throw new Error(`No prompt configuration found for slug: ${slug}`);
  }
  return config;
}

/**
 * Analyzes report data using AI based on the provided slug
 * @param {string} slug - The type of report to analyze ('clo-report' or 'so-report')
 * @param {any} data - The data to analyze (CLO groups data or performance data)
 * @returns Structured analysis results
 */
async function analyzeReport(slug, data) {
  try {
    console.log(`🤖 Starting AI analysis for ${slug}...`);
    
    // Get the prompt configuration for the given slug
    const config = getPromptConfig(slug);
    
    // Replace the data placeholder in the prompt
    const prompt = config.prompt.replace('{{data}}', JSON.stringify(data, null, 2));
    
    console.log(`📝 Prompt prepared, calling Gemini...`);
    
    // Generate structured output using Gemini Flash
    const result = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      prompt,
      schema: config.schema,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    console.log(`✅ AI analysis completed for ${slug}`);
    return result.object;

  } catch (error) {
    console.error('❌ Error analyzing report:', error);
    throw new Error(`Failed to analyze ${slug} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'AI Analysis Server'
  });
});

// Main AI analysis endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { slug, data } = req.body;

    // Validate input
    if (!slug || !data) {
      return res.status(400).json({
        error: 'Missing required fields: slug and data are required'
      });
    }

    // Validate slug
    const validSlugs = ['clo-report', 'so-report'];
    if (!validSlugs.includes(slug)) {
      return res.status(400).json({
        error: `Invalid slug. Must be one of: ${validSlugs.join(', ')}`
      });
    }

    console.log(`📊 Received analysis request for ${slug}`);
    
    // Perform AI analysis
    const result = await analyzeReport(slug, data);
    
    console.log(`🎉 Analysis completed successfully for ${slug}`);
    
    res.json({
      success: true,
      slug,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health - Health check',
      'POST /analyze - AI analysis endpoint'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Analysis Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Analysis endpoint: http://localhost:${PORT}/analyze`);
  console.log(`🔑 Make sure GOOGLE_GENERATIVE_AI_API_KEY is set in environment`);
});

export default app;