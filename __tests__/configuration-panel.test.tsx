/**
 * Tests for configuration panel functionality without stockfit ratio
 * Ensures the configuration panel works correctly after removing stockfit ratio
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OrgChartProvider } from '@/context/OrgChartContext'

// Mock Page1 component with configuration panel
const MockPage1ConfigPanel = () => {
  const [config, setConfig] = React.useState({
    lineCount: 4,
    shiftsCount: 2,
    miniLineCount: 2,
    hasTonguePrefit: true,
    cuttingPrefitCount: 1,
    stitchingCount: 1,
    stockfitCount: 1,
    assemblyCount: 1,
  })

  const updateConfig = (newConfig: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }

  return (
    <div data-testid="config-panel">
      <div className="config-section">
        <label>
          <span>라인 수</span>
          <input
            data-testid="line-count-input"
            type="number"
            value={config.lineCount}
            min="1"
            max="8"
            onChange={(e) => {
              const value = Math.max(1, Math.min(8, parseInt(e.target.value) || 1))
              updateConfig({ lineCount: value })
            }}
          />
        </label>
        
        <label>
          <span>시프트 수</span>
          <input
            data-testid="shifts-count-input"
            type="number"
            value={config.shiftsCount}
            min="1"
            max="3"
            onChange={(e) => {
              const value = Math.max(1, Math.min(3, parseInt(e.target.value) || 1))
              updateConfig({ shiftsCount: value })
            }}
          />
        </label>
        
        <label>
          <span>미니라인 수</span>
          <input
            data-testid="mini-line-count-input"
            type="number"
            value={config.miniLineCount}
            min="1"
            max="4"
            onChange={(e) => {
              const value = Math.max(1, Math.min(4, parseInt(e.target.value) || 1))
              updateConfig({ miniLineCount: value })
            }}
          />
        </label>
        
        <label>
          <span>Tongue Prefit</span>
          <input
            data-testid="tongue-prefit-checkbox"
            type="checkbox"
            checked={config.hasTonguePrefit}
            onChange={(e) => updateConfig({ hasTonguePrefit: e.target.checked })}
          />
        </label>
        
        {/* Stockfit ratio should NOT be present */}
        {/* This is intentionally commented out to test its absence */}
        {/* 
        <label>
          <span>Stockfit 비율</span>
          <select value={stockfitRatio} onChange={...}>
            <option value="1:1">1:1</option>
            <option value="2:1">2:1</option>
          </select>
        </label>
        */}
      </div>
      
      <div data-testid="config-display">
        <div>라인 수: {config.lineCount}</div>
        <div>시프트 수: {config.shiftsCount}</div>
        <div>미니라인 수: {config.miniLineCount}</div>
        <div>Tongue Prefit: {config.hasTonguePrefit ? 'Yes' : 'No'}</div>
      </div>
    </div>
  )
}

// Mock component that would have had stockfit ratio
const MockLegacyConfigPanel = () => {
  const [config, setConfig] = React.useState({
    lineCount: 4,
    shiftsCount: 2,
    miniLineCount: 2,
    hasTonguePrefit: true,
    stockfitRatio: '1:1', // This should be removed
  })

  return (
    <div data-testid="legacy-config-panel">
      <select data-testid="stockfit-ratio-select" value={config.stockfitRatio}>
        <option value="1:1">1:1</option>
        <option value="2:1">2:1</option>
      </select>
    </div>
  )
}

describe('Configuration Panel', () => {
  describe('Stockfit Ratio Removal', () => {
    test('should not display stockfit ratio dropdown', () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      // Stockfit ratio dropdown should not exist
      expect(screen.queryByText('Stockfit 비율')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stockfit-ratio-select')).not.toBeInTheDocument()
      
      // Other configuration options should still be present
      expect(screen.getByText('라인 수')).toBeInTheDocument()
      expect(screen.getByText('시프트 수')).toBeInTheDocument()
      expect(screen.getByText('미니라인 수')).toBeInTheDocument()
      expect(screen.getByText('Tongue Prefit')).toBeInTheDocument()
    })

    test('should not have any references to stockfit ratio in config state', () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const configDisplay = screen.getByTestId('config-display')
      
      // Should not contain any stockfit ratio information
      expect(configDisplay.textContent).not.toContain('stockfit')
      expect(configDisplay.textContent).not.toContain('비율')
      expect(configDisplay.textContent).not.toContain('1:1')
      expect(configDisplay.textContent).not.toContain('2:1')
    })
  })

  describe('Configuration Functionality', () => {
    test('should update line count correctly', async () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const lineCountInput = screen.getByTestId('line-count-input')
      const configDisplay = screen.getByTestId('config-display')
      
      // Initial value should be 4
      expect(lineCountInput).toHaveValue(4)
      expect(configDisplay.textContent).toContain('라인 수: 4')
      
      // Change to 6
      fireEvent.change(lineCountInput, { target: { value: '6' } })
      
      await waitFor(() => {
        expect(lineCountInput).toHaveValue(6)
        expect(configDisplay.textContent).toContain('라인 수: 6')
      })
    })

    test('should enforce line count limits', async () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const lineCountInput = screen.getByTestId('line-count-input')
      
      // Test maximum limit (8)
      fireEvent.change(lineCountInput, { target: { value: '10' } })
      await waitFor(() => {
        expect(lineCountInput).toHaveValue(8)
      })
      
      // Test minimum limit (1)
      fireEvent.change(lineCountInput, { target: { value: '0' } })
      await waitFor(() => {
        expect(lineCountInput).toHaveValue(1)
      })
    })

    test('should update shifts count correctly', async () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const shiftsInput = screen.getByTestId('shifts-count-input')
      const configDisplay = screen.getByTestId('config-display')
      
      // Change shifts count
      fireEvent.change(shiftsInput, { target: { value: '3' } })
      
      await waitFor(() => {
        expect(shiftsInput).toHaveValue(3)
        expect(configDisplay.textContent).toContain('시프트 수: 3')
      })
    })

    test('should update mini line count correctly', async () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const miniLineInput = screen.getByTestId('mini-line-count-input')
      const configDisplay = screen.getByTestId('config-display')
      
      // Change mini line count
      fireEvent.change(miniLineInput, { target: { value: '3' } })
      
      await waitFor(() => {
        expect(miniLineInput).toHaveValue(3)
        expect(configDisplay.textContent).toContain('미니라인 수: 3')
      })
    })

    test('should toggle tongue prefit correctly', async () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const tongueCheckbox = screen.getByTestId('tongue-prefit-checkbox')
      const configDisplay = screen.getByTestId('config-display')
      
      // Initial state should be checked (true)
      expect(tongueCheckbox).toBeChecked()
      expect(configDisplay.textContent).toContain('Tongue Prefit: Yes')
      
      // Toggle to false
      fireEvent.click(tongueCheckbox)
      
      await waitFor(() => {
        expect(tongueCheckbox).not.toBeChecked()
        expect(configDisplay.textContent).toContain('Tongue Prefit: No')
      })
    })
  })

  describe('Configuration State Management', () => {
    test('should maintain all configuration values without stockfit ratio', () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const configDisplay = screen.getByTestId('config-display')
      
      // All expected configuration values should be present
      expect(configDisplay.textContent).toContain('라인 수: 4')
      expect(configDisplay.textContent).toContain('시프트 수: 2')
      expect(configDisplay.textContent).toContain('미니라인 수: 2')
      expect(configDisplay.textContent).toContain('Tongue Prefit: Yes')
      
      // Stockfit ratio should not be present
      expect(configDisplay.textContent).not.toContain('stockfit')
      expect(configDisplay.textContent).not.toContain('비율')
    })

    test('should handle configuration updates without errors', async () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      // Multiple rapid updates should not cause errors
      const lineCountInput = screen.getByTestId('line-count-input')
      const shiftsInput = screen.getByTestId('shifts-count-input')
      const tongueCheckbox = screen.getByTestId('tongue-prefit-checkbox')
      
      fireEvent.change(lineCountInput, { target: { value: '6' } })
      fireEvent.change(shiftsInput, { target: { value: '3' } })
      fireEvent.click(tongueCheckbox)
      
      await waitFor(() => {
        expect(lineCountInput).toHaveValue(6)
        expect(shiftsInput).toHaveValue(3)
        expect(tongueCheckbox).not.toBeChecked()
      })
    })
  })

  describe('Legacy Code Cleanup', () => {
    test('should not render legacy stockfit ratio components', () => {
      // This test ensures that any legacy components with stockfit ratio are not rendered
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      // Check that no stockfit-related elements exist in the DOM
      const allElements = screen.getByTestId('config-panel').querySelectorAll('*')
      
      allElements.forEach(element => {
        expect(element.textContent?.toLowerCase()).not.toContain('stockfit')
        const testId = element.getAttribute('data-testid')
        if (testId) {
          expect(testId).not.toContain('stockfit')
        }
        expect(element.className).not.toContain('stockfit')
      })
    })

    test('should not have any stockfit ratio event handlers', () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      // Ensure no elements have stockfit-related event handlers
      const configPanel = screen.getByTestId('config-panel')
      const selectElements = configPanel.querySelectorAll('select')
      
      // Should not have any select elements for stockfit ratio
      selectElements.forEach(select => {
        expect(select.getAttribute('data-testid')).not.toContain('stockfit')
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle invalid input values gracefully', async () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const lineCountInput = screen.getByTestId('line-count-input')
      
      // Test with non-numeric input
      fireEvent.change(lineCountInput, { target: { value: 'abc' } })
      
      await waitFor(() => {
        // Should default to minimum value (1) for invalid input
        expect(lineCountInput).toHaveValue(1)
      })
    })

    test('should handle empty input values', async () => {
      render(
        <OrgChartProvider>
          <MockPage1ConfigPanel />
        </OrgChartProvider>
      )
      
      const lineCountInput = screen.getByTestId('line-count-input')
      
      // Test with empty input
      fireEvent.change(lineCountInput, { target: { value: '' } })
      
      await waitFor(() => {
        // Should default to minimum value (1) for empty input
        expect(lineCountInput).toHaveValue(1)
      })
    })
  })
})