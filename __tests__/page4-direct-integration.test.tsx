/**
 * Integration tests for Page4-direct component
 * Verifies that the component renders correctly and uses the classification engine
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page4Direct from '../components/pages/page4-direct';
import { OrgChartProvider } from '../context/OrgChartContext';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { describe } from 'node:test';

// Mock the classification engine to avoid console warnings in tests
jest.mock('../components/common/ClassificationEngine', () => ({
  classifyPosition: jest.fn((dept: string, level: string, processType?: string, subtitle?: string) => {
    // Mock classification logic for testing
    if (dept === 'CE' && level === 'TM' && subtitle?.includes('Mixing')) {
      return 'direct';
    }
    if (dept === 'Plant Production' && level === 'TM') {
      return 'direct';
    }
    if (level === 'PM' || level === 'LM') {
      return 'OH';
    }
    return 'indirect';
  }),
}));

// Mock ReactFlow components to avoid rendering issues in tests
jest.mock('reactflow', () => ({
  Node: () => null,
  Edge: () => null,
}));

// Mock the ReactFlowPage1 module
jest.mock('../components/common/ReactFlowPage1', () => ({
  getProcessGroups: jest.fn(() => ({
    mainProcesses: [
      {
        gl: { subtitle: "Stitching", count: 1 },
        tlGroup: [{ subtitle: "Stitching TL" }],
        tmGroup: [{ subtitle: "Stitching TM" }],
        showGL: true
      }
    ],
    separatedProcesses: []
  }))
}));

// Mock the DepartmentData module
jest.mock('../components/common/DepartmentData', () => ({
  getDepartmentsForPage: jest.fn(() => [
    {
      title: "Plant Production",
      hasGL: false,
      tl: [],
      tm: [["Plant Production TM"]],
    },
  ])
}));

describe('Page4Direct Integration', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <OrgChartProvider>
        {component}
      </OrgChartProvider>
    );
  };

  test('should render page title correctly', () => {
    renderWithProvider(<Page4Direct />);
    
    expect(screen.getByText('Aggregation Page-direct')).toBeInTheDocument();
  });

  test('should render direct summary table', () => {
    renderWithProvider(<Page4Direct />);
    
    expect(screen.getByText('# LM Plant Direct Summary')).toBeInTheDocument();
  });

  test('should render table headers correctly', () => {
    renderWithProvider(<Page4Direct />);
    
    // Check for main table headers
    expect(screen.getByText('Labor Type')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('SUM')).toBeInTheDocument();
    expect(screen.getAllByText('Plant').length).toBeGreaterThan(0);
    expect(screen.getByText('Supporting Team')).toBeInTheDocument();
  });

  test('should render level rows', () => {
    renderWithProvider(<Page4Direct />);
    
    // Check for level labels
    expect(screen.getByText('PM')).toBeInTheDocument();
    expect(screen.getByText('LM')).toBeInTheDocument();
    expect(screen.getByText('GL')).toBeInTheDocument();
    expect(screen.getByText('TL')).toBeInTheDocument();
    expect(screen.getByText('TM')).toBeInTheDocument();
  });

  test('should render labor type correctly', () => {
    renderWithProvider(<Page4Direct />);
    
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  test('should render department columns', () => {
    renderWithProvider(<Page4Direct />);
    
    // Check for some key department headers
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getByText('Quality')).toBeInTheDocument();
    expect(screen.getByText('CE')).toBeInTheDocument();
  });

  test('should render total row', () => {
    renderWithProvider(<Page4Direct />);
    
    expect(screen.getByText('TOTAL')).toBeInTheDocument();
  });

  test('should not crash when rendering with default context values', () => {
    expect(() => {
      renderWithProvider(<Page4Direct />);
    }).not.toThrow();
  });
});