# Excel Styling Fix Design

## Overview

This design addresses the Excel styling issues by implementing a hybrid approach that combines XLSX library capabilities with HTML-based formatting to ensure reliable styling that works across different Excel versions and environments.

## Architecture

### Component Structure
```
lib/utils/
├── excel-generator.ts (Enhanced with reliable styling)
├── excel-styles.ts (Style definitions and utilities)
└── html-to-excel.ts (HTML table conversion utilities)
```

### Styling Strategy

1. **Primary Approach**: Use XLSX with enhanced styling configuration
2. **Fallback Approach**: Generate HTML table with CSS styling that Excel can interpret
3. **Hybrid Approach**: Combine both methods for maximum compatibility

## Components and Interfaces

### Enhanced Excel Generator

```typescript
interface ExcelStyleConfig {
  headerBackgroundColor: string;
  headerFontColor: string;
  headerFontSize: number;
  dataFontSize: number;
  borderStyle: 'thin' | 'medium' | 'thick';
  alignment: {
    horizontal: 'center' | 'left' | 'right';
    vertical: 'center' | 'top' | 'bottom';
  };
}

interface CellStyle {
  fill?: { fgColor: { rgb: string } };
  font?: { bold?: boolean; sz?: number; color?: { rgb: string } };
  alignment?: { horizontal: string; vertical: string; wrapText?: boolean };
  border?: {
    top: { style: string; color?: { rgb: string } };
    bottom: { style: string; color?: { rgb: string } };
    left: { style: string; color?: { rgb: string } };
    right: { style: string; color?: { rgb: string } };
  };
}
```

### Style Application Methods

1. **Direct XLSX Styling**: Apply styles directly to worksheet cells
2. **HTML Template Generation**: Create styled HTML table for Excel import
3. **Cell-by-Cell Formatting**: Iterate through each cell to apply consistent styling

## Data Models

### Styled Worksheet Structure
```
Row 1: [S No] [Level] [Course Name & Code] [CLOs] [CLO Achievement (merged)]
Row 2: [    ] [     ] [                  ] [    ] [Direct] [Indirect]
Row 3+: Data rows with proper styling and alignment
```

### Style Inheritance
- Headers inherit from `headerStyle` configuration
- Data cells inherit from `dataStyle` configuration
- Merged cells maintain parent cell styling

## Error Handling

### Styling Fallbacks
1. If XLSX styling fails → Use HTML table approach
2. If HTML approach fails → Generate basic Excel without styling
3. If all approaches fail → Return CSV format as last resort

### Dependency Management
- No additional npm packages required
- Use only existing XLSX library
- Implement custom styling utilities

## Testing Strategy

### Style Verification
1. Generate test Excel file with sample data
2. Verify header background colors are applied
3. Confirm all content is center-aligned
4. Check border visibility and consistency
5. Test merged cell formatting

### Cross-Platform Testing
1. Test on different Excel versions (2016, 2019, 365)
2. Verify compatibility with LibreOffice Calc
3. Test on different operating systems (Windows, Mac)

### Performance Testing
1. Test with large datasets (100+ courses)
2. Measure generation time
3. Verify memory usage remains acceptable