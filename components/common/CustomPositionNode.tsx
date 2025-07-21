import React from 'react';
import { Handle, Position } from 'reactflow';

// 공통 CustomPositionNode 컴포넌트
export const CustomPositionNode = ({ data }: { data: any }) => {
  const getBackgroundColor = (colorCategory: string) => {
    switch (colorCategory) {
      case 'direct':
        return '#f3f4f6'; // gray-100
      case 'indirect':
        return '#e5e7eb'; // gray-200
      case 'OH':
        return '#9ca3af'; // gray-400
      case 'blank':
        return 'transparent';
      default:
        return '#f9fafb'; // gray-50
    }
  };

  const getBorderColor = (colorCategory: string) => {
    switch (colorCategory) {
      case 'direct':
        return '#6b7280'; // gray-500
      case 'indirect':
        return '#4b5563'; // gray-600
      case 'OH':
        return '#374151'; // gray-700
      case 'blank':
        return 'transparent';
      default:
        return '#d1d5db'; // gray-300
    }
  };

  const getBorderStyle = (colorCategory: string) => {
    switch (colorCategory) {
      case 'direct':
        return 'dashed'; // 점선 스타일
      case 'indirect':
      case 'OH':
      default:
        return 'solid'; // 실선 스타일
    }
  };

  // 부서명 텍스트 노드인 경우 박스 없이 텍스트만 표시
  if (data.isDeptName) {
    return (
      <div
        style={{
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#1f2937',
          width: '140px', // GL과 동일 폭으로 X정렬
          padding: '8px 12px',
          backgroundColor: 'transparent',
          border: 'none',
          minHeight: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          whiteSpace: 'pre-line',
        }}
      >
        {/* 입력 핸들 (위쪽) */}
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#555' }}
        />
        
        {data.subtitle}
        
        {/* 출력 핸들 (아래쪽) */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#555' }}
        />
      </div>
    );
  }

  // Get border style based on color category
  const borderStyle = getBorderStyle(data.colorCategory);
  
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: data.colorCategory === 'blank' ? 'none' : `2px ${borderStyle} ${getBorderColor(data.colorCategory)}`,
        background: data.colorCategory === 'blank' ? 'transparent' : getBackgroundColor(data.colorCategory),
        width: '140px', // 고정 너비
        minHeight: '60px', // 최소 높이
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#1f2937',
        boxShadow: data.colorCategory === 'blank' ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        wordWrap: 'break-word',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* 입력 핸들 (위쪽) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555' }}
      />

      <div style={{
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '4px',
        lineHeight: '1.2',
        wordBreak: 'break-word',
        hyphens: 'auto'
      }}>
        {data.title}
      </div>
      <div style={{
        fontSize: '10px',
        color: '#6b7280',
        lineHeight: '1.3',
        wordBreak: 'break-word',
        hyphens: 'auto',
        textAlign: 'center',
        maxWidth: '100%'
      }}>
        {data.subtitle}
      </div>

      {/* No visual indicators for merged positions as requested */}

      {/* 출력 핸들 (아래쪽) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  );
};

export const nodeTypes = {
  position: CustomPositionNode,
};