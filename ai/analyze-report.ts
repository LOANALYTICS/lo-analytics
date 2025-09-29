import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { getPromptConfig } from './prompt-configs';

/**
 * Analyzes report data using AI based on the provided slug
 * @param slug - The type of report to analyze ('clo-report' or 'so-report')
 * @param data - The data to analyze (CLO groups data or performance data)
 * @returns Structured analysis results
 */
export async function analyzeReport(slug: string, data: any) {
  try {
    console.log('entered')
    // Get the prompt configuration for the given slug
    const config = getPromptConfig(slug);

    // Replace the data placeholder in the prompt
    const prompt = config.prompt.replace('{{data}}', JSON.stringify(data, null, 2));

    // Generate structured output using Gemini Flash
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      prompt,
      schema: config.schema,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    return result.object;

  } catch (error) {
    console.error('Error analyzing report:', error);
    throw new Error(`Failed to analyze ${slug} report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
