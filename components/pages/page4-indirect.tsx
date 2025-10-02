"use client";
import React, { useState, useMemo } from 'react';
import { useOrgChart } from '@/context/OrgChartContext';
import { Node } from 'reactflow';

// Department, Level, Category를 포함하는 노드 데이터 타입 정의
type NodeData = {
  colorCategory: 'OH' | 'indirect' | 'direct' | 'blank';
  department: string;
  level: 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT';
  subtitle?: string;
  isDeptName?: boolean;
};

type CustomNode = Node<NodeData>;

// 요약 데이터 구조 정의
type Summary = {
  [level: string]: {
    [dept: string]: number;
    SUM: number;
  };
};

// =================================================================
// START: Node Generation Logic from ReactFlowPage1, 2, 3
// =================================================================

// Import the getProcessGroups function from ReactFlowPage1
import { getProcessGroups } from '@/components/common/reactflow/ReactFlowPage1';
import { classifyPosition } from '@/components/common/classification';
import { getDepartmentsForPage } from '@/components/common/department-data';
import { makeDoubleLines } from '@/components/common/utils';

// Use the imported getProcessGroups function with 'display' context
function getProcessGroups_p1(config: any, selectedModel?: any, lineIndex?: number) {
  // Use the 'display' context to merge stockfit-assembly into a single GL (matching Page1 display)
  return getProcessGroups(config, selectedModel, lineIndex, 'display');
}

// --- Logic from ReactFlowPage1 (DYNAMIC) - ReactFlowPage1과 완전히 동일하게 ---
const generateNodesForPage1 = (config: any, models: any[], effectiveLineModelSelections: number[]): CustomNode[] => {
  const nodes: CustomNode[] = [];
  let idCounter = 1;
  const getNextId = () => `p1-node-${idCounter++}`;

  // VSM 노드
  nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'VSM', colorCategory: classifyPosition('Line', 'VSM' as 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT') } });

  // 분리된 공정을 가진 라인들 찾기
  const linesWithNosew: number[] = [];
  const linesWithHfWelding: number[] = [];

  Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
    const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
    const selectedModel = models[modelIndex];
    if (!selectedModel) return;

    // A.VSM 노드 (1개 라인당 1개)
    nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'A.VSM', colorCategory: classifyPosition('Line', 'A.VSM' as 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT') } });

    // 메인 공정 노드들 - 'calculation' 컨텍스트 사용하여 Stockfit과 Assembly 분리
    const { mainProcesses } = getProcessGroups_p1(config, selectedModel, lineIndex);
    mainProcesses.forEach(processGroup => {
      if (processGroup.showGL !== false) {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'GL', colorCategory: classifyPosition('Line', 'GL') } });
      }
      processGroup.tlGroup.forEach((tl: any) => {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'TL', subtitle: tl.subtitle, colorCategory: classifyPosition('Line', 'TL', undefined, tl.subtitle) } });
      });
      processGroup.tmGroup.forEach((tm: any) => {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'TM', subtitle: tm.subtitle, colorCategory: classifyPosition('Line', 'TM', undefined, tm.subtitle) } });
      });
    });

    // 분리된 공정 체크
    const processes = selectedModel.processes || [];
    if (processes.some((p: any) => p?.name && p.name.toLowerCase().includes('no-sew'))) {
      linesWithNosew.push(lineIndex);
    }
    if (processes.some((p: any) => p?.name && p.name.toLowerCase().includes('hf welding'))) {
      linesWithHfWelding.push(lineIndex);
    }
  });

  // No-sew 분리된 공정 노드들 생성 (ReactFlowPage1 로직과 완전히 동일)
  if (linesWithNosew.length > 0) {
    const shiftCols = config.shiftsCount || 1;
    const totalTLCount = linesWithNosew.length * shiftCols;
    const requiredGLCount = Math.floor(totalTLCount / 4); // 4개 TL당 1개 GL

    // GL 노드들 생성 (requiredGLCount만큼만)
    for (let i = 0; i < requiredGLCount; i++) {
      nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'No-sew', level: 'GL', colorCategory: classifyPosition('No-sew', 'GL') } });
    }

    // TL, TM 노드들 (각 라인별 × 시프트 수)
    linesWithNosew.forEach((lineIndex) => {
      for (let col = 0; col < shiftCols; col++) {
        const shiftSuffix = shiftCols === 1 ? '' : ` ${col === 0 ? 'A' : 'B'}`;
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'No-sew', level: 'TL', subtitle: `Line ${lineIndex + 1} No-sew${shiftSuffix}`, colorCategory: classifyPosition('No-sew', 'TL') } });
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'No-sew', level: 'TM', subtitle: `Line ${lineIndex + 1} No-sew${shiftSuffix}`, colorCategory: classifyPosition('No-sew', 'TM') } });
      }
    });
  }

  // HF Welding 분리된 공정 노드들 생성 (ReactFlowPage1 로직과 완전히 동일)
  if (linesWithHfWelding.length > 0) {
    const hfCols = config.shiftsCount || 1;

    // HF Welding은 GL이 없음 (ReactFlowPage1 참조)

    // TL 노드들 (각 라인별 × 시프트 수)
    linesWithHfWelding.forEach((lineIndex) => {
      for (let col = 0; col < hfCols; col++) {
        const shiftSuffix = hfCols === 1 ? '' : ` ${col === 0 ? 'A' : 'B'}`;
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'HF Welding', level: 'TL', subtitle: `Line ${lineIndex + 1} HF Welding${shiftSuffix}`, colorCategory: classifyPosition('HF Welding', 'TL') } });
      }
    });

    // TM 노드들 (2개 라인당 1개 × 시프트 수)
    const hfTmGroups = Math.ceil(linesWithHfWelding.length / 2);
    for (let col = 0; col < hfCols; col++) {
      for (let g = 0; g < hfTmGroups; g++) {
        const shiftSuffix = hfCols === 1 ? '' : ` ${col === 0 ? 'A' : 'B'}`;
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'HF Welding', level: 'TM', subtitle: `HF Welding${shiftSuffix} ${g + 1}`, colorCategory: classifyPosition('HF Welding', 'TM') } });
      }
    }
  }

  return nodes;
};

// --- Logic from ReactFlowPage2 (DYNAMIC) ---
const generateNodesForPage2 = (config: any): CustomNode[] => {
    const nodes: CustomNode[] = [];
    let idCounter = 0;
    const getNextId = () => `p2-node-${idCounter++}`;

    const L = config.lineCount;

    // Admin 부서 - 동적 구성
    let personnelCount = 1;
    let productionCount = 0;
    let isqCount = 0;
    if (L >= 5) personnelCount = 2;
    if (L >= 2) productionCount = 1;
    if (L >= 7) productionCount = 2;
    if (L >= 3) isqCount = 1;

    // Market Sub Material 계산
    let subMaterialCount = 1;
    if (L >= 3) subMaterialCount = 2;
    if (L >= 5) subMaterialCount = 3;
    if (L >= 7) subMaterialCount = 4;

    // Market Raw Material 계산
    let rawMaterialTMCount = 0;
    if (L >= 2) rawMaterialTMCount = 1;
    if (L >= 3) rawMaterialTMCount = 2;
    if (L >= 5) rawMaterialTMCount = 3;
    if (L >= 6) rawMaterialTMCount = 4;
    if (L >= 7) rawMaterialTMCount = 5;

    // Market ACC Market 계산
    let accMarketCount = 1;
    if (L >= 3) accMarketCount = 2;
    if (L >= 5) accMarketCount = 3;
    if (L >= 7) accMarketCount = 4;

    // Market Bottom Market 계산 - ReactFlowPage2와 완전히 동일
    let bottomMarketTMs = [];
    if (L === 1) {
        bottomMarketTMs = ["Outsole 1", "Midsole 1"];
    } else if (L === 2) {
        bottomMarketTMs = ["Outsole 1", "Midsole 1", "Midsole 2"];
    } else if (L === 3) {
        bottomMarketTMs = ["Outsole 1", "Outsole 2", "Midsole 1", "Midsole 2"];
    } else if (L === 4) {
        bottomMarketTMs = ["Outsole 1", "Outsole 2", "Midsole 1", "Midsole 2", "Bottom ACC"];
    } else if (L === 5) {
        bottomMarketTMs = ["Outsole 1", "Outsole 2", "Midsole 1", "Midsole 2", "Midsole 3", "Bottom ACC"];
    } else if (L === 6) {
        bottomMarketTMs = ["Outsole 1", "Outsole 2", "Outsole 3", "Midsole 1", "Midsole 2", "Midsole 3", "Bottom ACC"];
    } else if (L === 7) {
        bottomMarketTMs = ["Outsole 1", "Outsole 2", "Outsole 3", "Outsole 4", "Midsole 1", "Midsole 2", "Midsole 3", "Bottom ACC"];
    } else { // L >= 8
        bottomMarketTMs = ["Outsole 1", "Outsole 2", "Outsole 3", "Outsole 4", "Midsole 1", "Midsole 2", "Midsole 3", "Midsole 4", "Bottom ACC"];
    }

    const departments = [
        // Admin 부서 - ReactFlowPage2와 동일
        {
            title: "Admin",
            hasGL: false,
            tl: [],
            tm: (() => {
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
        // Small Tooling 부서 - ReactFlowPage2와 동일
        {
            title: "Small Tooling",
            hasGL: false,
            tl: ["Small Tooling"],
            tm: [Array.from({ length: Math.max(0, L - 1) }, (_, i) => `Small Tooling ${i + 1}`)],
        },
        // Market 부서 - ReactFlowPage2와 완전히 동일
        {
            title: "Market",
            hasGL: true,
            tl: ["Upper Market", "Bottom Market"],
            tm: [
                // Sub Material (TL 0: Upper Market)
                Array.from({ length: subMaterialCount }, (_, i) => `Sub Material ${i + 1}`),
                // Raw Material (TL 0: Upper Market)
                Array.from({ length: rawMaterialTMCount }, (_, i) => `Raw Material ${i + 1}`),
                // ACC Market (TL 0: Upper Market)
                Array.from({ length: accMarketCount }, (_, i) => `ACC Market ${i + 1}`),
                // Bottom Market (TL 1: Bottom Market)
                bottomMarketTMs,
            ],
        },
        // Plant Production - ReactFlowPage2와 동일
        {
            title: "Plant Production\n(Outsole degreasing)",
            hasGL: false,
            tl: [],
            tm: [
                makeDoubleLines(L).map(line => `${line} Input`),
                makeDoubleLines(L).map(line => `${line} Output`)
            ],
        },
        // FG WH/P&L Market 통합 부서 - ReactFlowPage2와 완전히 동일하게
        {
            title: "FG WH\nP&L Market",
            hasGL: true,
            tl: ["P&L Market", "FG WH"],
            tm: (() => {
                // P&L Market 카테고리별 TM 개수 계산
                let stencilCount = 1;
                if (L >= 3) stencilCount = 2;
                if (L >= 5) stencilCount = 3;
                if (L >= 7) stencilCount = 4;

                const coLabelCount = 1;

                let boxCount = 1;
                if (L >= 3) boxCount = 2;
                if (L >= 5) boxCount = 3;
                if (L >= 7) boxCount = 4;

                let paperCount = 1;
                if (L >= 3) paperCount = 2;
                if (L >= 5) paperCount = 3;
                if (L >= 7) paperCount = 4;

                // FG WH 카테고리별 TM 개수 계산
                let shippingCount = 1;
                if (L >= 2) shippingCount = 2;
                if (L >= 3) shippingCount = 3;
                if (L >= 5) shippingCount = 4;
                if (L >= 6) shippingCount = 5;
                if (L >= 7) shippingCount = 6;

                const incomingSettingCount = L;
                const scanSystemReportCount = 1;

                const stencilTMs = Array.from({ length: stencilCount }, (_, i) => `Stencil ${i + 1}`);
                const coLabelTMs = Array.from({ length: coLabelCount }, (_, i) => `CO Label ${i + 1}`);
                const boxTMs = Array.from({ length: boxCount }, (_, i) => `Box ${i + 1}`);
                const paperTMs = Array.from({ length: paperCount }, (_, i) => `Paper ${i + 1}`);
                const shippingTMs = Array.from({ length: shippingCount }, (_, i) => `Shipping ${i + 1}`);
                const incomingSettingTMs = Array.from({ length: incomingSettingCount }, (_, i) => `Incoming Setting ${i + 1}`);
                const scanSystemReportTMs = Array.from({ length: scanSystemReportCount }, (_, i) => `Scan System Report ${i + 1}`);

                return [
                    // P&L Market TM들 (TL 0) - 첫 번째 컬럼
                    [...stencilTMs, ...coLabelTMs, ...boxTMs],
                    // P&L Market TM들 (TL 0) - 두 번째 컬럼
                    [...paperTMs],
                    // FG WH TM들 (TL 1) - 세 번째 컬럼
                    [...shippingTMs],
                    // FG WH TM들 (TL 1) - 네 번째 컬럼
                    [...incomingSettingTMs],
                    // FG WH TM들 (TL 1) - 다섯 번째 컬럼
                    [...scanSystemReportTMs],
                ];
            })(),
        },
    ];

    departments.forEach(dept => {
        const deptName = Array.isArray(dept.title) ? dept.title[0] : dept.title;

        // 부서명 박스 노드
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'DEPT', colorCategory: classifyPosition(deptName, 'DEPT') } });

        if (dept.hasGL) {
            nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'GL', colorCategory: classifyPosition(deptName, 'GL') } });
        }
        dept.tl.forEach(tl => {
            nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'TL', subtitle: tl, colorCategory: classifyPosition(deptName, 'TL', undefined, tl) } });
        });
        dept.tm.forEach(tmGroup => {
            tmGroup.forEach(tm => {
                nodes.push({
                    id: getNextId(),
                    type: 'position',
                    position: { x: 0, y: 0 },
                    data: {
                        department: deptName,
                        level: 'TM',
                        subtitle: tm,  // subtitle 추가!
                        colorCategory: classifyPosition(deptName, 'TM', undefined, tm)
                    }
                });
            });
        });
    });

    return nodes;
};

// --- Logic from ReactFlowPage3 (DYNAMIC - matches ReactFlowPage3.tsx) ---
const generateNodesForPage3 = (config: any): CustomNode[] => {
    const nodes: CustomNode[] = [];
    let idCounter = 0;
    const getNextId = () => `p3-node-${idCounter++}`;

    const L = config.lineCount;
    const G = config.gateCount;
    const P = config.qaPrs ?? 2400;

    const qaTmPerLine = (p: number) => {
        if (p <= 900) return 1;
        if (p <= 2000) return 2;
        if (p <= 2400) return 3;
        return 4;
    };

    // Quality TMs
    const qaTMGroups = Array.from({ length: L }, (_, idx) =>
        Array.from({ length: qaTmPerLine(P) }, (_, j) => `QA Line ${idx + 1}-${j + 1}`)
    );
    // MA TM 총합 (2212221 반복)
    const maPattern = [2, 2, 1, 2, 2, 2, 1];
    let maTotal = 0;
    for (let i = 0; i < L; i++) maTotal += maPattern[i % maPattern.length];
    const maTM = Array.from({ length: maTotal }, (_, i) => `MA-${i + 1}`);
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
    const tpmCSATMs = Array.from({ length: Math.max(0, tpmCSATM) }, (_, i) => `Cutting &\nStockfit-Assembly-${i + 1}`);
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

    const departments = [
        {
            title: "Quality",
            hasGL: true,
            glCount: Math.ceil(L / 2),
            tl: Array.from({ length: L }, (_, i) => `QA Line ${i + 1}`),
            tm: [
                ...qaTMGroups,
                maTM,
                bnpTM,
            ],
        },
        {
            title: "CE",
            hasGL: false,
            tl: ceTLs,
            tm: [ceTMs],
        },
        {
            title: "TPM",
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
            title: "CQM",
            hasGL: false,
            tl: cqmTLs,
            tm: [],
        },
        {
            title: "Lean",
            hasGL: false,
            tl: leanTLs,
            tm: [],
        },
        {
            title: "Security",
            hasGL: false,
            tl: [],
            tm: [Array.from({ length: G }, (_, i) => `Gate ${i + 1}`)],
        },
        {
            title: "RMCC",
            hasGL: false,
            tl: [],
            tm: [["Solid Waste"]],
        }
    ];

    // Use centralized classification engine for all positions

    departments.forEach(dept => {
        const deptName = dept.title;

        // 부서명 노드
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'DEPT', colorCategory: classifyPosition(deptName, 'DEPT') } });

        // GL 노드 - glCount를 사용하여 동적으로 생성
        if (dept.hasGL) {
            const glCount = (dept as any).glCount || 1;  // glCount가 없으면 기본값 1
            for (let i = 0; i < glCount; i++) {
                nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'GL', colorCategory: classifyPosition(deptName, 'GL') } });
            }
        }
        dept.tl.forEach(tl => {
            nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'TL', subtitle: tl, colorCategory: classifyPosition(deptName, 'TL', undefined, tl) } });
        });
        dept.tm.forEach(tmGroup => {
            tmGroup.forEach(tm => {
                nodes.push({
                    id: getNextId(),
                    type: 'position',
                    position: { x: 0, y: 0 },
                    data: {
                        department: deptName,
                        level: 'TM',
                        subtitle: tm,  // subtitle 추가!
                        colorCategory: classifyPosition(deptName, 'TM', undefined, tm)
                    }
                });
            });
        });
    });
    
    return nodes;
};

// =================================================================
// END: Node Generation Logic
// =================================================================

const SummaryTable = ({ title, data, laborType }: { title: string; data: Summary; laborType: string }) => {
  const levels = ["VSM", "A.VSM", "GL", "TL", "TM"];
  
  // Plant와 Supporting Team 부서 분류 (실제 팀 구조 반영)
  const plantDepts = ["Line", "Admin", "Small Tooling", "Sub Material", "Raw Material", "ACC Market", "Bottom Market", "Carton", "Inner Box", "Paper", "Shipping", "Stock Management", "Scan/System/Report"];
  const supportingDepts = ["Quality", "CE", "TPM", "CQM", "Lean", "Security", "RMCC"];

  // 헤더 표시용 포맷팅 함수
  const formatDeptName = (dept: string) => {
    if (dept === "Scan/System/Report") return "Scan/System\n/Report";
    return dept;
  };
  
  const getGrandTotal = (column: string | 'SUM') => {
    return levels.reduce((total, level) => {
        if (column === 'SUM') return total + (data[level]?.SUM || 0);
        return total + (data[level]?.[column] || 0);
    }, 0);
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <table className="min-w-full border-collapse text-xs">
        <thead className="bg-slate-600 text-white">
          <tr>
            <th className="border border-gray-400 p-1 w-20" rowSpan={3}>Labor Type</th>
            <th className="border border-gray-400 p-1 w-14" rowSpan={3}>Level</th>
            <th className="border border-gray-400 p-1 w-12" rowSpan={3}>SUM</th>
            <th className="border border-gray-400 p-1" colSpan={plantDepts.length}>Production</th>
            <th className="border border-gray-400 p-1" colSpan={supportingDepts.length}>Supporting Team</th>
          </tr>
          <tr>
            {plantDepts.map(dept => <th key={dept} className="border border-gray-400 p-1 w-16 min-w-16 max-w-16 whitespace-pre-line" rowSpan={2}>{formatDeptName(dept)}</th>)}
            {supportingDepts.map(dept => <th key={dept} className="border border-gray-400 p-1 w-16 min-w-16 max-w-16 whitespace-pre-line" rowSpan={2}>{formatDeptName(dept)}</th>)}
          </tr>
          <tr>
            {/* 모든 컬럼이 rowSpan=2로 처리됨 */}
          </tr>
        </thead>
        <tbody>
          {levels.map((level, index) => {
            // Market 관련 팀들
            const marketTeams = ["Sub Material", "Raw Material", "ACC Market", "Bottom Market"];
            // FG WH 관련 팀들
            const fgwhTeams = ["Carton", "Inner Box", "Paper", "Shipping", "Stock Management", "Scan/System/Report"];
            // 나머지 Plant 부서들
            const otherPlantDepts = plantDepts.filter(d => !marketTeams.includes(d) && !fgwhTeams.includes(d));

            return (
              <tr key={level} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                {index === 0 && <td className="border border-gray-400 p-1 text-center font-bold w-20" rowSpan={levels.length}>{laborType}</td>}
                <td className="border border-gray-400 p-1 text-center w-14">{level}</td>
                <td className="border border-gray-400 p-1 text-center font-bold w-12">{data[level]?.SUM > 0 ? data[level].SUM : ""}</td>

                {/* Other Plant departments (Line, Admin, Small Tooling) */}
                {otherPlantDepts.map(dept => (
                  <td key={dept} className="border border-gray-400 p-1 text-center w-16 min-w-16 max-w-16">
                    {(data[level]?.[dept] > 0) ? data[level][dept] : ""}
                  </td>
                ))}

                {/* Market teams - different merging for GL, TL, TM */}
                {level === "GL" ? (
                  // GL: merge all 4 Market teams into 1 cell
                  <td colSpan={4} className="border border-gray-400 p-1 text-center">
                    {(() => {
                      const marketGLSum = marketTeams.reduce((sum, dept) => sum + (data[level]?.[dept] || 0), 0);
                      return marketGLSum > 0 ? marketGLSum : "";
                    })()}
                  </td>
                ) : level === "TL" ? (
                  <>
                    {/* TL: merge first 3 (Upper Market) + separate Bottom Market */}
                    <td colSpan={3} className="border border-gray-400 p-1 text-center">
                      {(() => {
                        const upperMarketSum = ["Sub Material", "Raw Material", "ACC Market"].reduce(
                          (sum, dept) => sum + (data[level]?.[dept] || 0), 0
                        );
                        return upperMarketSum > 0 ? upperMarketSum : "";
                      })()}
                    </td>
                    <td className="border border-gray-400 p-1 text-center w-16 min-w-16 max-w-16">
                      {(data[level]?.["Bottom Market"] > 0) ? data[level]["Bottom Market"] : ""}
                    </td>
                  </>
                ) : (
                  // TM: show all 4 individually
                  marketTeams.map(dept => (
                    <td key={dept} className="border border-gray-400 p-1 text-center w-16 min-w-16 max-w-16">
                      {(data[level]?.[dept] > 0) ? data[level][dept] : ""}
                    </td>
                  ))
                )}

                {/* FG WH teams - different merging for GL, TL, TM */}
                {level === "GL" ? (
                  // GL: merge all 6 FG WH teams into 1 cell
                  <td colSpan={6} className="border border-gray-400 p-1 text-center">
                    {(() => {
                      const fgwhGLSum = fgwhTeams.reduce((sum, dept) => sum + (data[level]?.[dept] || 0), 0);
                      return fgwhGLSum > 0 ? fgwhGLSum : "";
                    })()}
                  </td>
                ) : level === "TL" ? (
                  <>
                    {/* TL: merge first 3 (P&L Market) + merge last 3 (FG WH) */}
                    <td colSpan={3} className="border border-gray-400 p-1 text-center">
                      {(() => {
                        const pnlMarketSum = ["Carton", "Inner Box", "Paper"].reduce(
                          (sum, dept) => sum + (data[level]?.[dept] || 0), 0
                        );
                        return pnlMarketSum > 0 ? pnlMarketSum : "";
                      })()}
                    </td>
                    <td colSpan={3} className="border border-gray-400 p-1 text-center">
                      {(() => {
                        const fgwhSum = ["Shipping", "Stock Management", "Scan/System/Report"].reduce(
                          (sum, dept) => sum + (data[level]?.[dept] || 0), 0
                        );
                        return fgwhSum > 0 ? fgwhSum : "";
                      })()}
                    </td>
                  </>
                ) : (
                  // TM: show all 6 individually
                  fgwhTeams.map(dept => (
                    <td key={dept} className="border border-gray-400 p-1 text-center w-16 min-w-16 max-w-16">
                      {(data[level]?.[dept] > 0) ? data[level][dept] : ""}
                    </td>
                  ))
                )}

                {/* Supporting departments - no merging */}
                {supportingDepts.map(dept => (
                  <td key={dept} className="border border-gray-400 p-1 text-center w-16 min-w-16 max-w-16">
                    {(data[level]?.[dept] > 0) ? data[level][dept] : ""}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-300 font-bold">
            <tr>
                <td className="border border-gray-400 p-1 text-center" colSpan={2}>TOTAL</td>
                <td className="border border-gray-400 p-1 text-center w-12">{getGrandTotal('SUM')}</td>
                {plantDepts.map(dept => (
                    <td key={dept} className="border border-gray-400 p-1 text-center w-16 min-w-16 max-w-16">
                        {getGrandTotal(dept) || ""}
                    </td>
                ))}
                {supportingDepts.map(dept => (
                    <td key={dept} className="border border-gray-400 p-1 text-center w-16 min-w-16 max-w-16">
                        {getGrandTotal(dept) || ""}
                    </td>
                ))}
            </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default function Page4Indirect() {
  const { config, models, lineModelSelections } = useOrgChart();

  const { indirectSummary, overheadSummary } = useMemo(() => {
    const effectiveSelections = (lineModelSelections?.length ?? 0) > 0 
        ? lineModelSelections 
        : Array(config.lineCount).fill(0);

    const nodes = [
        ...generateNodesForPage1(config, models, effectiveSelections),
        ...generateNodesForPage2(config),
        ...generateNodesForPage3(config)
    ];

    const indirectSummary: Summary = {};
    const overheadSummary: Summary = {};
    const levels = ["VSM", "A.VSM", "GL", "TL", "TM", "DEPT"];

    // Plant와 Supporting Team 부서 분류 (실제 팀 구조 반영)
    const plantDepts = ["Line", "Admin", "Small Tooling", "Sub Material", "Raw Material", "ACC Market", "Bottom Market", "Carton", "Inner Box", "Paper", "Shipping", "Stock Management", "Scan/System/Report"];
    const supportingDepts = ["Quality", "CE", "TPM", "CQM", "Lean", "Security", "RMCC"];
    const allDepts = [...plantDepts, ...supportingDepts];

    // 초기화
    levels.forEach(level => {
        indirectSummary[level] = { SUM: 0 };
        overheadSummary[level] = { SUM: 0 };
        allDepts.forEach(dept => {
            indirectSummary[level][dept] = 0;
            overheadSummary[level][dept] = 0;
        });
    });

    // 디버깅: 각 페이지에서 생성된 노드 수 출력
    const page1Nodes = generateNodesForPage1(config, models, effectiveSelections);
    const page2Nodes = generateNodesForPage2(config);
    const page3Nodes = generateNodesForPage3(config);

    console.log('=== Page4-Indirect Debug Info ===');
    console.log(`Total nodes: ${nodes.length}`);
    console.log(`Page1 nodes: ${page1Nodes.length}`);
    console.log(`Page2 nodes: ${page2Nodes.length}`);
    console.log(`Page3 nodes: ${page3Nodes.length}`);

    // Market 부서 노드 확인
    const marketNodes = nodes.filter(n => n.data.department === 'Market');
    console.log(`Market nodes: ${marketNodes.length}`);
    marketNodes.slice(0, 5).forEach(n => {
        console.log(`  - level: ${n.data.level}, subtitle: ${n.data.subtitle}, colorCategory: ${n.data.colorCategory}`);
    });

    // FG WH 부서 노드 확인
    const fgwhNodes = nodes.filter(n => n.data.department && n.data.department.includes('FG WH'));
    console.log(`FG WH nodes: ${fgwhNodes.length}`);
    fgwhNodes.slice(0, 5).forEach(n => {
        console.log(`  - dept: ${n.data.department}, level: ${n.data.level}, subtitle: ${n.data.subtitle}, colorCategory: ${n.data.colorCategory}`);
    });

    // subtitle을 기준으로 세부 부서 분류하는 함수
    const getDetailedDept = (department: string, subtitle?: string, level?: string): string => {
        // Market 부서
        if (department === "Market") {
            // Market GL - Sub Material 컬럼에 저장 (merged cell will sum all 4 columns)
            if (level === "GL") return "Sub Material";

            // Market TL은 subtitle 기준
            if (level === "TL" && subtitle) {
                if (subtitle.includes("Upper")) return "Sub Material";  // Upper Market TL → Sub Material 컬럼에 저장 (merged cell will sum first 3)
                if (subtitle.includes("Bottom")) return "Bottom Market";  // Bottom Market TL은 Bottom Market으로
            }

            // Market TM은 subtitle을 보고 세부 부서 결정
            if (subtitle) {
                if (subtitle.includes("Sub Material")) return "Sub Material";
                if (subtitle.includes("Raw Material")) return "Raw Material";
                if (subtitle.includes("ACC Market")) return "ACC Market";
                if (subtitle.includes("Outsole") || subtitle.includes("Midsole") || subtitle.includes("Bottom ACC")) return "Bottom Market";
            }

            return "Sub Material";  // 기본값
        }

        // FG WH/P&L Market 부서
        if (department.includes("FG WH")) {
            // GL - Carton 컬럼에 저장 (merged cell will sum all 6 columns)
            if (level === "GL") return "Carton";

            // TL은 subtitle 기준
            if (level === "TL" && subtitle) {
                if (subtitle.includes("P&L")) return "Carton";  // P&L Market TL → Carton 컬럼에 저장 (merged cell will sum first 3)
                if (subtitle.includes("FG WH")) return "Shipping";  // FG WH TL → Shipping 컬럼에 저장 (merged cell will sum last 3)
            }

            // TM은 subtitle로 세분화된 팀으로 구분
            if (subtitle) {
                // Carton team: Stencil + CO Label
                if (subtitle.includes("Stencil") || subtitle.includes("CO Label")) return "Carton";
                // Inner Box team: Box
                if (subtitle.includes("Box")) return "Inner Box";
                // Paper team
                if (subtitle.includes("Paper")) return "Paper";
                // Shipping team
                if (subtitle.includes("Shipping")) return "Shipping";
                // Stock Management team: Incoming + Setting
                if (subtitle.includes("Incoming") || subtitle.includes("Setting")) return "Stock Management";
                // Scan/System/Report team
                if (subtitle.includes("Scan") || subtitle.includes("System") || subtitle.includes("Report")) return "Scan/System/Report";
            }

            return "Scan/System/Report";  // 기본값
        }

        // Plant Production 정규화
        if (department.includes("Plant Production")) return "Plant Production";

        // no-sew, hf welding, separated를 Line으로 통합
        if (department === "No-sew" || department === "HF Welding" || department === "Separated") {
            return "Line";
        }

        return department;
    };

    // 노드 집계 - 중앙화된 분류 엔진을 사용하여 올바른 분류 확인
    nodes.forEach(node => {
        const { department, level, colorCategory, subtitle } = node.data;
        if (!department || !level) return;

        // 중앙화된 분류 엔진으로 실제 분류 확인 (subtitle 포함)
        const actualClassification = node.data.colorCategory || classifyPosition(department, level, undefined, subtitle);

        // 이 페이지는 indirect와 OH만 포함해야 함 (direct는 제외)
        if (actualClassification === 'direct') {
            return; // direct 분류는 이 페이지에서 제외
        }

        // subtitle과 level을 기준으로 세부 부서 결정
        const targetDept = getDetailedDept(department, subtitle, level);

        // 실제 분류에 따라 올바른 요약에 추가
        const summary = actualClassification === 'OH' ? overheadSummary : indirectSummary;

        if (summary[level] && allDepts.includes(targetDept)) {
            summary[level][targetDept] = (summary[level][targetDept] || 0) + 1;
            summary[level].SUM += 1;
        } else if (!allDepts.includes(targetDept)) {
            console.warn(`Department not in list: ${targetDept}, level: ${level}, subtitle: ${subtitle}, classification: ${actualClassification}`);
        }
    });

    console.log('Indirect Summary:', JSON.stringify(indirectSummary, null, 2));
    console.log('Overhead Summary:', JSON.stringify(overheadSummary, null, 2));

    return { indirectSummary, overheadSummary };
  }, [config, models, lineModelSelections]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Aggregation Page-indirect+OH</h1>
      <SummaryTable title="# LM Plant Indirect Summary" data={indirectSummary} laborType="Indirect" />
      <SummaryTable title="# LM Plant Over Head Summary" data={overheadSummary} laborType="Overhead" />
    </div>
  );
} 