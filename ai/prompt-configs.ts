import { z } from 'zod';

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

// Prompt configurations for different report types
export const promptConfigs = [
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
5. Ensure compliance with quality assurance standards

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
Distribution Shape:
- The curve presents a symmetrical bell-shaped pattern, closely resembling a normal distribution.
- This shape suggests a balanced assessment where student scores are evenly distributed around a central value, without significant skewness.

Performance Insight:
- There is a complete absence of scores below 70 and above 85, indicating no representation of either low-performing or top-performing students.
- This distribution can be used to define performance tiers: 70–75: Developing proficiency, 75–80: Competent, 80–85: Approaching mastery.

Assessment Quality:
- The bell-shaped curve indicates effective assessment design with appropriate difficulty levels.
- These tiers can be mapped to Course Learning Outcomes (CLOs) to evaluate how well students are achieving expected competencies and to identify areas needing reinforcement or enrichment.

Return your analysis in the specified JSON format with concise strength points, weakness points, and recommendations following this example format.`,
    schema: cloReportSchema,
    description: "Analyzes CLO (Course Learning Outcomes) data to identify strengths, weaknesses, and recommendations"
  },
  {
    slug: 'so-report',
    prompt: `You are a statistical analysis expert examining student performance data following international quality assurance standards for higher education.

Given the following performance data: {{data}}

Please analyze this data and provide concise insights following quality assurance guidelines:

**Analysis Guidelines:**
1. **Central Tendency**: Identify score clustering patterns (mean, median, mode)
2. **Distribution Shape**: Analyze normal distribution compliance and skewness
3. **Performance Spread**: Examine range, standard deviation, and outliers
4. **Assessment Validity**: Evaluate distribution implications for learning outcomes
5. **Quality Benchmarking**: Compare against quality assurance standards

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

Return your analysis in the specified JSON format with concise strength points, weakness points, and recommendations.`,
    schema: soReportSchema,
    description: "Analyzes student performance data from histograms and bell curves to provide statistical insights"
  }
];

// Helper function to get config by slug
export function getPromptConfig(slug: string) {
  const config = promptConfigs.find(config => config.slug === slug);
  if (!config) {
    throw new Error(`No prompt configuration found for slug: ${slug}`);
  }
  return config;
}

// Type definitions for better TypeScript support
export type PromptConfig = typeof promptConfigs[0];
export type CloReportOutput = z.infer<typeof cloReportSchema>;
export type SoReportOutput = z.infer<typeof soReportSchema>;
