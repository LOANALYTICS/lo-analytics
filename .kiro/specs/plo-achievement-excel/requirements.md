# Requirements Document

## Introduction

This feature adds PLO (Program Learning Outcome) Achievement columns to the semester assessment Excel report. The Excel report currently shows CLO Achievement data but is missing the PLO Achievement columns that display how each CLO maps to specific PLOs with their achievement percentages.

## Requirements

### Requirement 1

**User Story:** As an academic administrator, I want to see PLO Achievement columns in the Excel report, so that I can analyze how Course Learning Outcomes map to Program Learning Outcomes with their achievement data.

#### Acceptance Criteria

1. WHEN generating the semester assessment Excel report THEN the system SHALL include PLO Achievement columns after the CLO Achievement columns
2. WHEN PLO data exists for a course THEN the system SHALL display K1, K2, K3, K4 columns (Knowledge PLOs) with Direct and Indirect sub-columns
3. WHEN PLO data exists for a course THEN the system SHALL display S1, S2, S3 columns (Skills PLOs) with Direct and Indirect sub-columns  
4. WHEN PLO data exists for a course THEN the system SHALL display V1 column (Values PLO) with Direct and Indirect sub-columns
5. WHEN a CLO maps to a specific PLO THEN the system SHALL show the achievement percentage in the corresponding PLO column
6. WHEN a CLO does not map to a specific PLO THEN the system SHALL leave the corresponding PLO column empty

### Requirement 2

**User Story:** As an academic administrator, I want the PLO Achievement columns to have proper headers and formatting, so that the Excel report is professional and easy to read.

#### Acceptance Criteria

1. WHEN generating the Excel report THEN the system SHALL create merged headers for each PLO (K1 spanning Direct/Indirect columns)
2. WHEN generating the Excel report THEN the system SHALL apply yellow background color to PLO headers
3. WHEN generating the Excel report THEN the system SHALL center-align all PLO Achievement data
4. WHEN generating the Excel report THEN the system SHALL apply borders to all PLO Achievement cells

### Requirement 3

**User Story:** As a developer, I want the system to fetch PLO mapping data from the database, so that the Excel report shows accurate PLO-to-CLO relationships.

#### Acceptance Criteria

1. WHEN fetching assessment data THEN the system SHALL retrieve PLO mapping information for each CLO
2. WHEN PLO mapping data is missing THEN the system SHALL handle the case gracefully without breaking the Excel generation
3. WHEN multiple courses have different PLO structures THEN the system SHALL use the first available PLO structure for header generation
4. WHEN calculating PLO achievement values THEN the system SHALL use the same achievement percentages as the corresponding CLO

Note: existing should not be touched
