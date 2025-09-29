// SO Report Utility Functions
export interface GradeCount {
    'A+': number;
    'A': number;
    'B+': number;
    'B': number;
    'C+': number;
    'C': number;
    'D+': number;
    'D': number;
    'F': number;
}

export interface CourseData {
  course_name: string;
  level: number;
  academic_year: string;
  section: string;
  semister: number;
  department: string;
  course_code: string;
  credit_hours: string;
  collage: {
    logo: string;
    english: string;
    regional: string;
    university: string;
  };
}

// Helper function to get grade from percentage
export const getGrade = (percentage: number): keyof GradeCount => {
    if (percentage >= 95) return 'A+';
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 65) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
};

// Initialize empty grade count object
export const initializeGradeCount = (): GradeCount => ({
    'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0
});

// Normal distribution function (equivalent to NORM.DIST in Excel)
export const normalDistribution = (x: number, mean: number, stdDev: number): number => {
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    return coefficient * Math.exp(exponent);
};

// Generate normal distribution data points
export const generateNormalDistributionData = (mean: number, stdDev: number): Array<{ x: number; value: number }> => {
    const data = [];
    for (let x = 60; x <= 100; x++) {
        const value = normalDistribution(x, mean, stdDev) * 97;
        data.push({ x, value });
    }
    return data;
};

// Default AI comments fallback
export const getDefaultAIComments = (performanceCurveData: any) => ({
    centralTendency: `Mean: ${performanceCurveData?.statistics.mean || 'N/A'}%`,
    distributionShape: "Normal distribution pattern",
    spread: `Range: ${performanceCurveData?.statistics.min || 'N/A'}% - ${performanceCurveData?.statistics.max || 'N/A'}%`,
    performanceInsight: "Performance analysis based on statistical distribution",
    performanceBenchmarking: "Benchmarked against normal distribution curve"
});