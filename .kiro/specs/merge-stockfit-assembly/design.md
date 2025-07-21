# Design Document

## Overview

This design outlines the modifications needed to remove the stockfit ratio configuration and merge the visual display of Stockfit and Assembly groups while maintaining their separation in data input and calculation contexts. The changes primarily affect the user interface components, data processing logic, and visualization rendering.

## Architecture

The solution involves a layered approach where:
- **Data Layer**: Maintains separate stockfit and assembly process data
- **Processing Layer**: Continues to calculate stockfit and assembly separately for accuracy
- **Presentation Layer**: Merges stockfit and assembly for display purposes only

### Key Components Affected

1. **Configuration Management**: Remove stockfit ratio from config interface and data structures
2. **Process Grouping Logic**: Modify display logic to merge stockfit/assembly while preserving calculation logic
3. **UI Components**: Update Page 1 visualization and configuration panels
4. **Data Models**: Maintain separation in underlying data while providing merged views

## Components and Interfaces

### Configuration Interface Changes

**Component**: Page1 Configuration Panel
- **Remove**: Stockfit ratio dropdown and related controls
- **Update**: Configuration state management to exclude stockfitRatio
- **Preserve**: All other configuration options (line count, shifts, mini lines, etc.)

**Interface Changes**:
```typescript
// Remove stockfitRatio from Config interface
interface Config {
  lineCount: number;
  shiftsCount: number;
  miniLineCount: number;
  hasTonguePrefit: boolean;
  // stockfitRatio: string; // REMOVE THIS
  cuttingPrefitCount: number;
  stitchingCount: number;
  stockfitCount: number;
  assemblyCount: number;
}
```

### Process Grouping Logic

**Component**: getProcessGroups function
- **Current Behavior**: Creates separate stockfit and assembly process groups
- **New Behavior**: 
  - For calculations (Pages 4,5): Maintain separate groups
  - For display (Page 1): Merge into single "Stockfit-Assembly" group
  - Remove stockfit ratio logic that affects GL display

**Design Pattern**: Strategy Pattern
```typescript
interface ProcessGroupStrategy {
  getProcessGroups(config: Config, model: ModelData, context: 'display' | 'calculation'): ProcessGroup[];
}

class DisplayProcessGroupStrategy implements ProcessGroupStrategy {
  // Merges stockfit and assembly for visualization
}

class CalculationProcessGroupStrategy implements ProcessGroupStrategy {
  // Keeps stockfit and assembly separate for calculations
}
```

### Visualization Components

**Component**: ReactFlowPage1
- **Modification**: Update node generation logic to create merged Stockfit-Assembly nodes
- **GL Node**: Single GL node representing both stockfit and assembly
- **TL Nodes**: Combined TL nodes under the merged GL
- **TM Nodes**: Combined TM nodes reflecting both processes

**Component**: InteractivePositionBox
- **Update**: Tooltip and information display for merged positions
- **Data**: Aggregate manpower and process information from both stockfit and assembly

## Data Models

### Process Data Structure

**Maintain Separation**: The underlying ModelData and ProcessData structures remain unchanged to preserve calculation accuracy.

```typescript
// Existing structures remain the same
type ProcessData = {
  name: string;
  manStt: number;
  manAsy: number;
  miniLine: number;
  shift: number;
};

type ModelData = {
  category: string;
  modelName: string;
  styleNo: string;
  processes: ProcessData[]; // Stockfit and Assembly remain separate here
};
```

### Display Transformation Layer

**New Component**: ProcessDisplayTransformer
```typescript
interface MergedProcessGroup {
  gl: { subtitle: string; count: number };
  tlGroup: Array<{ subtitle: string; manpower?: number }>;
  tmGroup: Array<{ subtitle: string; manpower?: number }>;
  sourceProcesses: {
    stockfit: ProcessData[];
    assembly: ProcessData[];
  };
}

class ProcessDisplayTransformer {
  mergeStockfitAssembly(stockfitGroup: ProcessGroup, assemblyGroup: ProcessGroup): MergedProcessGroup;
  calculateCombinedManpower(stockfitProcesses: ProcessData[], assemblyProcesses: ProcessData[]): number;
}
```

## Error Handling

### Configuration Migration
- **Issue**: Existing configurations may contain stockfitRatio values
- **Solution**: Graceful degradation - ignore stockfitRatio if present, use default behavior
- **Implementation**: Add validation in config loading to filter out deprecated properties

### Data Consistency
- **Issue**: Merged display must accurately reflect underlying separate data
- **Solution**: Validation layer to ensure display totals match calculation totals
- **Implementation**: Add assertions in development mode to verify data consistency

### Model Compatibility
- **Issue**: Different models may have varying stockfit/assembly process structures
- **Solution**: Flexible merging logic that adapts to available processes
- **Implementation**: Null-safe processing with fallback to available data

## Testing Strategy

### Unit Tests
1. **Configuration Tests**: Verify stockfitRatio removal doesn't break existing functionality
2. **Process Grouping Tests**: Test both display and calculation contexts produce correct results
3. **Data Transformation Tests**: Verify merged display data matches source data totals

### Integration Tests
1. **Page 1 Rendering**: Verify merged visualization displays correctly
2. **Page 4/5 Calculations**: Ensure calculations still use separate stockfit/assembly data
3. **Page 6 Data Input**: Confirm data input maintains separate process entries

### Visual Regression Tests
1. **Organization Chart Layout**: Compare before/after screenshots of Page 1
2. **Personnel Count Accuracy**: Verify displayed totals match expected values
3. **Interactive Elements**: Test tooltips and position information for merged elements

### User Acceptance Tests
1. **Configuration Workflow**: User can configure lines without stockfit ratio option
2. **Visualization Clarity**: Merged display is intuitive and informative
3. **Data Integrity**: Calculations remain accurate after display changes

## Implementation Phases

### Phase 1: Configuration Cleanup
- Remove stockfitRatio from UI components
- Update Config interface and related types
- Clean up unused stockfit ratio logic

### Phase 2: Display Logic Modification
- Implement ProcessDisplayTransformer
- Update getProcessGroups for display context
- Modify ReactFlowPage1 node generation

### Phase 3: Integration and Testing
- Update all affected components
- Implement comprehensive test suite
- Perform visual regression testing

### Phase 4: Validation and Cleanup
- Verify calculation accuracy maintained
- Remove dead code related to stockfit ratio
- Update documentation and comments