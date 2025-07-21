# Project Structure

## Directory Organization

```
/
├── app/                # Next.js App Router entry point
│   ├── layout.tsx      # Root layout with fonts and global styles
│   ├── page.tsx        # Main page with view selection
│   └── globals.css     # Global styles with Tailwind
│
├── components/         # React components
│   ├── common/         # Shared visualization components
│   │   ├── OrganizationTree.tsx      # Core organization chart rendering
│   │   ├── ReactFlowOrgChart.tsx     # ReactFlow implementation
│   │   ├── InteractivePositionBox.tsx# Interactive UI elements
│   │   ├── spacingConfig.ts          # Layout configuration
│   │   └── styles.ts                 # Common styles
│   │
│   └── pages/          # Page-specific components
│       ├── page1.tsx   # Line-based organization view
│       ├── page2.tsx   # Plant/department view
│       ├── page3.tsx   # Support department view
│       ├── page4-direct.tsx    # Direct personnel analysis
│       ├── page4-indirect.tsx  # Indirect/OH personnel analysis
│       └── page5.tsx   # Model-based personnel calculation
│
├── context/            # React Context providers
│   └── OrgChartContext.tsx    # Global organization data state
│
├── public/             # Static assets
│
└── reference/          # Reference data and images
    ├── direct 인원분석.csv    # Sample personnel data
    └── 조직도.png            # Organization chart examples
```

## Key Files

- **app/page.tsx**: Main entry point with view selection dropdown
- **context/OrgChartContext.tsx**: Central state management for all organization data
- **components/common/OrganizationTree.tsx**: Core visualization logic
- **components/pages/**: Individual view implementations

## Data Models

### Core Data Types

- **Department**: Organization unit with personnel counts by position
- **Config**: System configuration for calculations
- **ModelData**: Product model information with process requirements
- **ProcessData**: Process-specific staffing requirements

### State Management

The application uses React Context API for global state management:

- **OrgChartProvider**: Wraps the application to provide organization data
- **useOrgChart**: Hook to access and modify organization data

## Naming Conventions

- React components use PascalCase
- Files containing React components use PascalCase
- Utility functions and hooks use camelCase
- TypeScript interfaces use PascalCase with descriptive names
- CSS classes use kebab-case (via Tailwind)

## Component Patterns

- Functional components with hooks
- "use client" directive for client-side components
- Props interfaces defined with TypeScript
- Component composition for complex UI elements
- Custom hooks for reusable logic