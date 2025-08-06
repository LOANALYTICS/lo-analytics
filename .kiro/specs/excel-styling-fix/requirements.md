# Excel Styling Fix Requirements

## Introduction

The current Excel generation system is not applying proper styling (colors, alignment, borders) to the generated assessment reports. The XLSX library's styling capabilities are limited and npm package installation is failing. We need a robust solution that provides properly formatted Excel files with center alignment and header colors.

## Requirements

### Requirement 1

**User Story:** As a user generating assessment reports, I want the Excel file to have properly styled headers with yellow background color, so that the report looks professional and is easy to read.

#### Acceptance Criteria

1. WHEN the Excel file is generated THEN the header rows SHALL have a yellow background color (#FFFF00)
2. WHEN the Excel file is generated THEN the header text SHALL be bold and centered
3. WHEN the Excel file is generated THEN the headers SHALL be clearly distinguishable from data rows

### Requirement 2

**User Story:** As a user viewing the assessment report, I want all content to be center-aligned in the Excel cells, so that the data is presented in a clean and organized manner.

#### Acceptance Criteria

1. WHEN the Excel file is generated THEN all cell content SHALL be horizontally centered
2. WHEN the Excel file is generated THEN all cell content SHALL be vertically centered
3. WHEN the Excel file is generated THEN the alignment SHALL be consistent across all cells

### Requirement 3

**User Story:** As a user reviewing the assessment data, I want clear borders around all cells, so that I can easily distinguish between different data points.

#### Acceptance Criteria

1. WHEN the Excel file is generated THEN all cells SHALL have thin black borders
2. WHEN the Excel file is generated THEN the borders SHALL be visible and consistent
3. WHEN the Excel file is generated THEN the table structure SHALL be clearly defined

### Requirement 4

**User Story:** As a developer maintaining the system, I want the Excel generation to work without requiring additional npm packages that may fail to install, so that the system is reliable and doesn't break due to dependency issues.

#### Acceptance Criteria

1. WHEN generating Excel files THEN the system SHALL use only existing dependencies
2. WHEN the Excel utility is called THEN it SHALL not require installing exceljs or other external packages
3. WHEN npm install fails THEN the Excel generation SHALL still work with available libraries

### Requirement 5

**User Story:** As a user downloading assessment reports, I want the Excel file to maintain proper structure with merged cells for course information, so that each course's data is clearly grouped and organized.

#### Acceptance Criteria

1. WHEN a course has multiple CLOs THEN the course information (S No, Level, Course Name) SHALL span multiple rows
2. WHEN the Excel file is generated THEN merged cells SHALL be properly formatted
3. WHEN viewing the report THEN each course's CLO data SHALL be visually grouped together