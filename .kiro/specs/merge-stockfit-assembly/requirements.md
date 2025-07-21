# Requirements Document

## Introduction

This feature involves modifying the organization chart application to simplify the production line structure by removing the stockfit ratio configuration and merging the Stockfit and Assembly groups into a single unified group. This change will streamline the user interface and organizational structure while maintaining all essential functionality.

## Requirements

### Requirement 1

**User Story:** As a manufacturing manager, I want the stockfit ratio configuration removed from the interface, so that I don't have unnecessary complexity in my production line setup.

#### Acceptance Criteria

1. WHEN the user accesses the configuration panel THEN the "Stockfit 비율" (Stockfit Ratio) dropdown SHALL be completely removed
2. WHEN the system initializes THEN it SHALL NOT reference or use stockfitRatio configuration values
3. WHEN the user views the organization chart THEN there SHALL be no visual indication of stockfit ratio settings

### Requirement 2

**User Story:** As a production planner, I want the Stockfit and Assembly groups displayed as a single merged group in visualization pages, so that I have a simplified organizational chart view while maintaining separate data for calculations.

#### Acceptance Criteria

1. WHEN the system renders organization chart displays (like Page 1) THEN the separate GL(Stockfit) and GL(Assembly) positions SHALL be shown as a single GL(Stockfit-Assembly) position
2. WHEN the system displays TL positions in visualization pages THEN the Stockfit TL and Assembly TL positions SHALL be combined under the merged GL display
3. WHEN the user views line-specific organization charts THEN each line SHALL show the unified Stockfit-Assembly structure in the display
4. WHEN the system calculates total personnel counts for display THEN the merged group SHALL include all personnel from both original Stockfit and Assembly groups

### Requirement 3

**User Story:** As a data analyst, I want stockfit and assembly to remain separate in data input and calculation pages, so that I can maintain accurate process-specific data while having simplified visualization.

#### Acceptance Criteria

1. WHEN the user inputs data in Page 6 THEN stockfit and assembly processes SHALL remain as separate, distinct entries
2. WHEN the system performs calculations in Pages 4 and 5 THEN it SHALL use separate stockfit and assembly data for manpower calculations (man asy)
3. WHEN the system processes model data for calculations THEN it SHALL maintain the distinction between stockfit and assembly processes
4. WHEN the system stores process data THEN it SHALL preserve separate stockfit and assembly process information

### Requirement 4

**User Story:** As a user, I want the interface to remain intuitive after the changes, so that I can continue using the application without confusion.

#### Acceptance Criteria

1. WHEN the user interacts with position boxes THEN the merged Stockfit-Assembly positions SHALL provide appropriate tooltips and information
2. WHEN the user views personnel summaries THEN the counts SHALL accurately reflect the merged structure
3. WHEN the user navigates between different views THEN the merged structure SHALL be consistent across all pages
4. WHEN the user selects different models for lines THEN the merged structure SHALL adapt appropriately to the selected model's processes