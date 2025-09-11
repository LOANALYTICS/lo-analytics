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
    prompt: `You are an educational assessment expert analyzing Course Learning Outcomes (CLOs) data. 

Given the following CLO groups data: {{data}}

Please analyze this data and provide a comprehensive assessment in the following structure:

**Analysis Guidelines:**
1. Look for achievement levels vs target levels
2. Identify patterns in direct vs indirect assessment results
3. Consider student satisfaction scores and their implications
4. Evaluate the balance between different types of CLOs (knowledge, skills, values, etc.)
5. Look for areas of exceptional performance and areas needing improvement

**Output Requirements:**
- Provide specific, actionable insights
- Base recommendations on actual data patterns
- Consider both quantitative metrics and qualitative implications
- Focus on practical improvement strategies

Return your analysis in the specified JSON format with strength points, weakness points, and recommendations.`,
    schema: cloReportSchema,
    description: "Analyzes CLO (Course Learning Outcomes) data to identify strengths, weaknesses, and recommendations"
  },
  {
    slug: 'so-report',
    prompt: `You are a statistical analysis expert examining student performance data from histogram and bell curve distributions.

Given the following performance data: {{data}}

Please analyze this data and provide insights in the following areas:

**Analysis Guidelines:**
1. **Central Tendency**: Identify where most scores cluster (mean, median, mode)
2. **Distribution Shape**: Analyze if the data follows normal distribution, identify skewness
3. **Spread**: Examine the range, standard deviation, and identify any outliers
4. **Performance Insight**: Interpret what the distribution tells us about student performance
5. **Performance Benchmarking**: Compare against expected norms and provide recommendations

**Key Considerations:**
- Look for patterns in score distribution
- Identify if there are gaps in performance ranges
- Consider implications for assessment validity
- Suggest improvements based on distribution analysis

Return your analysis in the specified JSON format covering all five analytical areas.`,
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
