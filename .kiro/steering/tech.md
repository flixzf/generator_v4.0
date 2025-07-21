# Technical Stack & Build System

## Core Technologies

- **Next.js 15.1.6**: React-based framework with App Router
- **React 19.0.0**: UI library
- **TypeScript 5**: Type-safe JavaScript
- **ReactFlow 11.11.4**: Library for interactive node-based UIs and organization charts
- **TailwindCSS 3.4.17**: Utility-first CSS framework
- **Material UI 6.4.3**: React UI component library

## Project Configuration

- **App Router**: Uses Next.js App Router architecture
- **Turbopack**: Enabled for development builds
- **TypeScript**: Strict mode enabled
- **Path Aliases**: `@/*` maps to root directory

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development server with Turbopack
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

## Development Environment

- **Node.js**: v20+ recommended
- **Package Manager**: npm
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Code Organization Patterns

- **Context API**: Used for global state management (OrgChartContext)
- **Client Components**: Most components use "use client" directive
- **TypeScript Interfaces**: Strongly typed data structures for organization entities
- **Functional Components**: React functional components with hooks
- **Custom Hooks**: For reusable logic (e.g., useOrgChart)

## Data Flow

- OrgChartContext provides centralized state management
- Department and personnel data is calculated dynamically based on configuration
- Model-based calculations derive from process data in the context
- Interactive UI components update the central context state