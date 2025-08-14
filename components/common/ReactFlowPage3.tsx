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
import { getColorCategory } from './ColorCategoryUtils';
import { getDepartmentsForPage } from './DepartmentData';
import { CustomPositionNode, nodeTypes } from './CustomPositionNode';
import CustomCenterYEdge from './CustomCenterYEdge';
import { COL_SPACING, DEPT_GUTTER, LEVEL_HEIGHT, TM_ROW_SPACING, EDGE_OFFSET, calculateDeptWidth, computeCategoryXs, computeTLXs, computeGLXs, computeDeptNameX, sequentialGLToTLMapping, getHierarchyY, getTMY, createEdgeConfig, getUnifiedGLBendY } from './LayoutUtils';

interface ReactFlowPage3Props {
  onInit?: (instance: ReactFlowInstance) => void;
}

export const ReactFlowPage3: React.FC<ReactFlowPage3Props> = ({ onInit }) => {
  const { config } = useOrgChart();

  // Use centralized line utilities

  // Use centralized department data with dynamic additions
  const departments = useMemo(() => {
    const L = config.lineCount;
    const G = config.gateCount;
    const P = config.qaPrs ?? 2400;

    const qaTmPerLine = (p: number) => {
      if (p <= 900) return 1;
      if (p <= 2000) return 2;
      if (p <= 2400) return 3;
      return 4;
    };

    // Quality
    const qaTLs = Array.from({ length: L }, (_, i) => `QA L${i + 1}`);
    const qaTMGroups = qaTLs.map((_, idx) =>
      Array.from({ length: qaTmPerLine(P) }, (_, j) => `QA L${idx + 1} TM-${j + 1}`)
    );
    // MA TM 총합 (2212221 반복)
    const maPattern = [2, 2, 1, 2, 2, 2, 1];
    let maTotal = 0;
    for (let i = 0; i < L; i++) maTotal += maPattern[i % maPattern.length];
    const maTM = Array.from({ length: maTotal }, (_, i) => `MA-${i + 1}`);
    // BNP-MDP 고정 1
    const bnpTM = ["BNP-MDP-1"];

    // CE
    const ceTotal = Math.ceil(L / 2);
    const ceTLs = L >= 1 ? ["CE"] : [];
    const ceTMs = Array.from({ length: Math.max(0, ceTotal - 1) }, (_, i) => `Mixing-${i + 1}`);

    // TPM
    const tpmTLs: string[] = [];
    if (L >= 3) tpmTLs.push("Stitching");
    tpmTLs.push("Cutting & Stockfit·Assembly");
    tpmTLs.push("No-sew/HF/Cutting");

    const tpmStitchingTM = (L <= 4 ? L : 4 + Math.ceil((L - 4) / 2));
    const tpmStitchingTMs = Array.from({ length: tpmStitchingTM }, (_, i) => `Stitching-${i + 1}`);
    const tpmCSATM = (L <= 5 ? (L - 1) : 4 + Math.ceil((L - 5) / 2));
    const tpmCSATMs = Array.from({ length: Math.max(0, tpmCSATM) }, (_, i) => `C&S-${i + 1}`);
    const noSewTm = (L === 1 ? 0 : L === 2 ? 1 : L === 3 ? 2 : 2 + Math.floor((L - 3) / 2));
    const cmmsTm = (L < 4 ? 0 : 1 + Math.floor((L - 4) / 8));
    const tpmNoSewTMs = [
      ...Array.from({ length: noSewTm }, (_, i) => `No-sew/HF/Cutting-${i + 1}`),
      ...Array.from({ length: cmmsTm }, (_, i) => `CMMS-${i + 1}`),
    ];

    // CQM
    const cqmTLCount = Math.ceil(L / 8);
    const cqmTLs = Array.from({ length: cqmTLCount }, (_, i) => `NPI-${i + 1}`);

    // Lean
    const leanTLCount = Math.ceil(L / 4);
    const leanTLs = Array.from({ length: leanTLCount }, (_, i) => `Lean-${i + 1}`);

    return [
      {
        title: ["Quality"],
        hasGL: true,
        glCount: Math.ceil(L / 2),
        tl: qaTLs,
        tm: [
          ...qaTMGroups,
          maTM,
          bnpTM,
        ],
      },
      {
        title: ["CE"],
        hasGL: false,
        tl: ceTLs,
        tm: [ceTMs],
      },
      {
        title: ["TPM"],
        hasGL: true,
        glCount: 1,
        tl: tpmTLs,
        tm: [
          tpmStitchingTMs,
          tpmCSATMs,
          tpmNoSewTMs,
        ],
      },
      {
        title: ["CQM"],
        hasGL: false,
        tl: cqmTLs,
        tm: [],
      },
      {
        title: ["Lean"],
        hasGL: false,
        tl: leanTLs,
        tm: [],
      },
      {
        title: ["Security"],
        hasGL: false,
        tl: [],
        tm: [Array.from({ length: G }, (_, i) => `Gate ${i + 1}`)],
      },
      {
        title: ["RMCC"],
        hasGL: false,
        tl: [],
        tm: [["Solid Waste"]],
      }
    ];
  }, [config.lineCount, config.gateCount, config.qaPrs]);

  // 색상 카테고리 결정 함수
  // Use centralized color category function

  // ========= 그래프 생성 함수 =========
  const buildGraph = useCallback((deps: typeof departments) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let idCounter = 0;
    const getNextId = () => `node-${idCounter++}`;

    

    let currentX = 0;
    const levelHeight = LEVEL_HEIGHT;

    deps.forEach((dept) => {
      const deptPrimary = Array.isArray(dept.title) ? dept.title[0] : dept.title;
      const isTPM = deptPrimary === 'TPM';
      const isQuality = deptPrimary === 'Quality';
      const deptWidth = calculateDeptWidth(dept as any);
      const deptCenterX = currentX + deptWidth / 2;
      const glCols = dept.glCount ? Number(dept.glCount) : (dept.hasGL ? 1 : 0);
      const tlCount = dept.tl.length;
      const numColumns = Math.max(dept.tl.length, dept.tm.length, glCols, 1);

      // TM 카테고리 X 좌표
      const catXs = computeCategoryXs(deptCenterX, numColumns, COL_SPACING, dept.tm.length);

      // TL 직하단 TM 카테고리만 포함 (품질의 MA/BNP/MDP 등 GL 직결 카테고리는 제외)
      const isCatChildOfTL = (catIdx: number) => {
        const tmCat = dept.tm[catIdx] || [];
        const first = (tmCat && tmCat[0]) ? String(tmCat[0]).toUpperCase() : '';
        const isMA = isQuality && first.includes('MA') && !first.includes('QA');
        const isBNP = isQuality && (first.includes('BNP') || first.includes('MDP') || first.includes('DMP'));
        return !(isMA || isBNP);
      };

      // TL X 계산
      const tlXs = computeTLXs(
        tlCount,
        deptCenterX,
        numColumns,
        COL_SPACING,
        catXs,
        (catIdx, count) => Math.min(catIdx, Math.max(0, count - 1)),
        isCatChildOfTL
      );

      // GL X 계산: 직하단 TL 평균
      const glXs = computeGLXs(glCols, deptCenterX, COL_SPACING, tlXs);

      // 부서명 X: 직하단 계층 평균
      const deptNameX = computeDeptNameX(glXs, tlXs, catXs, deptCenterX);

      // 부서명 노드
      const deptNameId = getNextId();
      nodes.push({
        id: deptNameId,
        type: 'position',
        position: { x: deptNameX - 70, y: getHierarchyY('DEPT') },
        data: { title: 'DEPT', subtitle: dept.title[0], level: 0, colorCategory: 'OH', isDeptName: true },
      });

      // 통일된 연결선 규칙 적용
      // GL 연결들의 통일된 꺾임점 (GL→TL 기준)
      const unifiedGLBendY = getUnifiedGLBendY();

      // GL 노드
      const glIds: string[] = [];
      if (glCols > 0) {
        for (let i = 0; i < glCols; i++) {
          const glId = getNextId();
          glIds.push(glId);
          const glX = glXs[i] ?? (deptCenterX + (i - (glCols - 1) / 2) * COL_SPACING);
          nodes.push({
            id: glId,
            type: 'position',
            position: { x: glX - 70, y: getHierarchyY('GL') },
            data: { title: 'GL', subtitle: dept.title[0], level: 2, colorCategory: isTPM ? 'OH' : getColorCategory(dept.title, 'GL') },
          });
          // Dept → GL: 통일된 규칙 적용
          const deptToGlConfig = createEdgeConfig('DEPT', 'GL');
          edges.push({ id: `${deptNameId}-${glId}`, source: deptNameId, target: glId, ...deptToGlConfig });
        }
      }

      // TL 노드
      const tlIds: string[] = [];
      dept.tl.forEach((tl: string, tlIndex: number) => {
        const tlId = getNextId();
        tlIds.push(tlId);
        const tlX = tlXs[tlIndex] ?? (deptCenterX + (tlIndex - (Math.max(dept.tl.length, numColumns) - 1) / 2) * COL_SPACING);
        nodes.push({ id: tlId, type: 'position', position: { x: tlX - 70, y: getHierarchyY('TL') }, data: { title: 'TL', subtitle: tl, level: 3, colorCategory: isTPM ? 'OH' : getColorCategory(dept.title, 'TL', tl) } });
        if (glIds.length > 0) {
          // 순차적 매핑: GL0→TL0,1,2... / GL1→TL3,4,5... 방식
          const mapping = sequentialGLToTLMapping(glIds.length, tlCount);
          let mappedGlIdx = 0;
          for (let g = 0; g < mapping.length; g++) {
            if (mapping[g].includes(tlIndex)) {
              mappedGlIdx = g;
              break;
            }
          }
          const mappedGl = glIds[mappedGlIdx];
          // GL → TL: 통일된 규칙 적용 (인접 레벨)
          const glToTlConfig = createEdgeConfig('GL', 'TL');
          edges.push({ id: `${mappedGl}-${tlId}`, source: mappedGl, target: tlId, ...glToTlConfig });
        } else {
          // Dept → TL: 통일된 규칙 적용
          const deptToTlConfig = createEdgeConfig('DEPT', 'TL');
          edges.push({ id: `${deptNameId}-${tlId}`, source: deptNameId, target: tlId, ...deptToTlConfig });
        }
      });

      // TM 노드
      const baseTMY = getHierarchyY('TM_BASE');
      dept.tm.forEach((tmCat: string[], catIdx: number) => {
        let prev: string | null = null;
        const firstInGroup = (tmCat && tmCat[0]) ? String(tmCat[0]).toUpperCase() : '';
        const isQualityMA = isQuality && firstInGroup.includes('MA') && !firstInGroup.includes('QA');
        const isQualityBNP = isQuality && (firstInGroup.includes('BNP') || firstInGroup.includes('MDP') || firstInGroup.includes('DMP'));

        tmCat.forEach((tm, tmIdx) => {
          const tmId = getNextId();
          const tmX = catXs[catIdx];
          const tmY = getTMY(baseTMY, tmIdx);
          nodes.push({ id: tmId, type: 'position', position: { x: tmX - 70, y: tmY }, data: { title: 'TM', subtitle: tm, level: 4, colorCategory: isTPM ? 'OH' : getColorCategory(dept.title, 'TM', tm) } });
          if (tmIdx === 0) {
            const tlForCat = tlIds.length > 0 ? tlIds[Math.min(catIdx, tlIds.length - 1)] : '';
            if ((isQualityMA || isQualityBNP) && glIds.length > 0) {
              // Quality MA/BNP는 마지막 GL(가장 우측)에 연결
              const lastGlId = glIds[glIds.length - 1];
              // GL → TM: GL→TL과 같은 꺾임점에서 꺾임 (통일된 높이)
              const glToTmConfig = createEdgeConfig('GL', 'TM_BASE', { forceUnifiedBendY: unifiedGLBendY });
              edges.push({ id: `${lastGlId}-${tmId}`, source: lastGlId, target: tmId, ...glToTmConfig });
            } else if (tlForCat) {
              // TL → TM: 통일된 규칙 적용 (인접 레벨)
              const tlToTmConfig = createEdgeConfig('TL', 'TM_BASE');
              edges.push({ id: `${tlForCat}-${tmId}`, source: tlForCat, target: tmId, ...tlToTmConfig });
            } else if (glIds.length > 0) {
              // 일반 GL→TM도 순차적 매핑 적용
              const mapping = sequentialGLToTLMapping(glIds.length, dept.tm.length);
              let mappedGlIdx = 0;
              for (let g = 0; g < mapping.length; g++) {
                if (mapping[g].includes(catIdx)) {
                  mappedGlIdx = g;
                  break;
                }
              }
              const mappedGl = glIds[mappedGlIdx];
              // GL → TM: GL→TL과 같은 꺾임점에서 꺾임 (통일된 높이)
              const glToTmConfig = createEdgeConfig('GL', 'TM_BASE', { forceUnifiedBendY: unifiedGLBendY });
              edges.push({ id: `${mappedGl}-${tmId}`, source: mappedGl, target: tmId, ...glToTmConfig });
            } else {
              // Dept → TM: 통일된 규칙 적용  
              const deptToTmConfig = createEdgeConfig('DEPT', 'TM_BASE');
              edges.push({ id: `${deptNameId}-${tmId}`, source: deptNameId, target: tmId, ...deptToTmConfig });
            }
          } else if (prev) {
            // TM → TM: 같은 레벨 내 연결
            edges.push({ id: `${prev}-${tmId}`, source: prev, target: tmId, type: 'smoothstep', pathOptions: { offset: EDGE_OFFSET } });
          }
          prev = tmId;
        });
      });

      currentX += deptWidth + DEPT_GUTTER; // 부서간 거리 가산 (통일)
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
        edgeTypes={{ customCenterY: CustomCenterYEdge }}
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