import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock ReactFlow
jest.mock('reactflow', () => ({
  ReactFlow: ({ children }) => <div data-testid="react-flow">{children}</div>,
  useNodesState: () => [[], jest.fn()],
  useEdgesState: () => [[], jest.fn()],
  addEdge: jest.fn(),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Handle: ({ children }) => <div data-testid="handle">{children}</div>,
  Position: {
    Top: 'top',
    Bottom: 'bottom',
    Left: 'left',
    Right: 'right',
  },
}))

// Mock Material-UI components
jest.mock('@mui/material/Select', () => {
  return function MockSelect({ children, value, onChange, ...props }) {
    return (
      <select 
        data-testid="mui-select" 
        value={value} 
        onChange={(e) => onChange && onChange({ target: { value: e.target.value } })}
        {...props}
      >
        {children}
      </select>
    )
  }
})

jest.mock('@mui/material/MenuItem', () => {
  return function MockMenuItem({ children, value, ...props }) {
    return <option value={value} {...props}>{children}</option>
  }
})