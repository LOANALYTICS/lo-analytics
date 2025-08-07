# Design Document

## Overview

The PLO Achievement Excel feature extends the existing semester assessment report by adding Program Learning Outcome columns that show how Course Learning Outcomes map to PLOs with their achievement data.

## Architecture

The solution involves:
1. **Data Layer**: Fetch PLO mapping data from Assessment model's cloData field
2. **Processing Layer**: Generate PLO headers and populate achievement values based on CLO-to-PLO mappings
3. **Presentation Layer**: Render PLO columns in Excel with proper formatting and styling

## Components and Interfaces

### 1. Database Query Enhancement
- **Location**: `app/api/generate-assess-report/route.ts`
- **Purpose**: Ensure PLO mapping data is included in assessment query
- **Changes**: Verify `cloData` field contains `ploMapping` structure

### 2. Excel Generator Enhancement  
- **Location**: `lib/utils/excel-generator.ts`
- **Purpose**: Generate PLO Achievement columns with proper headers and data
- **Changes**: 
  - Add PLO header generation logic
  - Add PLO data population logic
  - Add PLO column styling

### 3. Data Structure
```typescript
interface CLOData {
  clo: string;
  description: string;
  ploMapping: {
    k: Array<{ [key: string]: boolean }>; // Knowledge PLOs
    s: Array<{ [key: string]: boolean }>; // Skills PLOs  
    v: Array<{ [key: string]: boolean }>; // Values PLOs
  };
}
```

## Data Models

### PLO Achievement Column Structure
```
| CLO Achievement | PLO Achievement                                    |
| Direct | Indirect | K1      | K2      | K3      | K4      | S1      | S2      | S3      | V1      |
|        |          | D | I   | D | I   | D | I   | D | I   | D | I   | D | I   | D | I   | D | I   |
```

### PLO Data Population Logic
1. For each CLO row, check `cloData.ploMapping`
2. For each PLO category (K, S, V):
   - If CLO maps to PLO (boolean = true): Show CLO achievement percentage
   - If CLO doesn't map to PLO (boolean = false): Show empty cell

## Error Handling

1. **Missing PLO Data**: If `ploMapping` is undefined, skip PLO columns generation
2. **Partial PLO Data**: If some CLOs have PLO mapping and others don't, use available data
3. **Invalid PLO Structure**: Validate PLO mapping structure before processing

## Testing Strategy

1. **Unit Tests**: Test PLO header generation with various PLO structures
2. **Integration Tests**: Test Excel generation with real assessment data
3. **Edge Cases**: Test with missing PLO data, empty mappings, and malformed data
4. **Visual Tests**: Verify Excel output matches expected format and styling