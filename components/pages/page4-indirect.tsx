"use client";
import React, { useState, useMemo } from 'react';
import { useOrgChart } from '@/context/OrgChartContext';
import { Node } from 'reactflow';

// Department, Level, Category를 포함하는 노드 데이터 타입 정의
type NodeData = {
  colorCategory: 'OH' | 'indirect' | 'direct' | 'blank';
  department: string;
  level: 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT';
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
import { getProcessGroups } from '@/components/common/ReactFlowPage1';
import { classifyPosition } from '@/components/common/ClassificationEngine';
import { getDepartmentsForPage } from '@/components/common/DepartmentData';

// Use the imported getProcessGroups function with 'calculation' context
function getProcessGroups_p1(config: any, selectedModel?: any, lineIndex?: number) {
  // Use the 'calculation' context to ensure stockfit and assembly remain separate for calculations
  return getProcessGroups(config, selectedModel, lineIndex, 'calculation');
}

// --- Logic from ReactFlowPage1 (DYNAMIC) ---
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

    // A.VSM 노드
    nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'A.VSM', colorCategory: classifyPosition('Line', 'A.VSM' as 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT') } });
    
    // 메인 공정 노드들
    const { mainProcesses } = getProcessGroups_p1(config, selectedModel, lineIndex);
    mainProcesses.forEach(processGroup => {
      if (processGroup.showGL !== false) {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'GL', colorCategory: classifyPosition('Line', 'GL') } });
      }
      processGroup.tlGroup.forEach(() => {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'TL', colorCategory: classifyPosition('Line', 'TL') } });
      });
      processGroup.tmGroup.forEach(() => {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Line', level: 'TM', colorCategory: classifyPosition('Line', 'TM') } });
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

  // 분리된 공정 노드들 생성
  if (linesWithNosew.length > 0) {
    const shiftCols = config.shiftsCount || 1;
    
    // 빈 LM 노드
    nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Separated', level: 'A.VSM', colorCategory: classifyPosition('Separated', 'A.VSM' as 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT') } });
    
    // GL 노드들
    for (let i = 0; i < shiftCols; i++) {
      nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'No-sew', level: 'GL', colorCategory: classifyPosition('No-sew', 'GL') } });
    }
    
    // TL, TM 노드들 (각 라인별로)
    linesWithNosew.forEach(() => {
      for (let col = 0; col < shiftCols; col++) {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'No-sew', level: 'TL', colorCategory: classifyPosition('No-sew', 'TL') } });
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'No-sew', level: 'TM', colorCategory: classifyPosition('No-sew', 'TM') } });
      }
    });
  }

  if (linesWithHfWelding.length > 0) {
    const hfCols = config.shiftsCount || 1;
    
    // 빈 LM 노드
    nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'Separated', level: 'A.VSM', colorCategory: classifyPosition('Separated', 'A.VSM' as 'VSM' | 'A.VSM' | 'GL' | 'TL' | 'TM' | 'DEPT') } });
    
    // TL 노드들 (각 라인별로)
    linesWithHfWelding.forEach(() => {
      for (let col = 0; col < hfCols; col++) {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'HF Welding', level: 'TL', colorCategory: classifyPosition('HF Welding', 'TL') } });
      }
    });
    
    // TM 노드들 (2개 라인당 1개)
    const hfTmGroups = Math.ceil(linesWithHfWelding.length / 2);
    for (let col = 0; col < hfCols; col++) {
      for (let g = 0; g < hfTmGroups; g++) {
        nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: 'HF Welding', level: 'TM', colorCategory: classifyPosition('HF Welding', 'TM') } });
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
    
    // Use centralized classification engine for all positions
    const baseDepartments = getDepartmentsForPage('page4-indirect');
    const departments = [
        ...baseDepartments,
        {
            title: "ACC Market",
            hasGL: false,
            tl: [],
            tm: [Array.from({ length: Math.ceil(config.lineCount / 2) }, (_, i) => `L${i*2+1}-${i*2+2} ACC`)],
        },
        {
            title: "P&L Market",
            hasGL: true,
            tl: ["P&L Market"],
            tm: [
                ["Stencil1", "Stencil2", ...Array.from({ length: Math.ceil(config.lineCount / 2) }, (_, i) => `L${i*2+1}-${i*2+2} Box`)],
                [...Array.from({ length: Math.ceil(config.lineCount / 2) }, (_, i) => `L${i*2+1}-${i*2+2} Paper`)],
            ],
        },
        {
            title: "Bottom Market",
            hasGL: false,
            tl: ["Bottom Market Incoming"],
            tm: [
                ["Outsole", "Outsole", "Midsole", "Midsole"],
                ["Bottom ACC"],
            ],
        },
        {
            title: "Plant Production",
            hasGL: false,
            tl: [],
            tm: [
                Array.from({ length: Math.ceil(config.lineCount / 2) }, (_, i) => `L${i*2+1}-${i*2+2} Input`),
                Array.from({ length: Math.ceil(config.lineCount / 2) }, (_, i) => `L${i*2+1}-${i*2+2} Output`)
            ],
        },
        {
            title: "FG WH",
            hasGL: true,
            tl: ["FG WH"],
            tm: [
                Array.from({ length: config.lineCount <= 8 ? [0, 1, 2, 3, 3, 4, 5, 6, 6][config.lineCount] : Math.ceil(config.lineCount * 0.75) }, (_, idx) => `Shipping TM ${idx + 1}`),
                Array.from({ length: config.lineCount }, (_, i) => `Incoming & Setting Line ${i + 1}`),
                ["Incoming Scan"],
            ],
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
            nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'TL', colorCategory: classifyPosition(deptName, 'TL', undefined, tl) } });
        });
        dept.tm.forEach(tmGroup => {
            tmGroup.forEach(tm => {
                nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'TM', colorCategory: classifyPosition(deptName, 'TM', undefined, tm) } });
            });
        });
    });

    return nodes;
};

// --- Logic from ReactFlowPage3 (Original DYNAMIC) ---
const generateNodesForPage3 = (config: any): CustomNode[] => {
    const nodes: CustomNode[] = [];
    let idCounter = 0;
    const getNextId = () => `p3-node-${idCounter++}`;

    const departments = [
        {
            title: "Quality",
            hasGL: true,
            tl: ["Quality"],
            tm: [
                ...Array.from({ length: config.lineCount }, (_, i) => [`Line ${i + 1} QC`, `Line ${i + 1} QC`]),
                ["HFPA", "HFPA", "HFPA"],
            ],
        },
        {
            title: "CE",
            hasGL: false,
            tl: ["CE"],
            tm: [["Mixing"]],
        },
        {
            title: "TPM",
            hasGL: true,
            tl: ["Stitching", "Cutting & Stockfit·Assembly", "CMMS & Electricity"],
            tm: [
                ["Stitching", "Stitching"],
                ["Cutting & Stockfit·Assembly", "Cutting & Stockfit·Assembly"],
                ["Electricity", "CMMS"]
            ],
        },
        {
            title: "CQM",
            hasGL: false,
            tl: ["NPI"],
            tm: [],
        },
        {
            title: "Lean",
            hasGL: false,
            tl: ["Lean"],
            tm: [],
        },
        {
            title: "Security",
            hasGL: false,
            tl: [],
            tm: [Array.from({ length: config.gateCount }, (_, i) => `Gate ${i + 1}`)],
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
        
        if (dept.hasGL) {
            nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'GL', colorCategory: classifyPosition(deptName, 'GL') } });
        }
        dept.tl.forEach(tl => {
            nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'TL', colorCategory: classifyPosition(deptName, 'TL', undefined, tl) } });
        });
        dept.tm.forEach(tmGroup => {
            tmGroup.forEach(tm => {
                nodes.push({ id: getNextId(), type: 'position', position: { x: 0, y: 0 }, data: { department: deptName, level: 'TM', colorCategory: classifyPosition(deptName, 'TM', undefined, tm) } });
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
  
  // Plant와 Supporting Team 부서 분류
  const plantDepts = ["Line", "Plant", "Admin", "Small Tooling", "Raw Material", "Sub Material", "ACC Market", "P&L Market", "Bottom Market", "Plant Production", "FG WH"];
  const supportingDepts = ["Quality", "CE", "TPM", "CQM", "Lean", "Security", "RMCC"];
  
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
            <th className="border p-1" rowSpan={3}>Labor Type</th>
            <th className="border p-1" rowSpan={3}>Level</th>
            <th className="border p-1" rowSpan={3}>SUM</th>
            <th className="border p-1" colSpan={plantDepts.length}>Plant</th>
            <th className="border p-1" colSpan={supportingDepts.length}>Supporting Team</th>
          </tr>
          <tr>
            <th className="border p-1" rowSpan={2}>Line</th>
            <th className="border p-1" rowSpan={2}>Plant</th>
            {plantDepts.slice(2).map(dept => <th key={dept} className="border p-1" rowSpan={2}>{dept}</th>)}
            {supportingDepts.map(dept => <th key={dept} className="border p-1" rowSpan={2}>{dept}</th>)}
          </tr>
          <tr>
            {/* Line과 Plant는 이미 rowSpan=2로 처리됨 */}
          </tr>
        </thead>
        <tbody>
          {levels.map((level, index) => (
            <tr key={level} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
              {index === 0 && <td className="border p-1 text-center font-bold" rowSpan={levels.length}>{laborType}</td>}
              <td className="border p-1">{level}</td>
              <td className="border p-1 text-center font-bold">{data[level]?.SUM > 0 ? data[level].SUM : ""}</td>
              {plantDepts.map(dept => (
                <td key={dept} className="border p-1 text-center">
                  {(data[level]?.[dept] > 0) ? data[level][dept] : ""}
                </td>
              ))}
              {supportingDepts.map(dept => (
                <td key={dept} className="border p-1 text-center">
                  {(data[level]?.[dept] > 0) ? data[level][dept] : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-200 font-bold">
            <tr>
                <td className="border p-1 text-center" colSpan={2}>TOTAL</td>
                <td className="border p-1 text-center">{getGrandTotal('SUM')}</td>
                {[...plantDepts, ...supportingDepts].map(dept => (
                    <td key={dept} className="border p-1 text-center">
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
    
    // Plant와 Supporting Team 부서 분류
    const plantDepts = ["Line", "Plant", "Admin", "Small Tooling", "Raw Material", "Sub Material", "ACC Market", "P&L Market", "Bottom Market", "Plant Production", "FG WH"];
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

    // 노드 집계 - 중앙화된 분류 엔진을 사용하여 올바른 분류 확인
    nodes.forEach(node => {
        const { department, level, colorCategory } = node.data;
        if (!department || !level) return;
        
        // 중앙화된 분류 엔진으로 실제 분류 확인
        const actualClassification = classifyPosition(department, level);
        
        // 이 페이지는 indirect와 OH만 포함해야 함 (direct는 제외)
        if (actualClassification === 'direct') {
            return; // direct 분류는 이 페이지에서 제외
        }
        
        // no-sew, hf welding, separated를 Line으로 통합
        let targetDept = department;
        if (department === "No-sew" || department === "HF Welding" || department === "Separated") {
            targetDept = "Line";
        }
        
        // 실제 분류에 따라 올바른 요약에 추가
        const summary = actualClassification === 'OH' ? overheadSummary : indirectSummary;
        
        if (summary[level] && allDepts.includes(targetDept)) {
            summary[level][targetDept] = (summary[level][targetDept] || 0) + 1;
            summary[level].SUM += 1;
        }
    });
    
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