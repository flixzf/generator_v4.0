# Requirements Document

## Introduction

This feature addresses critical data consistency issues in the organization chart application's personnel classification and aggregation logic. The system currently has inconsistencies in how Direct, Indirect, and OH (Overhead) personnel are labeled and counted across different views, leading to inaccurate reporting and analysis.

## Requirements

### Requirement 1

**User Story:** As a manufacturing manager, I want consistent box representation logic across all pages, so that personnel classifications (Direct, Indirect, OH) are accurately displayed throughout the application.

#### Acceptance Criteria

1. WHEN viewing any page THEN the system SHALL apply consistent color coding and labeling for Direct, Indirect, and OH personnel
2. WHEN a position is classified as Direct on one page THEN it SHALL be classified as Direct on all other pages
3. WHEN separated processes (No-sew, HF Welding) are displayed THEN their GL positions SHALL be consistently classified according to the established logic
4. IF a position involves direct production work THEN the system SHALL classify it as "direct"
5. IF a position involves support or management work THEN the system SHALL classify it as "indirect" or "OH" based on organizational level

### Requirement 2

**User Story:** As a production planner, I want accurate data aggregation in summary pages, so that personnel counts match the detailed views and provide reliable planning data.

#### Acceptance Criteria

1. WHEN viewing page4-direct THEN the system SHALL only include personnel classified as Direct in the detailed views and plus, we don't need 'Man stt" column any more.
2. WHEN viewing page4-indirect THEN the system SHALL only include personnel classified as Indirect in the detailed views
3. WHEN CE TM personnel are classified as Direct in detailed views THEN they SHALL appear in page4-direct, not page4-indirect, this logic(direct must be counted in direct page, indirect must be counted in indirect page so do OH ) are adopted all boxes.
4. WHEN calculating totals THEN the system SHALL ensure sum of Direct + Indirect + OH equals the total personnel count
5. IF a position classification changes in the source logic THEN all aggregation pages SHALL reflect this change consistently

### Requirement 3

**User Story:** As a system administrator, I want validation mechanisms to detect classification inconsistencies, so that data integrity issues can be identified and resolved proactively.

#### Acceptance Criteria

1. WHEN the system processes personnel data THEN it SHALL validate that each position has a consistent classification across all pages
2. WHEN inconsistencies are detected THEN the system SHALL log detailed information about the discrepancies
3. WHEN running validation checks THEN the system SHALL verify that aggregation totals match detailed view counts
4. IF validation fails THEN the system SHALL provide clear error messages indicating which positions have inconsistent classifications
5. WHEN validation passes THEN the system SHALL confirm that all personnel classifications are consistent across the application