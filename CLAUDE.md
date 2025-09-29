# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack (faster builds)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint linting
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run Jest tests in watch mode

### Single Test Execution
Use standard Jest patterns:
- `npm test -- --testNamePattern="specific test name"`
- `npm test -- path/to/specific-test.spec.ts`

## Architecture Overview

This is a **Next.js 15 organization chart generator** for manufacturing/production organizations using a Value Stream Management (VSM) hierarchy. The application visualizes personnel structures across different views (Line, Plant, Support Departments) with ReactFlow-based interactive charts.

### Core Hierarchy Structure
- **VSM** (Value Stream Manager) - Top level
- **A.VSM** (Assistant Value Stream Manager) - 1 per production line
- **GL** (Group Leader) - Department/section level
- **TL** (Team Leader) - Team level
- **TM** (Team Member) - Individual contributor level

### Key Architecture Patterns

#### 1. Global State Management
- **Context**: `context/OrgChartContext.tsx` - Central state for all organizational data
- **Provider**: Wraps the entire app in `app/page.tsx`
- **Data Types**: Department, Config, ModelData, ProcessData structures
- **Hook**: `useOrgChart()` for accessing organizational data

#### 2. Page-Based View System
The app uses a dropdown selector to switch between 6 main views:
- **Page 1** (`page1.tsx`) - Line-based org chart (process-focused)
- **Page 2** (`page2.tsx`) - Plant/department org chart
- **Page 3** (`page3.tsx`) - Support department org chart
- **Page 4 Direct** (`page4-direct.tsx`) - Direct personnel aggregation
- **Page 4 Indirect** (`page4-indirect.tsx`) - Indirect + Overhead personnel
- **Page 5** (`page5.tsx`) - Model-based manpower calculation

#### 3. Component Architecture
```
components/
├── common/           # Shared visualization components
│   ├── components.tsx    # Core UI components (PositionBox, etc.)
│   ├── theme.ts         # Styling system and color schemes
│   ├── layout.ts        # Layout calculations and positioning
│   ├── utils.ts         # Utility functions
│   └── reactflow/       # ReactFlow-specific components
└── pages/           # Page-specific components
    ├── page1.tsx    # Line view implementation
    ├── page2.tsx    # Plant view implementation
    └── ...
```

#### 4. ReactFlow Integration
- Uses ReactFlow for interactive drag-and-drop org charts
- Custom node types for different position levels
- Automatic edge generation between hierarchical levels
- Positioned layouts with calculated spacing

#### 5. Data Flow
1. **OrgChartContext** maintains department/config/model data
2. **Page components** consume context data via `useOrgChart()`
3. **Common components** receive processed data and render visualizations
4. **Theme system** provides consistent styling across all charts

## Key Files and Their Purpose

### Core Application
- `app/page.tsx` - Main entry point with page selector and routing logic
- `app/layout.tsx` - Root layout with fonts and global styles
- `context/OrgChartContext.tsx` - Global state management for all organizational data

### Visualization Engine
- `components/common/components.tsx` - Base UI components (PositionBox, handles, etc.)
- `components/common/theme.ts` - Color schemes, box styles, and visual theming
- `components/common/layout.ts` - Spacing calculations and positioning logic
- `components/common/utils.ts` - Data processing utilities

### Business Logic
Each page component handles specific organizational views:
- Line-based charts show process-focused hierarchies
- Plant charts show department-based structures
- Support department charts show auxiliary functions
- Aggregation pages show personnel summaries by type
- Model-based page calculates staffing based on production models

## Technology Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety throughout
- **ReactFlow** - Interactive node-based charts
- **Material-UI (MUI)** - UI component library
- **TailwindCSS** - Utility-first styling
- **Jest** - Testing framework

## Development Notes

### Testing
- Uses Jest with React Testing Library
- Test files should follow `*.test.ts` or `*.spec.ts` patterns
- JSDOM environment configured for React component testing

### Styling
- Combination of TailwindCSS for layout and MUI for complex components
- Custom theme system in `theme.ts` for consistent org chart appearance
- CSS-in-JS patterns for dynamic styling based on hierarchy levels

### Type Safety
- Strict TypeScript configuration
- Well-defined interfaces for Department, Config, ModelData, ProcessData
- Path aliases configured (`@/*` maps to root directory)

### Build Configuration
- ESLint errors don't block production builds (configured in `next.config.ts`)
- Turbopack enabled for faster development builds
- PostCSS configured for TailwindCSS processing