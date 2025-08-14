import React, { useCallback, useMemo } from 'react';
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
import { makeDoubleLines, makeSingleLines, getShippingTMCount } from './LineUtils';
import { CustomPositionNode, nodeTypes } from './CustomPositionNode';
import CustomCenterYEdge from './CustomCenterYEdge';
import { COL_SPACING, DEPT_GUTTER, LEVEL_HEIGHT, TM_ROW_SPACING, EDGE_OFFSET, calculateDeptWidth, DeptLike, computeCategoryXs, computeTLXs, computeGLXs, computeDeptNameX, sequentialGLToTLMapping, getHierarchyY, getTMY } from './LayoutUtils';

interface ReactFlowPage2Props {
  onInit?: (instance: ReactFlowInstance) => void;
}

export const ReactFlowPage2: React.FC<ReactFlowPage2Props> = ({ onInit }) => {
  const { config } = useOrgChart();

  // Use centralized line utilities

  // Plant Production TM 계산 함수 (2라인마다 1명 증가)
  const calculatePlantProductionTMs = useCallback((lineCount: number) => {
    const inputCount = Math.ceil(lineCount / 2);
    const outputCount = Math.ceil(lineCount / 2);
    
    const inputTMs = Array.from({ length: inputCount }, (_, i) => `Input ${i + 1}`);
    const outputTMs = Array.from({ length: outputCount }, (_, i) => `Output ${i + 1}`);
    
    return [inputTMs, outputTMs];
  }, []);

  // Use centralized department data (with dynamic calculations for some departments)
  const departments = useMemo(() => {
    const baseDepartments = getDepartmentsForPage('page2');

    // 동적 부서 (config 기반)
    const dynamicDepartments = [
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
        tm: (() => {
          const L = config.lineCount;
          const stencilCount = Math.ceil(L * 0.75);
          const stencilTMs = Array.from({ length: stencilCount }, (_, i) => `Stencil ${i + 1}`);
          const coLabel = ["CO Label"];
          const boxTMs = makeDoubleLines(L).map(line => `${line} Box MH`);
          const paperTMs = makeDoubleLines(L).map(line => `${line} Paper MH`);
          return [
            [...stencilTMs, ...coLabel, ...boxTMs],
            [...paperTMs],
          ];
        })(),
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
        title: ["Plant Production\n(Outsole degreasing)"],
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
    ];

    // 동적 먼저, 기본 나중 → 동적 우선 유지
    const combined = [...dynamicDepartments, ...baseDepartments];

    // 중복 제거: title이 배열인 경우 각 요소를 키로 확장하여 하나라도 중복되면 제거
    const seen = new Set<string>();
    const deduped = combined.filter((dept: DeptLike) => {
      const titles = Array.isArray(dept.title) ? (dept.title as string[]) : [dept.title as string];
      const hasDup = titles.some((t: string) => seen.has(t));
      if (hasDup) return false;
      titles.forEach((t: string) => seen.add(t));
      return true;
    });

    // 정렬: admin → small tooling → sub material → raw material → acc market → p&l market → bottom market → plant production → fg wh
    const ORDER = [
      'admin',
      'small tooling',
      'sub material',
      'raw material',
      'acc market',
      'p&l market',
      'bottom market',
      'plant production',
      'fg wh',
    ];

    const normalizePrimaryName = (dept: DeptLike): string => {
      const titles = Array.isArray(dept.title) ? (dept.title as string[]) : [dept.title as string];
      const primary = (titles[0] || '').split('\n')[0].trim();
      return primary.toLowerCase();
    };

    const sorted = [...deduped].sort((a: DeptLike, b: DeptLike) => {
      const aName = normalizePrimaryName(a);
      const bName = normalizePrimaryName(b);
      const aIdx = ORDER.indexOf(aName);
      const bIdx = ORDER.indexOf(bName);
      const ai = aIdx === -1 ? ORDER.length : aIdx;
      const bi = bIdx === -1 ? ORDER.length : bIdx;
      if (ai !== bi) return ai - bi;
      return aName.localeCompare(bName);
    });

    // 단일 컬럼 강제 대상: admin, small tooling, sub material, raw material, plant production
    const SINGLE_COLUMN = new Set<string>([
      'admin', 'small tooling', 'sub material', 'raw material', 'plant production'
    ]);

    // Sub Material의 TL을 Raw Material로 이동
    const moved = (() => {
      const clone = sorted.map((d: DeptLike) => ({
        ...d,
        tl: Array.isArray(d.tl) ? [...d.tl] : []
      }));
      const findIndexByName = (name: string) => clone.findIndex((d) => normalizePrimaryName(d) === name);
      const subIdx = findIndexByName('sub material');
      const rawIdx = findIndexByName('raw material');
      if (subIdx !== -1) clone[subIdx].tl = [];
      if (rawIdx !== -1) {
        const tlSet = new Set<string>(clone[rawIdx].tl || []);
        tlSet.add('Material');
        clone[rawIdx].tl = Array.from(tlSet);
      }
      return clone;
    })();

    const finalDepts = moved.map((dept: DeptLike) => {
      const primary = normalizePrimaryName(dept);
      if (SINGLE_COLUMN.has(primary)) {
        const flat = (dept.tm || []).reduce((acc: string[], arr: string[]) => acc.concat(arr), []);
        return { ...dept, tm: [flat] } as DeptLike;
      }
      return dept;
    });

    return finalDepts as any;
  }, [config.lineCount, config.gateCount, makeDoubleLines, makeSingleLines, getShippingTMCount]);

  // Import centralized color category function

  // 특정 TM은 "TM (MH)"로 헤드를 변경
  const getTMTitle = (subtitle: string) => {
    const lower = subtitle.toLowerCase();
    // P&L Market 규칙: Stencil, CO Label은 TM / 나머지(Box, Paper 등)는 TM (MH)
    if (lower.startsWith('stencil') || lower.includes('co label')) return 'TM';
    const mhKeywords = ['material','acc','outsole','midsole','box','paper','incoming & setting'];
    return mhKeywords.some(k => lower.includes(k)) ? 'TM (MH)' : 'TM';
  };

  // 노드와 엣지 생성 (page1.tsx 스타일 적용)
  const createNodesAndEdges = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    let idCounter = 0;
    const getNextId = () => `node-${idCounter++}`;

    // 레이아웃 설정
    const levelHeight = LEVEL_HEIGHT;
    const baseDeptSpacing = DEPT_GUTTER; // 공통 여백 사용
    const nodeSpacing = TM_ROW_SPACING; // 같은 레벨 노드간 간격(공통 TM 간격 재사용)
    const columnSpacing = COL_SPACING; // 다중 컬럼 간격(공통 열 간격 사용)
    
    // 각 부서의 폭을 미리 계산 (TL/다중 TM 컬럼 고려)
    const calculateDeptWidthLocal = (dept: DeptLike) => calculateDeptWidth(dept);
    
    // 각 부서의 X 좌표를 동적으로 계산
    const deptPositions: number[] = [];
    let currentX = 0;
    
    departments.forEach((dept: any, index: number) => {
      const deptWidth = calculateDeptWidthLocal(dept as any);
      deptPositions.push(currentX + (deptWidth / 2)); // 부서 중심 X로 저장
      currentX += deptWidth + baseDeptSpacing; // 부서 폭 + 기본 간격(축소)
    });

    // 부서명 텍스트 노드들 (최상단에 배치)
    const deptNameY = getHierarchyY('DEPT'); // 공통 DEPT Y 좌표 사용
    const deptBoxIds: string[] = []; // 부서 박스 ID들 저장
    
    departments.forEach((dept: any, deptIndex: number) => {
      const deptCenterX = deptPositions[deptIndex];
      const titleStr = Array.isArray(dept.title) ? dept.title[0] : dept.title;
      
      // 부서명 박스 노드 (핸들 포함) - 우선 기본 centerX로 생성 후, 아래 루프에서 실제 자식 평균으로 재정렬
      const deptBoxId = getNextId();
      deptBoxIds.push(deptBoxId);
      
      nodes.push({
        id: deptBoxId,
        type: 'position',
        position: { x: deptCenterX - 70, y: deptNameY },
        data: { 
          title: '', 
          subtitle: titleStr, 
          level: 0, 
          colorCategory: 'OH',
          isDeptName: true
        },
      });
    });

    // 고정된 레벨 위치 정의 (공통 계층 Y 좌표 사용)
    const glLevelY = getHierarchyY('GL');
    const tlLevelY = getHierarchyY('TL');
    const tmLevelY = getHierarchyY('TM_BASE');

    // 각 부서별로 노드 생성
    departments.forEach((dept: any, deptIndex: number) => {
      const deptCenterX = deptPositions[deptIndex];
      const titleStr = Array.isArray(dept.title) ? dept.title[0] : dept.title;
      const glCols = dept.glCount ? Number(dept.glCount) : (dept.hasGL ? 1 : 0);
      const tlCount = dept.tl.length;
      const numColumns = Math.max(tlCount, (dept.tm || []).length, glCols, 1);

      // 1) TM 카테고리 X 좌표 (열 기준)
      const catXs = computeCategoryXs(deptCenterX, numColumns, COL_SPACING, (dept.tm || []).length);

      // 2) TL X 좌표: 자신의 직하단 TM 카테고리 평균(없으면 기존 그리드)
      const tlXs = computeTLXs(
        tlCount,
        deptCenterX,
        numColumns,
        COL_SPACING,
        catXs,
        (catIdx, count) => Math.min(catIdx, Math.max(0, count - 1)),
        () => true
      );

      // 3) GL X 좌표: 직하단 TL 평균(없으면 그리드)
      const glXs = computeGLXs(glCols, deptCenterX, COL_SPACING, tlXs);

      // 4) 부서명 X: 직하단 평균으로 재정렬
      const deptNameX = computeDeptNameX(glXs, tlXs, catXs, deptCenterX);
      const deptBoxId = deptBoxIds[deptIndex];
      const deptNode = nodes.find(n => n.id === deptBoxId);
      if (deptNode) deptNode.position.x = deptNameX - 70;

      // GL 노드 (있는 경우만)
      let glId: string | null = null;
      if (dept.hasGL) {
        glId = getNextId();
        const glX = glXs[0] ?? (deptCenterX);
        nodes.push({
          id: glId,
          type: 'position',
          position: { x: glX - 70, y: glLevelY },
          data: { 
            title: 'GL', 
            subtitle: titleStr, 
            level: 2, 
            colorCategory: getColorCategory(dept.title, 'GL') 
          },
        });

        // 부서 박스 → GL 연결
        edges.push({
          id: `edge-${deptBoxId}-${glId}`,
          source: deptBoxId,
          target: glId,
          type: 'smoothstep',
        });
      }

      // TL 노드들
      const tlIds: string[] = [];
      if (tlCount > 0) {
        dept.tl.forEach((tl: string, tlIndex: number) => {
          const tlId = getNextId();
          tlIds.push(tlId);
          const tlX = tlXs[tlIndex] ?? (deptCenterX + (tlIndex - (tlCount - 1) / 2) * COL_SPACING);
          
          nodes.push({
            id: tlId,
            type: 'position',
            position: { x: tlX - 70, y: tlLevelY },
            data: { 
              title: 'TL', 
              subtitle: tl, 
              level: 3, 
              colorCategory: getColorCategory(dept.title, 'TL', tl) 
            },
          });

          // 상위 노드 → TL 연결 (GL이 있으면 GL에서, 없으면 부서 박스에서)
          const sourceId = glId || deptBoxId;
          if (glId) {
            // GL이 있는 경우 순차적 매핑은 필요 없음 (GL이 1개뿐)
            edges.push({
              id: `edge-${sourceId}-${tlId}`,
              source: sourceId,
              target: tlId,
              type: 'smoothstep',
              pathOptions: { offset: EDGE_OFFSET }
            });
          } else {
            // Dept → TL (skip): force bend at mid between DEPT and GL level
            edges.push({
              id: `edge-${sourceId}-${tlId}`,
              source: sourceId,
              target: tlId,
              type: 'customCenterY',
              data: { centerY: (0 + (glLevelY - 0) / 2), offset: EDGE_OFFSET }
            });
          }
        });
      }

      // TM 노드들 - 고정된 TM 레벨에 배치
      if (dept.tm.length > 0) {
        let tmX = deptCenterX - 70;
        
        // 연결할 상위 노드 결정 (TL → GL → 부서 박스 순서로 우선순위)
        const tmParentId = tlIds.length > 0 ? tlIds[0] : (glId || deptBoxIds[deptIndex]);
        
        // page3와 동일: TM을 카테고리별 컬럼으로 가로 분산, 각 컬럼 내 세로 스택
        const numColumns = Math.max(dept.tl.length, dept.tm.length, dept.hasGL ? 1 : 0, 1);
        dept.tm.forEach((tmGroup: string[], catIdx: number) => {
          let prev: string | null = null;
          tmGroup.forEach((tm: string, tmIdx: number) => {
            const tmId = getNextId();
            const tmXPos = catXs[catIdx] ?? (deptCenterX + (catIdx - (numColumns - 1) / 2) * COL_SPACING);
            const tmYPos = getTMY(tmLevelY, tmIdx);
            nodes.push({
              id: tmId,
              type: 'position',
              position: { x: tmXPos - 70, y: tmYPos },
              data: {
                title: getTMTitle(tm),
                subtitle: tm,
                level: 4,
                colorCategory: getColorCategory(dept.title, 'TM', tm)
              },
            });
            if (tmIdx === 0) {
              const tlForCat = tlIds.length > 0 ? tlIds[Math.min(catIdx, tlIds.length - 1)] : '';
              if (tlForCat) {
                edges.push({ id: `${tlForCat}-${tmId}`, source: tlForCat, target: tmId, type: 'smoothstep', pathOptions: { offset: EDGE_OFFSET } });
              } else if (glId) {
                // GL → TM (skip): force bend using custom edge at mid between GL and TL
                edges.push({ id: `${glId}-${tmId}`, source: glId, target: tmId, type: 'customCenterY', data: { centerY: glLevelY + (levelHeight / 2), offset: EDGE_OFFSET } });
              } else {
                // Dept → TM (skip): force bend using custom edge at mid between DEPT and GL
                edges.push({ id: `${deptBoxIds[deptIndex]}-${tmId}`, source: deptBoxIds[deptIndex], target: tmId, type: 'customCenterY', data: { centerY: (0 + (glLevelY - 0) / 2), offset: EDGE_OFFSET } });
              }
            } else if (prev) {
              edges.push({ id: `${prev}-${tmId}`, source: prev, target: tmId, type: 'smoothstep', pathOptions: { offset: EDGE_OFFSET } });
            }
            prev = tmId;
          });
        });
      }
    });

    return { nodes, edges };
  }, [departments]);

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
        edgeTypes={{ customCenterY: CustomCenterYEdge }}
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