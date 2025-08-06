# Implementation Plan

- [x] 1. Create centralized classification engine





  - Implement TypeScript interfaces for classification system
  - Create classification rules configuration object with department, level, and exception rules
  - Write core classification logic function that takes position data and returns consistent classification
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 2. Implement classification rules for all departments





  - Define department-specific classification rules (Line=direct, Quality=indirect/OH, CE=direct/OH, etc.)
  - Implement level-based override rules (PM=OH, LM=OH)
  - Create exception rules for special cases (CE TM Mixing=direct, FG WH TM Shipping=OH, etc.)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Create validation engine for consistency checking





  - Implement position validation function that checks classification consistency across pages
  - Write aggregation validation logic that verifies totals match detailed views
  - Create validation reporting system with detailed error messages and inconsistency detection
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Update Page1 to use centralized classification





  - Modify page1.tsx to use classification engine instead of hardcoded colorCategory values
  - Update separated processes (No-sew, HF Welding) to use consistent classification logic
  - Ensure all InteractivePositionBox components receive validated classifications
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Update Page2 and Page3 classification logic





  - Modify page2 department classification logic to use centralized engine
  - Update page3 support department classifications to use centralized engine
  - Ensure getColorCategory functions are replaced with centralized classification calls
  - _Requirements: 1.1, 1.2_

- [x] 6. Fix Page4-indirect aggregation logic




  - Update page4-indirect.tsx to use validated classifications from centralized engine
  - Fix CE TM personnel classification to appear in correct aggregation page
  - Ensure separated processes (No-sew, HF Welding) are correctly classified in aggregations
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Update Page4-direct aggregation logic





  - Modify page4-direct.tsx to only include positions classified as Direct by centralized engine
  - Ensure aggregation totals match the detailed view classifications
  - Implement cross-validation between direct and indirect aggregation pages
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 8. Implement comprehensive validation tests










  - Create unit tests for classification engine covering all department and level combinations
  - Write integration tests that validate consistency across all pages
  - Implement aggregation validation tests that verify totals match detailed views
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 9. Add validation reporting and error handling





  - Create validation report component that displays classification inconsistencies
  - Implement error logging for classification failures and validation issues
  - Add graceful error handling with fallback classification logic
  - _Requirements: 3.4, 3.5_

- [x] 10. Create data consistency validation utility





  - Write utility function that can be run to validate entire application data consistency
  - Implement automated testing that runs validation checks on different configuration scenarios
  - Create validation summary report showing classification distribution and any issues
  - _Requirements: 2.4, 2.5, 3.1, 3.2, 3.3_