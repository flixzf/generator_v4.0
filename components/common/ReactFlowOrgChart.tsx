import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useOrgChart } from '@/context/OrgChartContext';
import { PositionBox } from './OrganizationTree';

const nodeTypes = {
  position: ({ data }: { data: any }) => (
    <PositionBox
      title={data.title}
      subtitle={data.subtitle}
      level={data.level || 0}
      colorCategory={data.colorCategory}
    />
  ),
};

export const ReactFlowOrgChart: React.FC = () => {
  const { departments, config } = useOrgChart();

  // 라인별 공정 정의
  const processGroups = [
    { name: 'Stitching', tls: ['Cutting-Prefit', 'Stitching'], tms: ['Cutting-Prefit TM', 'Stitching TM'] },
    { name: 'Stockfit', tls: ['Stockfit'], tms: ['Stockfit TM'] },
    { name: 'Assembly', tls: ['Input', 'Cementing', 'Finishing'], tms: ['Assembly Input', 'Assembly Cementing', 'Assembly Finishing'] }
  ];

  // 노드 생성
  const generateNodes = (): Node[] => {
    const nodes: Node[] = [];
    const lineWidth = 800; // 라인 간 가로 간격
    const levelHeight = 150; // 레벨 간 세로 간격

    // MGL 노드 (최상단 중앙)
    nodes.push({
      id: 'mgl',
      type: 'position',
      position: { x: (config.lineCount * lineWidth) / 2 - 100, y: 0 },
      data: { title: 'MGL', subtitle: 'Plant A', level: 0, colorCategory: 'OH' },
    });

    // 라인별 노드 생성
    for (let lineIndex = 0; lineIndex < config.lineCount; lineIndex++) {
      const lineX = lineIndex * lineWidth;

      // LM 노드
      nodes.push({
        id: `vsm-${lineIndex}`,
        type: 'position',
        position: { x: lineX + 300, y: levelHeight },
        data: { title: 'LM', subtitle: `Line ${lineIndex + 1}`, level: 1, colorCategory: 'indirect' },
      });

      // 각 공정 그룹별로 GL, TL, TM 생성
      processGroups.forEach((group, groupIndex) => {
        const groupX = lineX + groupIndex * 250;

        // GL 노드
        nodes.push({
          id: `gl-${lineIndex}-${groupIndex}`,
          type: 'position',
          position: { x: groupX, y: levelHeight * 2 },
          data: { title: 'GL', subtitle: group.name, level: 2, colorCategory: 'indirect' },
        });

        // TL 노드들
        group.tls.forEach((tl, tlIndex) => {
          nodes.push({
            id: `tl-${lineIndex}-${groupIndex}-${tlIndex}`,
            type: 'position',
            position: { x: groupX + tlIndex * 120, y: levelHeight * 3 },
            data: { title: 'TL', subtitle: tl, level: 3, colorCategory: 'indirect' },
          });
        });

        // TM 노드들
        group.tms.forEach((tm, tmIndex) => {
          nodes.push({
            id: `tm-${lineIndex}-${groupIndex}-${tmIndex}`,
            type: 'position',
            position: { x: groupX + tmIndex * 120, y: levelHeight * 4 },
            data: { title: 'TM', subtitle: tm, level: 4, colorCategory: 'direct' },
          });
        });
      });
    }

    return nodes;
  };

  // 엣지 생성
  const generateEdges = (): Edge[] => {
    const edges: Edge[] = [];

    // MGL -> LM 연결
    for (let lineIndex = 0; lineIndex < config.lineCount; lineIndex++) {
      edges.push({
        id: `mgl-vsm-${lineIndex}`,
        source: 'mgl',
        target: `vsm-${lineIndex}`,
        type: 'smoothstep',
      });

      // LM -> GL 연결
      processGroups.forEach((group, groupIndex) => {
        edges.push({
          id: `vsm-gl-${lineIndex}-${groupIndex}`,
          source: `vsm-${lineIndex}`,
          target: `gl-${lineIndex}-${groupIndex}`,
          type: 'smoothstep',
        });

        // GL -> TL 연결
        group.tls.forEach((tl, tlIndex) => {
          edges.push({
            id: `gl-tl-${lineIndex}-${groupIndex}-${tlIndex}`,
            source: `gl-${lineIndex}-${groupIndex}`,
            target: `tl-${lineIndex}-${groupIndex}-${tlIndex}`,
            type: 'smoothstep',
          });

          // TL -> TM 연결 (같은 인덱스끼리)
          if (tlIndex < group.tms.length) {
            edges.push({
              id: `tl-tm-${lineIndex}-${groupIndex}-${tlIndex}`,
              source: `tl-${lineIndex}-${groupIndex}-${tlIndex}`,
              target: `tm-${lineIndex}-${groupIndex}-${tlIndex}`,
              type: 'smoothstep',
            });
          }
        });
      });
    }

    return edges;
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(generateNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(generateEdges());

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  // config.lineCount가 변경될 때 노드와 엣지 재생성
  React.useEffect(() => {
    setNodes(generateNodes());
    setEdges(generateEdges());
  }, [config.lineCount]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}; 