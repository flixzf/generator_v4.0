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
import { getColorCategory } from '../theme';
import { makeDoubleLines, makeSingleLines, getShippingTMCount } from '../utils';
import { CustomPositionNode, nodeTypes, edgeTypes } from '../components';
import { CustomCenterYEdge } from '../components';
import { LAYOUT_CONFIG, calculateDeptWidth, DeptLayout, computeCategoryXs, computeTLXs, computeGLXs, computeDeptNameX, getYPosition, getHierarchyY, getTMY, calculateEntityPositions } from '../layout';
import { calculateEntityPositionsWithBoundingBox } from '../layout-bounding-box';
import { getDepartmentsForPage, DeptLike } from '../department-data';

interface ReactFlowPage2Props {
  onInit?: (instance: ReactFlowInstance) => void;
}

export const ReactFlowPage2: React.FC<ReactFlowPage2Props> = ({ onInit }) => {
  const { config } = useOrgChart();

  // Use centralized line utilities

  // Use centralized department data (with dynamic calculations for some departments)
  const departments = useMemo(() => {
    const baseDepartments = getDepartmentsForPage('page2');

    // 동적 부서 (config 기반) - Market 부서 통합 구조로 변경
    const dynamicDepartments = [
      // Admin 부서 - 라인 개수에 따른 동적 구성
      {
        title: ["Admin"],
        hasGL: false,
        tl: [],
        tm: (() => {
          const L = config.lineCount;
          // 라인 개수별 구성 로직
          // 1: 인사1, 2: 인사1+생산1, 3: 인1+생1+ISQ1, 4: 인1+생1+ISQ1
          // 5: 인2+생1+ISQ1, 6: 인2+생1+ISQ1, 7: 인2+생2+ISQ1, 8: 인2+생2+ISQ1

          let personnelCount = 1;
          let productionCount = 0;
          let isqCount = 0;

          if (L >= 5) {
            personnelCount = 2;
          }
          if (L >= 2) {
            productionCount = 1;
          }
          if (L >= 7) {
            productionCount = 2;
          }
          if (L >= 3) {
            isqCount = 1;
          }

          const personnel = Array.from({ length: personnelCount }, (_, i) =>
            personnelCount === 1 ? "Personnel" : `Personnel ${i + 1}`
          );
          const production = Array.from({ length: productionCount }, (_, i) =>
            productionCount === 1 ? "Production" : `Production ${i + 1}`
          );
          const isq = Array.from({ length: isqCount }, (_, i) => "ISQ");

          const result = [];
          if (personnel.length > 0) result.push(personnel);
          if (production.length > 0) result.push(production);
          if (isq.length > 0) result.push(isq);

          return result;
        })(),
      },
      // Small Tooling 부서 - 라인 개수에 따른 동적 구성 (한 줄 배치)
      {
        title: ["Small Tooling"],
        hasGL: false,
        tl: ["Small Tooling"],
        tm: (() => {
          const L = config.lineCount;

          // Last+ Small Tooling: Line 1: 0개, Line 2: 1개, Line 3: 1개, Line 4: 2개, Line 5: 2개, Line 6: 3개, Line 7: 3개, Line 8: 4개
          let lastSmallToolingCount = 0;
          if (L >= 2) lastSmallToolingCount = 1;
          if (L >= 4) lastSmallToolingCount = 2;
          if (L >= 6) lastSmallToolingCount = 3;
          if (L >= 8) lastSmallToolingCount = 4;

          // Pallet: Line 1: 0개, Line 2: 1개, Line 3: 1개, Line 4: 1개, Line 5: 2개, Line 6: 2개, Line 7: 3개, Line 8: 3개
          let palletTMCount = 0;
          if (L >= 2) palletTMCount = 1;
          if (L >= 5) palletTMCount = 2;
          if (L >= 7) palletTMCount = 3;

          // 모든 TM을 한 줄로 배치
          const allTMs = [];

          // Last+ Small Tooling TM들 추가
          for (let i = 0; i < lastSmallToolingCount; i++) {
            allTMs.push(`Last Control TM ${i + 1}`);
          }

          // Pallet TM들 추가
          for (let i = 0; i < palletTMCount; i++) {
            allTMs.push(`Pallet TM ${i + 1}`);
          }

          return [allTMs]; // 단일 컬럼으로 반환
        })(),
      },
      {
        title: "Market",
        hasGL: true,
        tl: ["Upper Market", "Bottom Market"],
        tm: (() => {
          const L = config.lineCount;

          // Sub Material: Line 1: 1, Line 2: 1, Line 3: 2, Line 4: 2, Line 5: 3, Line 6: 3, Line 7: 4, Line 8: 4
          let subMaterialCount = 1;
          if (L >= 3) subMaterialCount = 2;
          if (L >= 5) subMaterialCount = 3;
          if (L >= 7) subMaterialCount = 4;

          // Raw Material: Line 1: 1, Line 2: 2, Line 3: 3, Line 4: 3, Line 5: 4, Line 6: 5, Line 7: 6, Line 8: 6
          let rawMaterialTMCount = 0;
          if (L >= 2) rawMaterialTMCount = 1;
          if (L >= 3) rawMaterialTMCount = 2;
          if (L >= 5) rawMaterialTMCount = 3;
          if (L >= 6) rawMaterialTMCount = 4;
          if (L >= 7) rawMaterialTMCount = 5;

          // ACC Market: Line 1: 1, Line 2: 1, Line 3: 2, Line 4: 2, Line 5: 3, Line 6: 3, Line 7: 4, Line 8: 4
          let accMarketCount = 1;
          if (L >= 3) accMarketCount = 2;
          if (L >= 5) accMarketCount = 3;
          if (L >= 7) accMarketCount = 4;

          // Bottom Market: Line 1: OS1+MS1 (2), Line 2: OS1+MS2 (3), Line 3: OS2+MS2 (5), Line 4: TL1+OS2+MS2+ACC1 (6),
          // Line 5: TL1+OS2+MS3+ACC1 (7), Line 6: TL1+OS3+MS3+ACC1 (8), Line 7: TL1+OS4+MS3+ACC1 (9), Line 8: TL1+OS4+MS4+ACC1 (10)
          let bottomMarketTMs = [];
          if (L === 1) {
            bottomMarketTMs = ["Outsole 1", "Midsole 1"];
          } else if (L === 2) {
            bottomMarketTMs = ["Outsole 1", "Midsole 1", "Midsole 2"];
          } else if (L === 3) {
            bottomMarketTMs = ["Outsole 1", "Outsole 2", "Midsole 1", "Midsole 2"];
          } else if (L === 4) {
            bottomMarketTMs = ["Bottom Market TL", "Outsole 1", "Outsole 2", "Midsole 1", "Midsole 2", "ACC 1"];
          } else if (L === 5) {
            bottomMarketTMs = ["Bottom Market TL", "Outsole 1", "Outsole 2", "Midsole 1", "Midsole 2", "Midsole 3", "ACC 1"];
          } else if (L === 6) {
            bottomMarketTMs = ["Bottom Market TL", "Outsole 1", "Outsole 2", "Outsole 3", "Midsole 1", "Midsole 2", "Midsole 3", "ACC 1"];
          } else if (L === 7) {
            bottomMarketTMs = ["Bottom Market TL", "Outsole 1", "Outsole 2", "Outsole 3", "Outsole 4", "Midsole 1", "Midsole 2", "Midsole 3", "ACC 1"];
          } else { // L >= 8
            bottomMarketTMs = ["Bottom Market TL", "Outsole 1", "Outsole 2", "Outsole 3", "Outsole 4", "Midsole 1", "Midsole 2", "Midsole 3", "Midsole 4", "ACC 1"];
          }

          return [
            // Sub Material (TL 0: Upper Market)
            Array.from({ length: subMaterialCount }, (_, i) => `Sub Material ${i + 1}`),

            // Raw Material (TL 0: Upper Market)
            Array.from({ length: rawMaterialTMCount }, (_, i) => `Raw Material TM ${i + 1}`),

            // ACC Market (TL 0: Upper Market)
            Array.from({ length: accMarketCount }, (_, i) => `ACC Market ${i + 1}`),

            // Bottom Market (TL 1: Bottom Market)
            bottomMarketTMs,
          ];
        })(),
        parts: ["Sub Material", "Raw Material", "ACC Market", "Bottom Market"],
        categoryTLMap: [0, 0, 0, 1] // 첫 3개 컬럼은 TL 0(Upper), 마지막은 TL 1(Bottom)
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
        title: "FG WH\nP&L Market",
        hasGL: true,
        tl: ["P&L Market", "FG WH"],
        tm: (() => {
          const L = config.lineCount;

          // P&L Market 카테고리별 TM 개수 계산
          // Stencil: Line 1: 1, Line 2: 1, Line 3: 2, Line 4: 2, Line 5: 3, Line 6: 3, Line 7: 4, Line 8: 4
          let stencilCount = 1;
          if (L >= 3) stencilCount = 2;
          if (L >= 5) stencilCount = 3;
          if (L >= 7) stencilCount = 4;

          // CO Label: 모든 라인에서 1개 고정
          const coLabelCount = 1;

          // Box MH: Line 1: 1, Line 2: 1, Line 3: 2, Line 4: 2, Line 5: 3, Line 6: 3, Line 7: 4, Line 8: 4
          let boxMHCount = 1;
          if (L >= 3) boxMHCount = 2;
          if (L >= 5) boxMHCount = 3;
          if (L >= 7) boxMHCount = 4;

          // Paper MH: Line 1: 1, Line 2: 1, Line 3: 2, Line 4: 2, Line 5: 3, Line 6: 3, Line 7: 4, Line 8: 4
          let paperMHCount = 1;
          if (L >= 3) paperMHCount = 2;
          if (L >= 5) paperMHCount = 3;
          if (L >= 7) paperMHCount = 4;

          // FG WH 카테고리별 TM 개수 계산
          // Shipping: Line 1: 1, Line 2: 2, Line 3: 3, Line 4: 3, Line 5: 4, Line 6: 5, Line 7: 6, Line 8: 6
          let shippingCount = 1;
          if (L >= 2) shippingCount = 2;
          if (L >= 3) shippingCount = 3;
          if (L >= 5) shippingCount = 4;
          if (L >= 6) shippingCount = 5;
          if (L >= 7) shippingCount = 6;

          // Incoming+ Setting: Line 1: 1, Line 2: 2, Line 3: 3, Line 4: 4, Line 5: 5, Line 6: 6, Line 7: 7, Line 8: 8
          let incomingSettingCount = L;

          // Scan+ System+ Report: 모든 라인에서 1개 고정
          const scanSystemReportCount = 1;

          const stencilTMs = Array.from({ length: stencilCount }, (_, i) => `Stencil ${i + 1}`);
          const coLabelTMs = Array.from({ length: coLabelCount }, (_, i) => `CO Label ${i + 1}`);
          const boxMHTMs = Array.from({ length: boxMHCount }, (_, i) => `Box MH ${i + 1}`);
          const paperMHTMs = Array.from({ length: paperMHCount }, (_, i) => `Paper MH ${i + 1}`);
          const shippingTMs = Array.from({ length: shippingCount }, (_, i) => `Shipping TM ${i + 1}`);
          const incomingSettingTMs = Array.from({ length: incomingSettingCount }, (_, i) => `Incoming Setting TM ${i + 1}`);
          const scanSystemReportTMs = Array.from({ length: scanSystemReportCount }, (_, i) => `Scan System Report TM ${i + 1}`);

          return [
            // P&L Market TM들 (TL 0) - 첫 번째 컬럼
            [...stencilTMs, ...coLabelTMs, ...boxMHTMs],
            // P&L Market TM들 (TL 0) - 두 번째 컬럼
            [...paperMHTMs],
            // FG WH TM들 (TL 1) - 세 번째 컬럼
            [...shippingTMs],
            // FG WH TM들 (TL 1) - 네 번째 컬럼
            [...incomingSettingTMs],
            // FG WH TM들 (TL 1) - 다섯 번째 컬럼
            [...scanSystemReportTMs],
          ];
        })(),
        parts: ["Carton/Inner Box", "Paper", "Shipping", "Stock Management", "Scan, System, Report"],
        categoryTLMap: [0, 0, 1, 1, 1] // 첫 2개는 P&L Market(TL 0), 나머지 3개는 FG WH(TL 1)
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

    // 정렬: admin → small tooling → market → fg wh p&l market → plant production
    const ORDER = [
      'admin',
      'small tooling',
      'market',
      'fg wh',
      'plant production',
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

    // 단일 컬럼 강제 대상: admin, small tooling, plant production
    const SINGLE_COLUMN = new Set<string>([
      'admin', 'small tooling', 'plant production'
    ]);

    const finalDepts = sorted.map((dept: DeptLike) => {
      const primary = normalizePrimaryName(dept);
      if (SINGLE_COLUMN.has(primary)) {
        const flat = (dept.tm || []).reduce((acc: string[], arr: string[]) => acc.concat(arr), []);
        return { ...dept, tm: [flat] } as DeptLike;
      }
      return dept;
    });

    return finalDepts as any;
  }, [config.lineCount, makeDoubleLines, makeSingleLines, getShippingTMCount]);

  // 특정 TM은 "TM (MH)"로 헤드를 변경
  const getTMTitle = (subtitle: string) => {
    const lower = subtitle.toLowerCase();
    // P&L Market 규칙: Stencil, CO Label은 TM / 나머지(Box, Paper 등)는 TM (MH)
    if (lower.startsWith('stencil') || lower.includes('co label')) return 'TM';
    const mhKeywords = ['material','acc','outsole','midsole','box','paper','incoming & setting'];
    return mhKeywords.some(k => lower.includes(k)) ? 'TM (MH)' : 'TM';
  };

  // TL에서 카테고리로의 매핑 결정
  const resolveTLForCategory = (dept: any, catIdx: number): number => {
    if (dept.categoryTLMap && dept.categoryTLMap[catIdx] !== undefined) {
      return dept.categoryTLMap[catIdx];
    }
    // 기본값: 카테고리를 TL에 균등 분배
    return Math.min(catIdx, dept.tl.length - 1);
  };

  // 노드와 엣지 생성 (Market 부서 특별 처리 포함)
  const createNodesAndEdges = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    let idCounter = 0;
    const getNextId = () => `node-${idCounter++}`;

    // 레이아웃 설정
    const levelHeight = LAYOUT_CONFIG.LEVEL_HEIGHT;
    const partLevelY = getHierarchyY('PART');

    // 바운딩 박스 기반으로 부서 배치 계산 (균등한 간격)
    const { positions: deptPositions } = calculateEntityPositionsWithBoundingBox(
      departments as DeptLayout[],
      150 // 부서간 균등 간격 150px
    );


    // 부서명 텍스트 노드들 (최상단에 배치)
    const deptNameY = getHierarchyY('DEPT');
    const deptBoxIds: string[] = [];

    departments.forEach((dept: any, deptIndex: number) => {
      const deptCenterX = deptPositions[deptIndex];
      const titleStr = Array.isArray(dept.title) ? dept.title[0] : dept.title;

      const deptBoxId = getNextId();
      deptBoxIds.push(deptBoxId);

      nodes.push({
        id: deptBoxId,
        type: 'customPosition',
        position: { x: deptCenterX - 70, y: deptNameY },
        data: {
          title: '',
          subtitle: titleStr,
          level: 'DEPT',
          colorCategory: 'OH'
        },
      });
    });

    // 고정된 레벨 위치 정의
    const glLevelY = getHierarchyY('GL');
    const tlLevelY = getHierarchyY('TL');
    const tmLevelY = getHierarchyY('TM_BASE');

    // 각 부서별로 노드 생성
    departments.forEach((dept: any, deptIndex: number) => {
      const deptCenterX = deptPositions[deptIndex];
      const titleStr = Array.isArray(dept.title) ? dept.title[0] : dept.title;
      const glCols = dept.glCount ? Number(dept.glCount) : (dept.hasGL ? 1 : 0);
      const tlCount = dept.tl.length;

      // Market 부서 특별 처리: TL별로 카테고리 재배치
      let adjustedCatXs: number[] = [];
      let adjustedTLXs: number[] = [];
      let assignedTLIndices: number[] = [];

      if (titleStr.toLowerCase() === 'market' && dept.categoryTLMap) {
        // TL별로 카테고리 그룹화
        const tlGroups: number[][] = [];
        for (let i = 0; i < tlCount; i++) {
          tlGroups.push([]);
        }

        dept.categoryTLMap.forEach((tlIdx: number, catIdx: number) => {
          if (tlIdx < tlGroups.length) {
            tlGroups[tlIdx].push(catIdx);
          }
        });

        // Upper Market (TL 0)의 카테고리들을 특정 정렬로 배치
        const upperCats = tlGroups[0] || [];
        const rawMatIdx = upperCats.find(idx => dept.parts && dept.parts[idx] === 'Raw Material');
        const subMatIdx = upperCats.find(idx => dept.parts && dept.parts[idx] === 'Sub Material');
        const accMatIdx = upperCats.find(idx => dept.parts && dept.parts[idx] === 'ACC Market');

        // 박스 너비와 간격 설정
        const boxWidth = 160; // 노드 박스 너비
        const spacing = boxWidth + 20; // 박스 + 간격

        // Raw Material의 X 좌표를 기준점으로 설정 (Upper Market TL과 정렬)
        const rawMaterialX = deptCenterX;

        const reorderedCatIndices: number[] = [];
        const catXPositions: number[] = [];

        // Sub Material: Raw Material - (box + spacing)
        if (subMatIdx !== undefined) {
          reorderedCatIndices.push(subMatIdx);
          catXPositions.push(rawMaterialX - spacing);
          assignedTLIndices.push(0);
        }

        // Raw Material: 중앙 (기준점)
        if (rawMatIdx !== undefined) {
          reorderedCatIndices.push(rawMatIdx);
          catXPositions.push(rawMaterialX);
          assignedTLIndices.push(0);
        }

        // ACC Market: Raw Material + (box + spacing)
        if (accMatIdx !== undefined) {
          reorderedCatIndices.push(accMatIdx);
          catXPositions.push(rawMaterialX + spacing);
          assignedTLIndices.push(0);
        }

        // Bottom Market (TL 1) 카테고리 추가
        const bottomCats = tlGroups[1] || [];
        bottomCats.forEach(catIdx => {
          reorderedCatIndices.push(catIdx);
          catXPositions.push(rawMaterialX + spacing * 2.5); // 적당히 떨어진 위치
          assignedTLIndices.push(1);
        });

        adjustedCatXs = catXPositions;

        // TL 위치 계산
        // Upper Market TL: Raw Material의 X 좌표와 정확히 일치
        const upperMarketTLX = rawMaterialX;

        // Bottom Market TL: Bottom 카테고리들의 평균
        const bottomCatXs = catXPositions.slice(reorderedCatIndices.length - bottomCats.length);
        const bottomMarketTLX = bottomCatXs.length > 0 ?
          bottomCatXs.reduce((a, b) => a + b, 0) / bottomCatXs.length :
          rawMaterialX + spacing * 2.5;

        adjustedTLXs = [upperMarketTLX, bottomMarketTLX];
      } else if (titleStr.toLowerCase().includes('fg wh') && titleStr.toLowerCase().includes('p&l market') && dept.categoryTLMap) {
        // FG WH/P&L Market 합친 부서 특별 처리
        const tlGroups: number[][] = [];
        for (let i = 0; i < tlCount; i++) {
          tlGroups.push([]);
        }

        dept.categoryTLMap.forEach((tlIdx: number, catIdx: number) => {
          if (tlIdx < tlGroups.length) {
            tlGroups[tlIdx].push(catIdx);
          }
        });

        const boxWidth = 160;
        const spacing = boxWidth + 20;

        const reorderedCatIndices: number[] = [];
        const catXPositions: number[] = [];

        // P&L Market (TL 0) 카테고리들 - 2개
        const pnlCats = tlGroups[0] || [];
        if (pnlCats.length > 0) {
          // P&L Market TL을 기준으로 카테고리들을 좌우로 배치
          const pnlTLX = deptCenterX - spacing; // P&L Market TL 위치

          pnlCats.forEach((catIdx, index) => {
            reorderedCatIndices.push(catIdx);
            // 첫 번째는 왼쪽, 두 번째는 오른쪽
            catXPositions.push(pnlTLX + (index - 0.5) * spacing);
            assignedTLIndices.push(0);
          });
        }

        // FG WH (TL 1) 카테고리들 - 3개
        const fgwhCats = tlGroups[1] || [];
        if (fgwhCats.length > 0) {
          // FG WH TL을 기준으로 카테고리들을 좌우로 배치
          const fgwhTLX = deptCenterX + spacing * 1.5; // FG WH TL 위치

          fgwhCats.forEach((catIdx, index) => {
            reorderedCatIndices.push(catIdx);
            // 3개 카테고리를 TL 중심으로 배치: 왼쪽, 중앙, 오른쪽
            catXPositions.push(fgwhTLX + (index - 1) * spacing);
            assignedTLIndices.push(1);
          });
        }

        adjustedCatXs = catXPositions;

        // TL 위치 계산
        const pnlTLX = deptCenterX - spacing;
        const fgwhTLX = deptCenterX + spacing * 1.5;

        adjustedTLXs = [pnlTLX, fgwhTLX];
      } else {
        // 기본 레이아웃 계산
        adjustedCatXs = computeCategoryXs(deptCenterX, (dept.tm || []).length);
        adjustedTLXs = computeTLXs(
          tlCount,
          deptCenterX,
          adjustedCatXs,
          LAYOUT_CONFIG.COL_SPACING
        );
        assignedTLIndices = adjustedCatXs.map((_, idx) => Math.min(idx, tlCount - 1));
      }

      // GL X 좌표
      const glXs = computeGLXs(glCols, deptCenterX, adjustedTLXs);

      // 부서명 X 재정렬
      const deptNameX = computeDeptNameX(glXs, adjustedTLXs, adjustedCatXs, deptCenterX);
      const deptBoxId = deptBoxIds[deptIndex];
      const deptNode = nodes.find(n => n.id === deptBoxId);
      if (deptNode) deptNode.position.x = deptNameX - 70;

      // GL 노드
      let glId: string | null = null;
      if (dept.hasGL) {
        glId = getNextId();
        const glX = glXs[0] ?? deptCenterX;
        nodes.push({
          id: glId,
          type: 'customPosition',
          position: { x: glX - 70, y: glLevelY },
          data: {
            title: 'GL',
            subtitle: titleStr,
            level: 'GL',
            colorCategory: getColorCategory(dept.title, 'GL')
          },
        });

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
          const tlX = adjustedTLXs[tlIndex] ?? (deptCenterX + (tlIndex - (tlCount - 1) / 2) * LAYOUT_CONFIG.COL_SPACING);

          nodes.push({
            id: tlId,
            type: 'customPosition',
            position: { x: tlX - 70, y: tlLevelY },
            data: {
              title: 'TL',
              subtitle: tl,
              level: 'TL',
              colorCategory: getColorCategory(dept.title, 'TL', tl)
            },
          });

          const sourceId = glId || deptBoxId;
          if (glId) {
            edges.push({
              id: `edge-${sourceId}-${tlId}`,
              source: sourceId,
              target: tlId,
              type: 'smoothstep',
              pathOptions: { offset: LAYOUT_CONFIG.EDGE_OFFSET }
            });
          } else {
            edges.push({
              id: `edge-${sourceId}-${tlId}`,
              source: sourceId,
              target: tlId,
              type: 'customCenterY',
              data: { centerY: (deptNameY + glLevelY) / 2, offset: LAYOUT_CONFIG.EDGE_OFFSET }
            });
          }
        });
      }

      // TM 노드들과 파트 라벨
      if (dept.tm.length > 0) {
        dept.tm.forEach((tmGroup: string[], catIdx: number) => {
          let prev: string | null = null;

          // 파트 라벨 생성 (박스 없이, 투명 배경)
          if (dept.parts && dept.parts[catIdx]) {
            const partLabelId = getNextId();
            const partX = adjustedCatXs[catIdx] ?? (deptCenterX + (catIdx - (dept.tm.length - 1) / 2) * LAYOUT_CONFIG.COL_SPACING);

            nodes.push({
              id: partLabelId,
              type: 'customPosition',
              position: { x: partX - -8, y: partLevelY - 0 },
              data: {
                title: dept.parts[catIdx],
                subtitle: '',
                level: 'PART',
                colorCategory: 'direct',
                isPartLabel: true
              }
            });
          }

          tmGroup.forEach((tm: string, tmIdx: number) => {
            const tmId = getNextId();
            const tmXPos = adjustedCatXs[catIdx] ?? (deptCenterX + (catIdx - (dept.tm.length - 1) / 2) * LAYOUT_CONFIG.COL_SPACING);
            const tmYPos = getTMY(tmLevelY, tmIdx);

            nodes.push({
              id: tmId,
              type: 'customPosition',
              position: { x: tmXPos - 70, y: tmYPos },
              data: {
                title: getTMTitle(tm),
                subtitle: tm,
                level: 'TM',
                colorCategory: getColorCategory(dept.title, 'TM', tm)
              },
            });

            if (tmIdx === 0) {
              const tlIdx = resolveTLForCategory(dept, catIdx);
              const tlForCat = tlIds[tlIdx];

              if (tlForCat) {
                edges.push({
                  id: `${tlForCat}-${tmId}`,
                  source: tlForCat,
                  target: tmId,
                  type: 'smoothstep',
                  pathOptions: { offset: LAYOUT_CONFIG.EDGE_OFFSET }
                });
              } else if (glId) {
                edges.push({
                  id: `${glId}-${tmId}`,
                  source: glId,
                  target: tmId,
                  type: 'customCenterY',
                  data: { centerY: glLevelY + levelHeight / 2, offset: LAYOUT_CONFIG.EDGE_OFFSET }
                });
              } else {
                edges.push({
                  id: `${deptBoxIds[deptIndex]}-${tmId}`,
                  source: deptBoxIds[deptIndex],
                  target: tmId,
                  type: 'customCenterY',
                  data: { centerY: (deptNameY + glLevelY) / 2, offset: LAYOUT_CONFIG.EDGE_OFFSET }
                });
              }
            } else if (prev) {
              edges.push({
                id: `${prev}-${tmId}`,
                source: prev,
                target: tmId,
                type: 'smoothstep',
                pathOptions: { offset: LAYOUT_CONFIG.EDGE_OFFSET }
              });
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
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
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