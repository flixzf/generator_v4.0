import React, { useCallback } from 'react';
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
import { nodeTypes } from './CustomPositionNode';

// getProcessGroups 함수 - 모델 데이터 기반 공정 분리 기능
export function getProcessGroups(config: any, selectedModel?: any, lineIndex?: number, context: 'display' | 'calculation' = 'display') {
  if (!selectedModel) {
    // 모델이 없을 때 기본 구조
    if (context === 'display') {
      // 디스플레이 컨텍스트에서는 Stockfit-Assembly를 병합
      return {
        mainProcesses: [
          {
            gl: { subtitle: "Stitching", count: 1 },
            tlGroup: [{ subtitle: "No Process" }],
            tmGroup: [{ subtitle: "No Data" }],
            showGL: true
          },
          {
            gl: { subtitle: "Stockfit-Assembly", count: 1 },
            tlGroup: [
              { subtitle: "Stockfit" },
              { subtitle: "Input" }, 
              { subtitle: "Cementing" }, 
              { subtitle: "Finishing" }
            ],
            tmGroup: [
              { subtitle: "MH → Assembly (Stockfit)" },
              { subtitle: "MH → Assembly" },
              { subtitle: "MH → FG WH" },
              { subtitle: "MH → Last" },
            ],
            showGL: true
          },
        ],
        separatedProcesses: []
      };
    } else {
      // 계산 컨텍스트에서는 기존 구조 유지
      return {
        mainProcesses: [
          {
            gl: { subtitle: "Stitching", count: 1 },
            tlGroup: [{ subtitle: "No Process" }],
            tmGroup: [{ subtitle: "No Data" }],
            showGL: true
          },
          {
            gl: { subtitle: "Stockfit", count: 1 },
            tlGroup: [{ subtitle: "Stockfit" }],
            tmGroup: [{ subtitle: "MH → Assembly" }],
            showGL: true
          },
          {
            gl: { subtitle: "Assembly", count: 1 },
            tlGroup: [{ subtitle: "Input" }, { subtitle: "Cementing" }, { subtitle: "Finishing" }],
            tmGroup: [
              { subtitle: "MH → Assembly" },
              { subtitle: "MH → FG WH" },
              { subtitle: "MH → Last" },
            ],
            showGL: true
          },
        ],
        separatedProcesses: []
      };
    }
  }

  const allProcesses = selectedModel.processes || [];
  const mainProcesses = [];

  // --- 새로운 로직 시작 ---

  // 조건: 'computer stitching', 'pre-folding', 'pre-stitching'이 모두 존재하는지 (AND 조건)
  const requiredForSplit = ['computer stitching', 'pre-folding', 'pre-stitching'];
  const hasCuttingPrefitGroup = requiredForSplit.every(requiredName =>
    allProcesses.some((p: any) => p?.name && p.name.toLowerCase() === requiredName.toLowerCase())
  );

  if (hasCuttingPrefitGroup) {
    // --- 그룹 분리 로직 (Jordan 모델 등) ---

    // 1. GL (Cutting-Prefit) 그룹
    const cuttingPrefitProcessNames = ['cutting', 'pre-folding', 'computer stitching'];
    const cuttingPrefitProcesses = allProcesses.filter((p: any) =>
      p?.name && cuttingPrefitProcessNames.includes(p.name.toLowerCase())
    );

    if (cuttingPrefitProcesses.length > 0) {
      const cuttingPrefitTLGroup = cuttingPrefitProcesses.map((p: any) => ({
        subtitle: p.name,
        manpower: p.manAsy
      }));

      const cuttingPrefitTMGroup = cuttingPrefitProcesses.map((p: any) => ({
        subtitle: p.name === 'Cutting' ? 'Cutting Separation' : p.name,
        manpower: p.manAsy
      }));

      mainProcesses.push({
        gl: { subtitle: "Cutting-Prefit", count: 1 },
        tlGroup: cuttingPrefitTLGroup,
        tmGroup: cuttingPrefitTMGroup,
        processes: cuttingPrefitProcesses,
        showGL: true
      });
    }

    // 2. GL (Stitching) 그룹 (분리 후 남은 공정)
    const remainingStitchingProcesses = allProcesses.filter((p: any) => {
      if (!p?.name) return false;
      const nameLower = p.name.toLowerCase();
      return (nameLower.includes('stitching') && !nameLower.includes('computer')) || nameLower.includes('pre-stitching');
    });

    if (remainingStitchingProcesses.length > 0) {
      const stitchingTLGroup: any[] = [];
      const stitchingTMGroup: any[] = [];

      remainingStitchingProcesses.forEach((process: any) => {
        const processNameLower = process.name.toLowerCase();
        if (processNameLower.includes('pre-stitching') || processNameLower.includes('prefit')) {
          stitchingTLGroup.push({ subtitle: process.name, manpower: process.manAsy });
          stitchingTMGroup.push({ subtitle: process.name, manpower: process.manAsy });
        } else if (processNameLower.includes('stitching')) {
          const miniLineCount = config?.miniLineCount || 1;
          for (let i = 1; i <= miniLineCount; i++) {
            const subtitle = miniLineCount > 1 ? `${process.name} ${i}` : process.name;
            stitchingTLGroup.push({ subtitle, manpower: process.manStt });
            stitchingTMGroup.push({ subtitle, manpower: process.manStt });
          }
        }
      });

      mainProcesses.push({
        gl: { subtitle: "Stitching", count: 1 },
        tlGroup: stitchingTLGroup,
        tmGroup: stitchingTMGroup,
        processes: remainingStitchingProcesses,
        showGL: true
      });
    }

  } else {
    // --- 기존의 단일 Stitching 그룹 로직 ---
    const stitchingGroupProcesses = allProcesses.filter((p: any) => {
      if (!p?.name) return false;
      const nameLower = p.name.toLowerCase();
      return nameLower.includes('stitching') || nameLower.includes('cutting') || nameLower.includes('pre-folding');
    });

    if (stitchingGroupProcesses.length > 0) {
      const stitchingTLGroup: any[] = [];
      const stitchingTMGroup: any[] = [];
      const exceptionNames = ['cutting', 'pre-folding', 'computer stitching', 'pre-stitching', 'prefit stitching'];

      const cuttingProcesses = stitchingGroupProcesses.filter((p: any) => p.name.toLowerCase().includes('cutting'));
      const otherExceptionProcesses = stitchingGroupProcesses.filter((p: any) => exceptionNames.some(ex => p.name.toLowerCase().includes(ex) && !p.name.toLowerCase().includes('cutting')));
      const regularStitchingProcesses = stitchingGroupProcesses.filter((p: any) => !exceptionNames.some(ex => p.name.toLowerCase().includes(ex)) && p.name.toLowerCase().includes('stitching'));

      if (cuttingProcesses.length > 0) {
        const totalCuttingManpower = cuttingProcesses.reduce((sum: any, p: any) => sum + (p.manAsy || 0), 0);
        stitchingTLGroup.push({ subtitle: "Cutting", manpower: totalCuttingManpower });
        stitchingTMGroup.push({ subtitle: "Cutting Separation", manpower: totalCuttingManpower });
      }

      otherExceptionProcesses.forEach((p: any) => {
        stitchingTLGroup.push({ subtitle: p.name, manpower: p.manAsy });
        stitchingTMGroup.push({ subtitle: p.name, manpower: p.manAsy });
      });

      regularStitchingProcesses.forEach((p: any) => {
        const miniLineCount = config?.miniLineCount || 1;
        for (let i = 1; i <= miniLineCount; i++) {
          const subtitle = miniLineCount > 1 ? `${p.name} ${i}` : p.name;
          stitchingTLGroup.push({ subtitle, manpower: p.manStt });
          stitchingTMGroup.push({ subtitle, manpower: p.manStt });
        }
      });

      mainProcesses.push({
        gl: { subtitle: "Stitching", count: 1 },
        tlGroup: stitchingTLGroup,
        tmGroup: stitchingTMGroup,
        processes: stitchingGroupProcesses,
        showGL: true
      });
    }
  }

  // --- 공통 로직 (Stockfit, Assembly) ---
  const stockfitProcesses = allProcesses.filter((process: any) =>
    process?.name && process.name.toLowerCase().includes('stockfit')
  );
  
  const assemblyProcesses = allProcesses.filter((process: any) => {
    if (!process?.name) return false;
    const name = process.name.toLowerCase();
    return !name.includes('stitching') &&
      !name.includes('stockfit') &&
      !name.includes('no-sew') &&
      !name.includes('hf welding') &&
      !name.includes('cutting') &&
      !name.includes('pre-folding');
  });

  // Calculate manpower for both process groups
  const stockfitManpower = stockfitProcesses.reduce((sum: number, process: any) =>
    sum + (process.manAsy || 0), 0);
  
  const assemblyGLManpower = assemblyProcesses.reduce((sum: number, process: any) =>
    sum + (process.manAsy || 0), 0);
  
  const totalManpower = stockfitManpower + assemblyGLManpower;

  if (context === 'display') {
    // For display context, merge stockfit and assembly into a single group
    const stockfitTLGroup = stockfitProcesses.flatMap((process: any) => {
      const shifts = [];
      const miniLineCount = process.miniLine || 1;
      for (let i = 1; i <= miniLineCount; i++) {
        const subtitle = miniLineCount > 1 ? `${process.name} ${i} (Stockfit)` : `${process.name} (Stockfit)`;
        shifts.push({ subtitle, manpower: process.manStt });
      }
      return shifts;
    });

    const assemblyTLGroup = [
      { subtitle: "Input (Assembly)" },
      { subtitle: "Cementing (Assembly)" },
      { subtitle: "Finishing (Assembly)" }
    ];

    // Merge TL groups
    const mergedTLGroup = [...stockfitTLGroup, ...assemblyTLGroup];

    // Merge TM groups
    const mergedTMGroup = [
      { subtitle: "Stockfit" },
      { subtitle: "Assembly" },
      { subtitle: "Assembly Last" },
    ];

    // Create merged GL node
    mainProcesses.push({
      gl: {
        subtitle: totalManpower > 0 ? `Stockfit-Assembly [${totalManpower}]` : "Stockfit-Assembly",
        count: 1
      },
      tlGroup: mergedTLGroup,
      tmGroup: mergedTMGroup,
      processes: [...stockfitProcesses, ...assemblyProcesses],
      showGL: true,
      sourceProcesses: {
        stockfit: stockfitProcesses,
        assembly: assemblyProcesses
      }
    });
  } else {
    // For calculation context, keep stockfit and assembly separate
    if (stockfitProcesses.length > 0) {
      const stockfitTLGroup = stockfitProcesses.flatMap((process: any) => {
        const shifts = [];
        const miniLineCount = process.miniLine || 1;
        for (let i = 1; i <= miniLineCount; i++) {
          const subtitle = miniLineCount > 1 ? `${process.name} ${i}` : process.name;
          shifts.push({ subtitle, manpower: process.manStt });
        }
        return shifts;
      });
      mainProcesses.push({
        gl: { subtitle: stockfitManpower > 0 ? `Stockfit [${stockfitManpower}]` : "Stockfit", count: 1 },
        tlGroup: stockfitTLGroup,
        tmGroup: [{ subtitle: "Stockfit" }],
        processes: stockfitProcesses,
        showGL: true
      });
    }

    const assemblyTLGroup = [
      { subtitle: "Input" },
      { subtitle: "Cementing" },
      { subtitle: "Finishing" }
    ];

    mainProcesses.push({
      gl: {
        subtitle: assemblyGLManpower > 0 ? `Assembly [${assemblyGLManpower}]` : "Assembly",
        count: 1
      },
      tlGroup: assemblyTLGroup,
      tmGroup: [
        { subtitle: "Assembly" },
        { subtitle: "Assembly Last" },
      ],
      processes: assemblyProcesses,
      showGL: true
    });
  }

  // We no longer need to apply the transformation since we're handling it directly
  const transformedProcesses = mainProcesses;

  return {
    mainProcesses: transformedProcesses,
    separatedProcesses: getSeparatedProcesses(selectedModel, config)
  };
}

// No-sew와 HF Welding을 위한 분리된 공정 그룹
function getSeparatedProcesses(selectedModel?: any, config?: any) {
  if (!selectedModel || !config) return [];

  const separatedProcessNames = ['cutting no-sew', 'hf welding', 'no-sew'];
  const separatedProcesses = selectedModel.processes.filter((process: any) =>
    process?.name && separatedProcessNames.some(name =>
      process.name.toLowerCase().includes(name.toLowerCase()) ||
      name.toLowerCase().includes(process.name.toLowerCase())
    )
  );

  if (separatedProcesses.length === 0) return [];

  // 시프트 수에 따라 no-sew A, B 구분
  const tlGroup: Array<{ subtitle: string; manpower?: number; shiftIndex?: number }> = [];
  const tmGroup: Array<{ subtitle: string; manpower?: number }> = [];

  separatedProcesses.forEach((process: any) => {
    const processName = process.name;

    // no-sew 공정인 경우 시프트 수에 따라 A, B 구분
    if (processName.toLowerCase().includes('no-sew')) {
      for (let i = 0; i < config.shiftsCount; i++) {
        const suffix = i === 0 ? 'A' : 'B';
        tlGroup.push({
          subtitle: `${processName} ${suffix}`,
          manpower: process.manAsy,
          shiftIndex: i
        });
        tmGroup.push({
          subtitle: `${processName} ${suffix} TM`,
          manpower: process.manAsy
        });
      }
    } else {
      // HF Welding 등 다른 공정은 그대로
      tlGroup.push({
        subtitle: processName,
        manpower: process.manAsy
      });
      tmGroup.push({
        subtitle: `${processName} TM`,
        manpower: process.manAsy
      });
    }
  });

  return [{
    gl: { subtitle: "No-sew/HF Welding", count: 1 },
    tlGroup,
    tmGroup,
    processes: separatedProcesses
  }];
}

interface ReactFlowPage1Props {
  lineModelSelections?: number[];
  onInit?: (instance: ReactFlowInstance) => void;
  context?: 'display' | 'calculation';
}

export const ReactFlowPage1: React.FC<ReactFlowPage1Props> = ({
  lineModelSelections = [],
  onInit,
  context = 'display'
}) => {
  const { config, models } = useOrgChart();

  // 라인별 모델 선택이 없으면 기본값으로 모든 라인에 첫 번째 모델 할당
  const effectiveLineModelSelections = lineModelSelections.length > 0
    ? lineModelSelections
    : Array(config.lineCount).fill(0);

  // 노드와 엣지 생성
  const createNodesAndEdges = React.useCallback(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let idCounter = 1;

    const getNextId = () => `node-${idCounter++}`;

    // 레이아웃 설정
    const levelHeight = 120;
    const glSpacing = 150;
    const linePadding = 100; // 라인 간의 추가 간격

    // ===== 1. 각 라인의 너비를 미리 계산 =====
    const lineWidths = Array(config.lineCount).fill(null).map((_, lineIndex) => {
      const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
      const selectedModel = models[modelIndex];
      const { mainProcesses } = getProcessGroups(config, selectedModel, lineIndex, context);
      const numGLs = mainProcesses.length > 0 ? mainProcesses.length : 1;
      return Math.max(300, numGLs * glSpacing) + linePadding;
    });

    // ===== 2. 전체 너비 계산 및 PM 노드 생성 =====
    const totalWidth = lineWidths.reduce((sum: number, width: number) => sum + width, 0);
    const pmId = getNextId();
    const pmX = totalWidth / 2 - 70;
    nodes.push({
      id: pmId,
      type: 'position',
      position: { x: pmX, y: 0 },
      data: { title: 'PM', subtitle: 'Plant Manager', level: 0, colorCategory: 'OH' },
    });

    // ===== 3. 모든 라인 중 최대 TL 개수 계산 (TM 시작 Y 정렬용) =====
    let globalMaxTLCount = 0;
    const linesWithNosew: number[] = [];
    const linesWithHfWelding: number[] = [];

    Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
      const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
      const selectedModel = models[modelIndex];

      if (selectedModel) {
        const { mainProcesses } = getProcessGroups(config, selectedModel, lineIndex, context);
        if (mainProcesses.length > 0) {
          const tlCounts = mainProcesses.map(p => p.tlGroup.length);
          const localMax = Math.max(...tlCounts);
          if (localMax > globalMaxTLCount) globalMaxTLCount = localMax;
        }

        // 분리된 공정 체크
        const processes = selectedModel.processes || [];
        if (processes.some((p: any) => p?.name && p.name.toLowerCase().includes('no-sew'))) {
          linesWithNosew.push(lineIndex);
        }
        if (processes.some((p: any) => p?.name && p.name.toLowerCase().includes('hf welding'))) {
          linesWithHfWelding.push(lineIndex);
        }
      }
    });

    globalMaxTLCount = Math.max(globalMaxTLCount, linesWithNosew.length, linesWithHfWelding.length);

    // ===== 4. LM 노드 생성 (2개 라인당 1명) =====
    const vsmCount = Math.ceil(config.lineCount / 2);
    const vsmIds: string[] = [];

    for (let vsmIndex = 0; vsmIndex < vsmCount; vsmIndex++) {
      const startLineIndex = vsmIndex * 2;
      const endLineIndex = Math.min(startLineIndex + 1, config.lineCount - 1);

      // LM이 관리하는 라인들의 모델 정보 수집
      const managedLines = [];
      for (let lineIdx = startLineIndex; lineIdx <= endLineIndex; lineIdx++) {
        const modelIndex = effectiveLineModelSelections[lineIdx] || 0;
        const selectedModel = models[modelIndex];
        managedLines.push({
          lineIndex: lineIdx,
          model: selectedModel,
          manpower: selectedModel?.processes?.reduce((sum: number, p: any) => sum + (p.manAsy || 0) + (p.manStt || 0), 0) || 0
        });
      }

      const vsmId = getNextId();
      vsmIds.push(vsmId);

      // LM 제목 생성
      const lineRange = startLineIndex === endLineIndex
        ? `Line ${startLineIndex + 1}`
        : `Line ${startLineIndex + 1}-${endLineIndex + 1}`;
      const totalManpower = managedLines.reduce((sum: number, line: any) => sum + line.manpower, 0);
      const vsmSubtitle = `${lineRange} [${totalManpower}명]`;

      // LM 위치 계산 (관리하는 라인들의 중앙)
      const vsmX = managedLines.reduce((sum: number, line: any) => {
        const lineX = lineWidths.slice(0, line.lineIndex).reduce((acc, w) => acc + w, 0);
        return sum + lineX + lineWidths[line.lineIndex] / 2;
      }, 0) / managedLines.length;

      nodes.push({
        id: vsmId,
        type: 'position',
        position: { x: vsmX, y: levelHeight },
        data: { title: 'LM', subtitle: vsmSubtitle, level: 1, colorCategory: 'OH' },
      });

      edges.push({
        id: `edge-${pmId}-${vsmId}`,
        source: pmId,
        target: vsmId,
        type: 'smoothstep',
      });
    }

    // ===== 5. 라인별 GL/TL/TM 노드 생성 =====
    let cumulativeX = 0;
    Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
      const lineX = cumulativeX;

      const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
      const selectedModel = models[modelIndex];
      const { mainProcesses } = getProcessGroups(config, selectedModel, lineIndex, context);

      const glStartX = lineX + (linePadding / 2);
      const glY = levelHeight * 2;

      // 해당 라인을 관리하는 LM 찾기
      const vsmIndex = Math.floor(lineIndex / 2);
      const managingVsmId = vsmIds[vsmIndex];

      const tmStartY = glY + levelHeight + (globalMaxTLCount * 80) + 40;

      mainProcesses.forEach((processGroup, processIndex) => {
        let glId = '';
        const glX = glStartX + processIndex * glSpacing;

        if (processGroup.showGL !== false) {
          glId = getNextId();
          
          // 노드 생성 - 병합된 Stockfit-Assembly GL 노드 처리
          const isStockfitAssembly = processGroup.gl.subtitle.includes('Stockfit-Assembly');
          
          nodes.push({
            id: glId,
            type: 'position',
            position: { x: glX, y: glY },
            data: {
              title: 'GL',
              subtitle: processGroup.gl.subtitle,
              level: 2,
              colorCategory: 'indirect',
              // 병합된 노드에 대한 추가 정보
              isMerged: isStockfitAssembly,
              sourceProcesses: isStockfitAssembly && 'sourceProcesses' in processGroup ? processGroup.sourceProcesses : undefined
            },
          });
          
          edges.push({
            id: `edge-${managingVsmId}-${glId}`,
            source: managingVsmId,
            target: glId,
            type: 'smoothstep',
          });
        }

        const tlStartY = glY + levelHeight;
        let lastTlId = '';
        processGroup.tlGroup.forEach((tl: any, tlIndex: number) => {
          const tlId = getNextId();
          const tlX = glX;
          const tlY = tlStartY + (tlIndex * 80);
          
          // 병합된 Stockfit-Assembly 노드의 TL 처리
          const isStockfitAssemblyTL = tl.subtitle && 
            (tl.subtitle.includes('(Stockfit)') || tl.subtitle.includes('(Assembly)'));

          nodes.push({
            id: tlId,
            type: 'position',
            position: { x: tlX, y: tlY },
            data: {
              title: 'TL',
              subtitle: tl.manpower ? `${tl.subtitle} [${tl.manpower}명]` : tl.subtitle,
              level: 3,
              colorCategory: 'indirect',
              // 병합된 노드에 대한 추가 정보
              isMerged: isStockfitAssemblyTL,
              processOrigin: isStockfitAssemblyTL ? 
                (tl.subtitle.includes('(Stockfit)') ? 'stockfit' : 'assembly') : undefined
            },
          });

          if (tlIndex === 0) {
            const sourceId = (processGroup.showGL !== false && glId) ? glId : managingVsmId;
            edges.push({
              id: `edge-${sourceId}-${tlId}`,
              source: sourceId,
              target: tlId,
              type: 'smoothstep',
            });
          } else {
            edges.push({
              id: `edge-${lastTlId}-${tlId}`,
              source: lastTlId,
              target: tlId,
              type: 'smoothstep',
            });
          }
          lastTlId = tlId;
        });

        if (processGroup.tmGroup && processGroup.tmGroup.length > 0) {
          let lastTmId = '';
          processGroup.tmGroup.forEach((tm: any, tmIndex: number) => {
            const tmId = getNextId();
            const tmX = glX;
            const tmY = tmStartY + (tmIndex * 80);
            
            // 병합된 Stockfit-Assembly 노드의 TM 처리
            const isStockfitAssemblyTM = tm.subtitle && 
              (tm.subtitle.includes('(Stockfit)') || tm.subtitle.includes('(Assembly)'));

            nodes.push({
              id: tmId,
              type: 'position',
              position: { x: tmX, y: tmY },
              data: {
                title: 'TM(MH)',
                subtitle: tm.manpower ? `${tm.subtitle} [${tm.manpower}명]` : tm.subtitle,
                level: 4,
                colorCategory: 'indirect',
                // 병합된 노드에 대한 추가 정보
                isMerged: isStockfitAssemblyTM,
                processOrigin: isStockfitAssemblyTM ? 
                  (tm.subtitle.includes('(Stockfit)') ? 'stockfit' : 'assembly') : undefined
              },
            });

            if (tmIndex === 0 && lastTlId) {
              edges.push({ id: `edge-${lastTlId}-${tmId}`, source: lastTlId, target: tmId, type: 'smoothstep' });
            } else if (tmIndex > 0) {
              edges.push({ id: `edge-${lastTmId}-${tmId}`, source: lastTmId, target: tmId, type: 'smoothstep' });
            }
            lastTmId = tmId;
          });
        }
      });
      cumulativeX += lineWidths[lineIndex];
    });

    // ===== 6. 분리된 공정 노드 생성 =====
    const separatedStartX = cumulativeX + 160;

    const vsmY = levelHeight;
    const glY = levelHeight * 2;
    const tlStartY = levelHeight * 3;
    const globalTMStartY = glY + levelHeight + (globalMaxTLCount * 80) + 40;

    let currentSeparatedX = separatedStartX;
    const topConnectionNodeId = pmId;

    if (linesWithNosew.length > 0) {
      const shiftCols = config.shiftsCount || 1;
      const totalTLCount = linesWithNosew.length * shiftCols;
      const requiredGLCount = Math.floor(totalTLCount / 4); // 4의 배수일 때만 GL 생성
      const totalCols = Math.max(shiftCols, 2); // 최소 2개 열 (빈 박스 보장)

      const colXs = Array.from({ length: totalCols }, (_, i) => currentSeparatedX + i * glSpacing);
      const glIds: string[] = [];

      // GL과 빈 박스 생성
      colXs.forEach((xPos, idx) => {
        const nodeId = getNextId();

        if (idx < requiredGLCount) {
          // 실제 GL 노드
          glIds.push(nodeId);
          const glSubtitle = requiredGLCount === 1 ? 'No-sew' : `No-sew ${String.fromCharCode(65 + idx)}`; // A, B, C, D...
          nodes.push({
            id: nodeId,
            type: 'position',
            position: { x: xPos, y: glY },
            data: { title: 'GL', subtitle: glSubtitle, level: 2, colorCategory: 'indirect' }
          });
        } else {
          // 빈 박스
          glIds.push(nodeId);
          nodes.push({
            id: nodeId,
            type: 'position',
            position: { x: xPos, y: glY },
            data: { title: '', subtitle: '', colorCategory: 'blank' }
          });
        }
      });

      const blankLMId = getNextId();
      nodes.push({ id: blankLMId, type: 'position', position: { x: currentSeparatedX + (totalCols - 1) * glSpacing / 2, y: vsmY }, data: { title: '', subtitle: '', colorCategory: 'blank' } });
      edges.push({ id: `edge-${topConnectionNodeId}-${blankLMId}`, source: topConnectionNodeId, target: blankLMId, type: 'smoothstep' });
      glIds.forEach(glId => edges.push({ id: `edge-${blankLMId}-${glId}`, source: blankLMId, target: glId, type: 'smoothstep' }));

      // TL 생성 및 연결 (수직 체인 연결)
      const columnTLHistory: { [colIndex: number]: string[] } = {}; // 각 열의 TL ID 히스토리

      let tlCounter = 0;
      linesWithNosew.forEach((lineIndex, i) => {
        const yOffset = i * 80;
        const selectedModel = models[effectiveLineModelSelections[lineIndex]];
        const manpower = selectedModel?.processes?.find(p => p.name.toLowerCase().includes('no-sew'))?.manStt || 18;

        for (let shiftIdx = 0; shiftIdx < shiftCols; shiftIdx++) {
          const colIndex = tlCounter % totalCols; // 순환 배치
          const xPos = colXs[colIndex];

          const tlId = getNextId();
          const shiftSuffix = shiftCols === 1 ? '' : ` ${shiftIdx === 0 ? 'A' : 'B'}`;
          nodes.push({
            id: tlId,
            type: 'position',
            position: { x: xPos, y: tlStartY + yOffset },
            data: {
              title: 'TL',
              subtitle: `Line ${lineIndex + 1} No-sew${shiftSuffix}`,
              manpower: manpower,
              level: 3,
              colorCategory: 'indirect'
            }
          });

          // 연결: 첫 번째 TL은 GL/빈박스에서, 나머지는 바로 위 TL에서
          if (!columnTLHistory[colIndex] || columnTLHistory[colIndex].length === 0) {
            // 각 열의 첫 번째 TL은 GL/빈박스에서 연결
            const targetGLId = glIds[colIndex];
            edges.push({ id: `edge-${targetGLId}-${tlId}`, source: targetGLId, target: tlId, type: 'smoothstep' });
            columnTLHistory[colIndex] = [tlId];
          } else {
            // 나머지 TL은 바로 위 TL에서 연결
            const previousTLId = columnTLHistory[colIndex][columnTLHistory[colIndex].length - 1];
            edges.push({ id: `edge-${previousTLId}-${tlId}`, source: previousTLId, target: tlId, type: 'smoothstep' });
            columnTLHistory[colIndex].push(tlId);
          }

          const tmId = getNextId();
          nodes.push({
            id: tmId,
            type: 'position',
            position: { x: xPos, y: globalTMStartY + yOffset },
            data: {
              title: 'TM(MH)',
              subtitle: `Line ${lineIndex + 1} No-sew${shiftSuffix}`,
              level: 4,
              colorCategory: 'indirect'
            }
          });
          edges.push({ id: `edge-${tlId}-${tmId}`, source: tlId, target: tmId, type: 'smoothstep' });

          tlCounter++;
        }
      });

      currentSeparatedX += glSpacing * totalCols;
    }

    if (linesWithHfWelding.length > 0) {
      currentSeparatedX += glSpacing; // gap after nosew

      const hfCols = config.shiftsCount || 1;
      const hfXs = Array.from({ length: hfCols }, (_, i) => currentSeparatedX + i * glSpacing);

      const blankLMId = getNextId();
      nodes.push({ id: blankLMId, type: 'position', position: { x: currentSeparatedX + (hfCols - 1) * glSpacing / 2, y: vsmY }, data: { title: '', subtitle: '', colorCategory: 'blank' } });
      edges.push({ id: `edge-${topConnectionNodeId}-${blankLMId}`, source: topConnectionNodeId, target: blankLMId, type: 'smoothstep' });

      const colTopTlIds: (string | null)[] = Array(hfCols).fill(null);
      let colLastNodeIds: (string | null)[] = Array(hfCols).fill(null);

      linesWithHfWelding.forEach((lineIndex, i) => {
        const yOffset = i * 80;
        const selectedModel = models[effectiveLineModelSelections[lineIndex]];
        const manpower = selectedModel?.processes?.find(p => p.name.toLowerCase().includes('hf welding'))?.manStt || 20;

        hfXs.forEach((xPos, colIdx) => {
          const tlId = getNextId();
          nodes.push({ id: tlId, type: 'position', position: { x: xPos, y: tlStartY + yOffset }, data: { title: 'TL', subtitle: `Line ${lineIndex + 1} HF Welding${hfCols === 1 ? '' : colIdx === 0 ? ' A' : ' B'}`, manpower: manpower, level: 3, colorCategory: 'indirect' } });

          if (i === 0) {
            edges.push({ id: `edge-${blankLMId}-${tlId}`, source: blankLMId, target: tlId, type: 'smoothstep' });
            colTopTlIds[colIdx] = tlId;
          } else {
            const aboveTlId = nodes.find(n => n.position.x === xPos && n.position.y === tlStartY + (i - 1) * 80)?.id;
            if (aboveTlId) edges.push({ id: `edge-${aboveTlId}-${tlId}`, source: aboveTlId, target: tlId, type: 'smoothstep' });
          }
          colLastNodeIds[colIdx] = tlId;
        });
      });

      // 2개 라인당 1 TM 생성 (HF)
      const hfTmGroups = Math.ceil(linesWithHfWelding.length / 2);
      hfXs.forEach((xPos, colIdx) => {
        for (let g = 0; g < hfTmGroups; g++) {
          const tmId = getNextId();
          nodes.push({ id: tmId, type: 'position', position: { x: xPos, y: globalTMStartY + g * 80 }, data: { title: 'TM(MH)', subtitle: `HF Welding${hfCols === 1 ? '' : colIdx === 0 ? ' A' : ' B'} ${g + 1}`, level: 4, colorCategory: 'indirect' } });

          const sourceNodeId = colLastNodeIds[colIdx] || blankLMId;
          edges.push({ id: `edge-${sourceNodeId}-${tmId}`, source: sourceNodeId, target: tmId, type: 'smoothstep' });
          colLastNodeIds[colIdx] = tmId;
        }
      });

      currentSeparatedX += hfCols * glSpacing;
    }

    return { nodes, edges };
  }, [config.lineCount, config.shiftsCount, config.miniLineCount, models, effectiveLineModelSelections]);

  const [nodesState, setNodes, onNodesChange] = useNodesState([]);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState([]);

  // config나 models가 변경될 때마다 노드와 엣지 업데이트
  React.useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = createNodesAndEdges();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [createNodesAndEdges]);

  const onConnect = useCallback((params: any) => {
    // 연결 기능은 필요에 따라 구현
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
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