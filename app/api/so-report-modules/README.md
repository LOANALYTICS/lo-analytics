# SO Report Modular API Structure

This folder contains the modular breakdown of the SO (Student Outcome) report generation system to avoid Vercel's 10-second API timeout limit.

## API Endpoints

### 1. `/api/so-report-data` (GET)
**Purpose**: Calculate and process all assessment data, performance analysis, and performance curves.

**Parameters**:
- `courseId` (required): Course ID
- `academicYear` (required): Academic year
- `section` (required): Course section

**Response**: JSON object containing:
- `assessmentData`: Grade distribution by assessment type
- `overallGrades`: Overall grade distribution
- `course`: Course information
- `college`: College information  
- `performanceAnalysis`: Student performance analysis with Z-scores
- `performanceCurveData`: Performance curve statistics and ranges

**Timeout**: ~3-5 seconds (database queries + calculations)

### 2. `/api/so-report-ai` (POST)
**Purpose**: Generate AI analysis and comments for the report.

**Body**:
```json
{
  "performanceAnalysis": {...},
  "performanceCurveData": {...}
}
```

**Response**: JSON object containing:
- `centralTendency`: AI analysis of central tendency
- `distributionShape`: AI analysis of distribution shape
- `spread`: AI analysis of data spread
- `performanceInsight`: AI performance insights
- `performanceBenchmarking`: AI benchmarking analysis
- `normalDistributionData`: Normal distribution curve data points

**Timeout**: ~5-8 seconds (AI analysis with 8s timeout + fallback)

### 3. `/api/so-report-generate` (POST)
**Purpose**: Generate the final HTML report from processed data.

**Body**:
```json
{
  "assessmentData": {...},
  "overallGrades": {...},
  "course": {...},
  "college": {...},
  "performanceAnalysis": {...},
  "performanceCurveData": {...},
  "comments": {...},
  "coordinator": "string"
}
```

**Response**: HTML content for PDF generation

**Timeout**: ~1-2 seconds (HTML template generation)

### 4. `/api/so-report` (GET) - Legacy
**Purpose**: Orchestrator that calls the above APIs in sequence (for backward compatibility).

## Usage in Frontend

The `AssessmentCard.tsx` component now calls these APIs sequentially:

1. **Data Calculation**: Calls `/api/so-report-data` to get processed data
2. **AI Analysis**: Calls `/api/so-report-ai` with the processed data (with fallback)
3. **HTML Generation**: Calls `/api/so-report-generate` with all data and AI comments
4. **PDF Generation**: Uses the returned HTML to generate PDF

## Benefits

1. **Timeout Prevention**: Each API stays well under 10s limit
2. **Error Isolation**: If AI fails, report still generates with defaults
3. **Modularity**: Each step can be optimized independently
4. **Reusability**: APIs can be used by other components
5. **Debugging**: Easier to debug specific steps

## Utilities

- `lib/utils/so-report-utils.ts`: Shared utility functions and types
- Includes grade calculation, normal distribution, and default comment functions

## Error Handling

- Each API has proper error handling and fallbacks
- AI analysis has timeout protection (8s) with default comments
- Frontend shows loading states for each step
- Graceful degradation if any step fails

## Performance Notes

- Database queries are optimized with parallel execution
- Single-pass algorithms for data processing
- AI analysis runs with timeout protection
- HTML generation is lightweight template processing