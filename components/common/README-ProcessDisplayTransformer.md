# Process Display Transformer

This module provides functionality to transform process data for display purposes, specifically merging stockfit and assembly processes while preserving individual process data for calculations.

## Overview

The `ProcessDisplayTransformer.ts` module implements the requirements from the "Merge Stockfit-Assembly" feature, which simplifies the production line structure by displaying Stockfit and Assembly as a single unified group in visualization pages while maintaining separate data for calculations.

## Key Components

### ProcessDisplayTransformer.ts

- `mergeStockfitAssembly`: Merges stockfit and assembly process groups for display purposes
- `calculateTotalManpower`: Calculates the total manpower from a list of processes
- `shouldMergeProcesses`: Determines if processes should be merged based on context
- `transformProcessGroups`: Transforms process groups based on context (display or calculation)

### Integration with ReactFlowPage1.tsx

The `getProcessGroups` function in ReactFlowPage1.tsx has been updated to:
- Accept a `context` parameter ('display' or 'calculation')
- Apply the process transformation based on the context
- Default to 'display' context for backward compatibility

## Usage

### Display Context (Visual Representation)

When used with 'display' context, stockfit and assembly processes are merged into a single "Stockfit-Assembly" group:

```typescript
// For visualization pages (like Page 1)
const { mainProcesses } = getProcessGroups(config, selectedModel, lineIndex, 'display');
```

### Calculation Context (Data Processing)

When used with 'calculation' context, stockfit and assembly processes remain separate:

```typescript
// For calculation pages (like Pages 4 and 5)
const { mainProcesses } = getProcessGroups(config, selectedModel, lineIndex, 'calculation');
```

## Data Preservation

The merged process group maintains references to the original stockfit and assembly process data in the `sourceProcesses` property, ensuring that all calculation logic can still access the separate process data when needed.

## Testing

Unit tests and integration tests are provided to verify the functionality:
- `ProcessDisplayTransformer.test.ts`: Unit tests for the transformer functions
- `ProcessDisplayTransformer.integration.test.ts`: Integration tests with ReactFlowPage1