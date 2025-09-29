// SO Report Statistics-Only API - Fast Alternative to AI
import { NextResponse } from "next/server";
import { generateNormalDistributionData, getDefaultAIComments } from "@/lib/utils/so-report-utils";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { performanceAnalysis, performanceCurveData } = await request.json();

        if (!performanceAnalysis || !performanceCurveData) {
            return NextResponse.json({ 
                message: 'Performance analysis and curve data are required' 
            }, { status: 400 });
        }

        // Generate normal distribution data
        const mean = performanceAnalysis.overall.mean;
        const stdDev = performanceAnalysis.overall.stdDev;
        const normalDistributionData = generateNormalDistributionData(mean, stdDev);

        // Generate enhanced statistical comments (no AI needed)
        const stats = performanceCurveData.statistics;
        const enhancedComments = {
            centralTendency: `The class average is ${stats.mean}% with a median of ${stats.median}%. This indicates ${
                Math.abs(parseFloat(stats.mean) - parseFloat(stats.median)) < 2 
                    ? 'a well-balanced distribution' 
                    : parseFloat(stats.mean) > parseFloat(stats.median) 
                        ? 'some high performers pulling the average up'
                        : 'the majority performing above the mean'
            }.`,
            
            distributionShape: `The performance distribution spans from ${stats.min}% to ${stats.max}%, showing ${
                parseFloat(stats.max) - parseFloat(stats.min) > 40 
                    ? 'significant variation in student performance'
                    : parseFloat(stats.max) - parseFloat(stats.min) > 20
                        ? 'moderate variation in student performance'
                        : 'relatively consistent performance across students'
            }.`,
            
            spread: `With a range of ${(parseFloat(stats.max) - parseFloat(stats.min)).toFixed(1)} percentage points, the class shows ${
                stdDev > 15 ? 'high variability' : stdDev > 10 ? 'moderate variability' : 'low variability'
            } (σ = ${stdDev.toFixed(1)}).`,
            
            performanceInsight: `${
                parseFloat(stats.mean) >= 80 
                    ? 'Overall performance is strong, indicating effective learning outcomes.'
                    : parseFloat(stats.mean) >= 70
                        ? 'Performance is satisfactory with room for improvement in some areas.'
                        : 'Performance indicates need for additional support and intervention strategies.'
            }`,
            
            performanceBenchmarking: `Compared to typical academic distributions, this class ${
                parseFloat(stats.mean) >= 75 && stdDev < 12
                    ? 'demonstrates above-average performance with good consistency'
                    : parseFloat(stats.mean) >= 70
                        ? 'shows average performance levels'
                        : 'may benefit from curriculum review and additional support measures'
            }.`,
            
            normalDistributionData
        };

        return NextResponse.json(enhancedComments);

    } catch (error) {
        console.error('Error in SO report statistics analysis:', error);
        return NextResponse.json({
            message: 'Error generating statistical analysis',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}