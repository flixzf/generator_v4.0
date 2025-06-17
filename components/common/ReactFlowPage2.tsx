import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useOrgChart } from '@/context/OrgChartContext';

// page1.tsx와 동일한 CustomPositionNode 컴포넌트
const CustomPositionNode = ({ data }: { data: any }) => {
  const getBackgroundColor = (colorCategory: string, level: number) => {
    switch (colorCategory) {
      case 'direct':
        return '#f3f4f6'; // gray-100
      case 'indirect':
        return '#e5e7eb'; // gray-200
      case 'OH':
        return '#9ca3af'; // gray-400
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
      default:
        return '#d1d5db'; // gray-300
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
          whiteSpace: 'nowrap',
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

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: `2px solid ${getBorderColor(data.colorCategory)}`,
        backgroundColor: getBackgroundColor(data.colorCategory, data.level),
        width: '140px', // 고정 너비
        minHeight: '60px', // 최소 높이
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#1f2937',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        wordWrap: 'break-word',
        overflow: 'hidden'
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
      
      {/* 출력 핸들 (아래쪽) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555' }}
      />
    </div>
  );
};

const nodeTypes = {
  position: CustomPositionNode,
};

interface ReactFlowPage2Props {
  onInit?: (instance: ReactFlowInstance) => void;
}

export const ReactFlowPage2: React.FC<ReactFlowPage2Props> = ({ onInit }) => {
  const { config } = useOrgChart();

  // 2라인씩 묶는 유틸리티 함수
  const makeDoubleLines = (count: number, prefix: string = 'Line ') => {
    const result: string[] = [];
    let i = 1;
    while (i <= count) {
      if (i + 1 <= count) {
        result.push(`${prefix}${i}-${i + 1}`);
        i += 2;
      } else {
        result.push(`${prefix}${i}`);
        i += 1;
      }
    }
    return result;
  };

  // 일반적인 "Line X" 식
  const makeSingleLines = (count: number, prefix: string = 'Line ') =>
    Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);

  // FG WH Shipping TM count mapping
  const getShippingTMCount = (lineCount: number) => {
    const lookup = [0, 1, 2, 3, 3, 4, 5, 6, 6];
    if (lineCount <= 8) return lookup[lineCount];
    return Math.ceil(lineCount * 0.75);
  };

  // Plant Production TM 계산 함수 (2라인마다 1명 증가)
  const calculatePlantProductionTMs = (lineCount: number) => {
    const inputCount = Math.ceil(lineCount / 2);
    const outputCount = Math.ceil(lineCount / 2);
    
    const inputTMs = Array.from({ length: inputCount }, (_, i) => `Input ${i + 1}`);
    const outputTMs = Array.from({ length: outputCount }, (_, i) => `Output ${i + 1}`);
    
    return [inputTMs, outputTMs];
  };

  // 부서 목록 생성
  const departments = useMemo(() => [
    {
      title: ["Admin"],
      hasGL: false,
      tl: [],
      tm: [
        ["Personnel"],
        ["Production"],
        ["ISQ"],
      ],
    },
    {
      title: ["Small Tooling"],
      hasGL: false,
      tl: ["Small Tooling"],
      tm: [["Last Control"], ["Pallet"], ["Cutting Die/Pad/Mold"]],
    },
    {
      title: ["Raw Material"],
      hasGL: false,
      tl: [],
      tm: [["Raw Material"], ["Raw Material"]],
    },
    {
      title: ["Sub Material"],
      hasGL: false,
      tl: ["Material"],
      tm: [["Incoming"], ["Distribution"]],
    },
    {
      title: ["ACC Market"],
      hasGL: false,
      tl: [],
      tm: [makeDoubleLines(config.lineCount).map(line => `${line} ACC`)],
    },
    {
      title: "P&L Market",
      hasGL: true,
      tl: ["P&L Market"],
      tm: [
        [
          "Stencil1",
          "Stencil2",
          ...makeDoubleLines(config.lineCount).map(line => `${line} Box`),
        ],
        [
          ...makeDoubleLines(config.lineCount).map(line => `${line} Paper`),
        ],
      ],
    },
    {
      title: ["Bottom Market"],
      hasGL: false,
      tl: ["Bottom Market Incoming"],
      tm: [
        ["Outsole", "Outsole", "Midsole", "Midsole"],
        ["Bottom ACC"],
      ],
    },
    {
      title: ["Plant Production"],
      hasGL: false,
      tl: [],
      tm: [
        makeDoubleLines(config.lineCount).map(line => `${line} Input`),
        makeDoubleLines(config.lineCount).map(line => `${line} Output`)
      ],
    },
    {
      title: "FG WH",
      hasGL: true,
      tl: ["FG WH"],
      tm: [
        Array.from({ length: getShippingTMCount(config.lineCount) }, (_, idx) => `Shipping TM ${idx + 1}`),
        makeSingleLines(config.lineCount, '').map(i => `Incoming & Setting Line ${i}`),
        ["Incoming Scan"],
      ],
    },
  ], [config]);

  // 색상 카테고리 결정 함수
  const getColorCategory = (
    deptTitle: string | string[], 
    position: 'GL' | 'TL' | 'TM', 
    subtitle?: string
  ): 'direct' | 'indirect' | 'OH' => {
    const deptName = Array.isArray(deptTitle) ? deptTitle[0] : deptTitle;
    
    // OH 색상이 되어야 할 조건들
    // 1. Admin-TM전체 (Admin은 GL이 없으므로 GL일 때도 포함)
    if (deptName === "Admin" && (position === "TM" || position === "GL")) {
      return "OH";
    }
    
    // 2. Small Tooling: GL/TL/TM
    if (deptName === "Small Tooling" && (position === "GL" || position === "TL" || position === "TM")) {
      return "OH";
    }
    
    // 3. Sub Material: GL/TL/TM
    if (deptName === "Sub Material" && (position === "GL" || position === "TL" || position === "TM")) {
      return "OH";
    }
    
    // 4. FG WH: shipping TM 만
    if (deptName === "FG WH" && position === "TM" && subtitle?.includes("Shipping")) {
      return "OH";
    }
    
    // 5. Plant Production: TM (직접 생산 관련)
    if (deptName === "Plant Production" && position === "TM") {
      return "direct";
    }
    
    // 나머지는 모두 indirect
    return "indirect";
  };

  // 특정 TM은 "TM (MH)"로 헤드를 변경
  const getTMTitle = (subtitle: string) => {
    const keywords = [
      'material',
      'acc',
      'outsole',
      'midsole',
      'box',
      'paper',
      'incoming & setting'
    ];
    const lower = subtitle.toLowerCase();
    return keywords.some(k => lower.includes(k)) ? 'TM (MH)' : 'TM';
  };

  // 노드와 엣지 생성 (page1.tsx 스타일 적용)
  const createNodesAndEdges = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    let idCounter = 0;
    const getNextId = () => `node-${idCounter++}`;

    // 레이아웃 설정
    const levelHeight = 120;
    const baseDeptSpacing = 80; // 기본 부서간 간격 (200 * 0.4)
    const nodeSpacing = 80; // 같은 레벨 노드간 간격
    const columnSpacing = 150; // 다중 컬럼 간격
    
    // 각 부서의 폭을 미리 계산
    const calculateDeptWidth = (dept: any) => {
      const titleStr = Array.isArray(dept.title) ? dept.title[0] : dept.title;
      
      // 다중 컬럼 구조인 부서들
      if (titleStr === "Bottom Market" || titleStr === "FG WH" || titleStr === "P&L Market") {
        return dept.tm.length * columnSpacing; // 컬럼 수 * 컬럼 간격
      }
      
      return baseDeptSpacing; // 일반 부서는 기본 폭
    };
    
    // 각 부서의 X 좌표를 동적으로 계산
    const deptPositions: number[] = [];
    let currentX = 0;
    
    departments.forEach((dept, index) => {
      deptPositions.push(currentX);
      const deptWidth = calculateDeptWidth(dept);
      currentX += deptWidth + baseDeptSpacing; // 부서 폭 + 기본 간격
    });
    
    // MGL 노드 (최상단 중앙) - "Plant A"로 표시
    const mglId = getNextId();
    const totalWidth = currentX;
    const mglX = totalWidth / 2 - 70; // 중앙 정렬
    
    nodes.push({
      id: mglId,
      type: 'position',
      position: { x: mglX, y: 0 },
      data: { 
        title: 'MGL', 
        subtitle: 'Plant A', 
        level: 1, 
        colorCategory: 'OH' 
      },
    });

    // 부서명 텍스트 노드들 (MGL 아래)
    const deptNameY = 120; // MGL에서 충분히 떨어진 위치
    const deptBoxIds: string[] = []; // 부서 박스 ID들 저장
    
    departments.forEach((dept, deptIndex) => {
      const deptX = deptPositions[deptIndex];
      const titleStr = Array.isArray(dept.title) ? dept.title[0] : dept.title;
      
      // 부서명 박스 노드 (핸들 포함)
      const deptBoxId = getNextId();
      deptBoxIds.push(deptBoxId);
      
      nodes.push({
        id: deptBoxId,
        type: 'position',
        position: { x: deptX, y: deptNameY },
        data: { 
          title: '', 
          subtitle: titleStr, 
          level: 0, 
          colorCategory: 'OH',
          isDeptName: true
        },
      });
      
      // MGL → 부서 박스 연결
      edges.push({
        id: `edge-${mglId}-${deptBoxId}`,
        source: mglId,
        target: deptBoxId,
        type: 'smoothstep',
      });
    });

    // 고정된 레벨 위치 정의
    const glLevelY = deptNameY + 100;
    const tlLevelY = glLevelY + levelHeight;
    const tmLevelY = tlLevelY + levelHeight;

    // 각 부서별로 노드 생성
    departments.forEach((dept, deptIndex) => {
      const deptX = deptPositions[deptIndex];
      const titleStr = Array.isArray(dept.title) ? dept.title[0] : dept.title;

      // GL 노드 (있는 경우만)
      let glId: string | null = null;
      if (dept.hasGL) {
        glId = getNextId();
        nodes.push({
          id: glId,
          type: 'position',
          position: { x: deptX, y: glLevelY },
          data: { 
            title: 'GL', 
            subtitle: titleStr, 
            level: 2, 
            colorCategory: getColorCategory(dept.title, 'GL') 
          },
        });

        // 부서 박스 → GL 연결
        edges.push({
          id: `edge-${deptBoxIds[deptIndex]}-${glId}`,
          source: deptBoxIds[deptIndex],
          target: glId,
          type: 'smoothstep',
        });
      }

      // TL 노드들
      const tlIds: string[] = [];
      if (dept.tl.length > 0) {
        const colSpacing = 160;
        dept.tl.forEach((tl, tlIndex) => {
          const tlId = getNextId();
          tlIds.push(tlId);
          
          nodes.push({
            id: tlId,
            type: 'position',
            position: { x: deptX + tlIndex * nodeSpacing, y: tlLevelY },
            data: { 
              title: 'TL', 
              subtitle: tl, 
              level: 3, 
              colorCategory: getColorCategory(dept.title, 'TL', tl) 
            },
          });

          // 상위 노드 → TL 연결 (GL이 있으면 GL에서, 없으면 부서 박스에서)
          const sourceId = glId || deptBoxIds[deptIndex];
          edges.push({
            id: `edge-${sourceId}-${tlId}`,
            source: sourceId,
            target: tlId,
            type: 'smoothstep',
          });
        });
      }

      // TM 노드들 - 고정된 TM 레벨에 배치
      if (dept.tm.length > 0) {
        let tmX = deptX;
        
        // 연결할 상위 노드 결정 (TL → GL → 부서 박스 순서로 우선순위)
        const tmParentId = tlIds.length > 0 ? tlIds[0] : (glId || deptBoxIds[deptIndex]);
        
        // Bottom Market, FG WH, P&L Market는 다중 컬럼 구조로 특별 처리 (수직 체인 연결)
        if (titleStr === "Bottom Market" || titleStr === "FG WH" || titleStr === "P&L Market") {
          dept.tm.forEach((tmGroup, groupIndex) => {
            let tmY = tmLevelY; // 고정된 TM 레벨에서 시작
            let previousTmId: string | null = null; // 각 컬럼별 이전 TM ID 추적
            
            tmGroup.forEach((tm, tmIndex) => {
              const tmId = getNextId();
              
              nodes.push({
                id: tmId,
                type: 'position',
                position: { x: tmX, y: tmY },
                data: { 
                  title: getTMTitle(tm), 
                  subtitle: tm, 
                  level: 4, 
                  colorCategory: getColorCategory(dept.title, 'TM', tm) 
                },
              });

              // 연결 로직: 각 컬럼의 첫 번째 TM은 상위 노드에서, 나머지는 이전 TM에서 연결
              if (previousTmId === null) {
                // 각 컬럼의 첫 번째 TM은 상위 노드에서 연결
                edges.push({
                  id: `edge-${tmParentId}-${tmId}`,
                  source: tmParentId,
                  target: tmId,
                  type: 'smoothstep',
                });
              } else {
                // 나머지 TM들은 바로 위의 TM에서 연결
                edges.push({
                  id: `edge-${previousTmId}-${tmId}`,
                  source: previousTmId,
                  target: tmId,
                  type: 'smoothstep',
                });
              }

              previousTmId = tmId; // 현재 TM을 이전 TM으로 설정
              tmY += nodeSpacing; // 같은 컬럼 내에서 세로로 배치
            });

            tmX += columnSpacing; // 다음 컬럼으로 이동
          });
        } else {
          // 일반 부서들은 세로로 배치 (수직 체인 연결)
          let tmY = tmLevelY; // 고정된 TM 레벨에서 시작
          let previousTmId: string | null = null; // 이전 TM ID 추적
          
          dept.tm.forEach((tmGroup, groupIndex) => {
            tmGroup.forEach((tm, tmIndex) => {
              const tmId = getNextId();
              
              nodes.push({
                id: tmId,
                type: 'position',
                position: { x: tmX, y: tmY },
                data: { 
                  title: getTMTitle(tm), 
                  subtitle: tm, 
                  level: 4, 
                  colorCategory: getColorCategory(dept.title, 'TM', tm) 
                },
              });

              // 연결 로직: 첫 번째 TM은 상위 노드에서, 나머지는 이전 TM에서 연결
              if (previousTmId === null) {
                // 첫 번째 TM은 상위 노드(TL/GL/부서박스)에서 연결
                edges.push({
                  id: `edge-${tmParentId}-${tmId}`,
                  source: tmParentId,
                  target: tmId,
                  type: 'smoothstep',
                });
              } else {
                // 나머지 TM들은 바로 위의 TM에서 연결
                edges.push({
                  id: `edge-${previousTmId}-${tmId}`,
                  source: previousTmId,
                  target: tmId,
                  type: 'smoothstep',
                });
              }

              previousTmId = tmId; // 현재 TM을 이전 TM으로 설정
              tmY += nodeSpacing; // 세로로 배치
            });
          });
        }
      }
    });

    return { nodes, edges };
  }, [config, departments]);

  const [nodes, setNodes, onNodesChange] = useNodesState(createNodesAndEdges.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(createNodesAndEdges.edges);

  // config가 변경될 때마다 노드와 엣지 업데이트
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = createNodesAndEdges;
    setNodes(newNodes);
    setEdges(newEdges);
  }, [createNodesAndEdges]);

  const onConnect = useCallback((params: any) => {
    // 연결 기능은 필요에 따라 구현
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="top-right"
        style={{ width: '100%', height: '100%' }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        onInit={onInit}
      >
        <MiniMap />
        <Background variant={'dots' as any} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}; 