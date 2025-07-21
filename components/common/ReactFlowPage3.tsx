import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useOrgChart } from '@/context/OrgChartContext';
import { CustomPositionNode, nodeTypes } from './CustomPositionNode';

interface ReactFlowPage3Props {
  onInit?: (instance: ReactFlowInstance) => void;
}

export const ReactFlowPage3: React.FC<ReactFlowPage3Props> = ({ onInit }) => {
  const { config } = useOrgChart();

  // 2라인씩 묶는 유틸리티 함수
  const makeDoubleLines = useCallback((count: number, prefix: string = 'Line ') => {
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
  }, []);

  // 부서 목록 생성 (page3 요구사항에 맞게)
  const departments = useMemo(() => [
    {
      title: ["Quality"],
      hasGL: true,
      tl: ["Quality"], // 단일 TL
      tm: [
        // 라인 수에 따라 QC TMs 생성 (라인당 2명)
        ...Array.from({ length: config.lineCount }, (_, i) => [
          `Line ${i + 1} QC`,
          `Line ${i + 1} QC`,
        ]),
        // MA (HFPA) TMs
        ["HFPA", "HFPA", "HFPA"],
      ],
    },
    {
      title: ["CE"],
      hasGL: false, // GL 제거
      tl: ["CE"], // 단일 TL (CE)
      tm: [
        ["Mixing"] // 단일 TM
      ],
    },
    {
      title: ["TPM"],
      hasGL: true,
      tl: ["Stitching", "Cutting & Stockfit·Assembly", "CMMS & Electricity"],
      tm: [
        // Stitching TM들
        ["Stitching", "Stitching"],
        // Cutting TM들
        ["Cutting & Stockfit·Assembly", "Cutting & Stockfit·Assembly"],
        // Tech TM들
        ["Electricity", "CMMS"]
      ],
    },
    {
      title: ["CQM"],
      hasGL: false, // GL 제거
      tl: ["NPI"], // TL(NPI)만 존재
      tm: [],
    },
    {
      title: ["Lean"],
      hasGL: false,
      tl: ["Lean"], // TL만 존재
      tm: [],
    },
    {
      title: ["Security"],
      hasGL: false,
      tl: [],
      tm: [
        Array.from({ length: config.gateCount }, (_, i) => `Gate ${i + 1}`)
      ],
    },
    {
      title: ["RMCC"],
      hasGL: false,
      tl: [],
      tm: [
        ["Solid Waste"]
      ],
    }
  ], [config.lineCount, config.gateCount, makeDoubleLines]);

  // 색상 카테고리 결정 함수
  const getColorCategory = useCallback((
    deptTitle: string | string[], 
    position: 'GL' | 'TL' | 'TM', 
    subtitle?: string
  ): 'direct' | 'indirect' | 'OH' => {
    const deptName = Array.isArray(deptTitle) ? deptTitle[0] : deptTitle;
    
    // Quality 부서
    if (deptName === "Quality") {
      if (position === "GL") return "OH"; // GL은 OH 색상
      if (position === "TM" && subtitle?.includes("MQAA Audit")) return "OH";
      return "indirect";
    }
    
    // CE 부서
    if (deptName === "CE") {
      if (position === "TM" && subtitle?.toLowerCase().includes("mixing")) return "direct";
      return "OH";
    }
    
    // 나머지는 모두 OH
    return "OH";
  }, []);

  // ========= 그래프 생성 함수 =========
  const buildGraph = useCallback((deps: typeof departments) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let idCounter = 0;
    const getNextId = () => `node-${idCounter++}`;

    const calculateDeptWidth = (dept: any) => {
      const numColumns = Math.max(dept.tl.length, dept.tm.length, 1);
      return numColumns * 160 + 80;
    };

    let currentX = 0;
    const levelHeight = 120;
    const colSpacing = 160;

    deps.forEach((dept) => {
      const deptWidth = calculateDeptWidth(dept);
      const deptCenterX = currentX + deptWidth / 2;

      const deptNameId = getNextId();
      nodes.push({
        id: deptNameId,
        type: 'position',
        position: { x: deptCenterX - 70, y: 0 },
        data: { title: 'DEPT', subtitle: dept.title[0], level: 0, colorCategory: 'OH', isDeptName: true },
      });

      let glId = '';
      if (dept.hasGL) {
        glId = getNextId();
        nodes.push({
          id: glId,
          type: 'position',
          position: { x: deptCenterX - 70, y: levelHeight },
          data: { title: 'GL', subtitle: dept.title[0], level: 2, colorCategory: getColorCategory(dept.title, 'GL') },
        });
        edges.push({ id: `${deptNameId}-${glId}`, source: deptNameId, target: glId, type: 'smoothstep' });
      }

      const tlIds: string[] = [];
      dept.tl.forEach((tl: string, tlIndex: number) => {
        const tlId = getNextId();
        tlIds.push(tlId);
        const tlX = deptCenterX + (tlIndex - (dept.tl.length - 1) / 2) * colSpacing;
        nodes.push({ id: tlId, type: 'position', position: { x: tlX - 70, y: levelHeight * 2 }, data: { title: 'TL', subtitle: tl, level: 3, colorCategory: getColorCategory(dept.title, 'TL', tl) } });
        if (glId) edges.push({ id: `${glId}-${tlId}`, source: glId, target: tlId, type: 'smoothstep' });
        else edges.push({ id: `${deptNameId}-${tlId}`, source: deptNameId, target: tlId, type: 'smoothstep' });
      });

      const baseTMY = levelHeight * 3;
      dept.tm.forEach((tmCat: string[], catIdx: number) => {
        let prev: string | null = null;
        tmCat.forEach((tm, tmIdx) => {
          const tmId = getNextId();
          let tmX: number;
          if (tlIds.length > 0) {
            if (tlIds.length === 1) tmX = deptCenterX + (catIdx - (dept.tm.length - 1) / 2) * colSpacing;
            else tmX = deptCenterX + (catIdx - (tlIds.length - 1) / 2) * colSpacing;
          } else tmX = deptCenterX + (catIdx - (dept.tm.length - 1) / 2) * colSpacing;
          const tmY = baseTMY + tmIdx * 80;
          nodes.push({ id: tmId, type: 'position', position: { x: tmX - 70, y: tmY }, data: { title: 'TM', subtitle: tm, level: 4, colorCategory: getColorCategory(dept.title, 'TM', tm) } });
          if (tmIdx === 0) {
            const tlForCat = tlIds.length > 0 ? tlIds[Math.min(catIdx, tlIds.length - 1)] : '';
            if (tlForCat) edges.push({ id: `${tlForCat}-${tmId}`, source: tlForCat, target: tmId, type: 'smoothstep' });
            else if (glId) edges.push({ id: `${glId}-${tmId}`, source: glId, target: tmId, type: 'smoothstep' });
            else edges.push({ id: `${deptNameId}-${tmId}`, source: deptNameId, target: tmId, type: 'smoothstep' });
          } else if (prev) edges.push({ id: `${prev}-${tmId}`, source: prev, target: tmId, type: 'smoothstep' });
          prev = tmId;
        });
      });
      
      currentX += deptWidth - 40; // 부서간 거리
    });

    return { nodes, edges };
  }, [getColorCategory]);

  const graph = useMemo(() => buildGraph(departments), [departments, buildGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges);

  // config가 변경될 때마다 노드와 엣지 업데이트
  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [graph.nodes, graph.edges, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        onInit={onInit}
      >
        <MiniMap />
        <Background variant={'dots' as any} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}; 