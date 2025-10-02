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
5. Ensure compliance with NCAAA Saudi quality assurance standards

**Output Requirements:**
- IMPORTANT: Do not include AI stuff or sound AI generated like, And Do not use Clo clo or lower case it , alway use CLO as uppercased, in all cases
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
- IMPORTANT: Do not include AI stuff or sound AI generated like, And Do not use Clo clo or lower case it , alway use CLO as uppercased, in all cases
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
