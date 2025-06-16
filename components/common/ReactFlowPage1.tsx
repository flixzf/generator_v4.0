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
  useReactFlow,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useOrgChart } from '@/context/OrgChartContext';

// ReactFlow용 커스텀 노드 컴포넌트
const CustomPositionNode = ({ data }: { data: any }) => {
  const getBackgroundColor = (colorCategory: string, level: number) => {
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

  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: data.colorCategory === 'blank' ? 'none' : `2px solid ${getBorderColor(data.colorCategory)}`,
        backgroundColor: getBackgroundColor(data.colorCategory, data.level),
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

// getProcessGroups 함수 - 모델 데이터 기반 공정 분리 기능
function getProcessGroups(config: any, selectedModel?: any, lineIndex?: number) {
  if (!selectedModel) {
    // 모델이 없을 때 기본 구조
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

  // 모델의 공정들을 분류
  const allProcesses = selectedModel.processes || [];
  
  // 1. Stitching 관련 공정들 (stitching 단어 포함)
  const stitchingProcesses = allProcesses.filter((process: any) => 
    process.name.toLowerCase().includes('stitching')
  );
  
  // 2. Stockfit 관련 공정들
  const stockfitProcesses = allProcesses.filter((process: any) => 
    process.name.toLowerCase().includes('stockfit')
  );
  
  // 3. Assembly 관련 공정들 (no-sew, hf welding 제외)
  const assemblyProcesses = allProcesses.filter((process: any) => {
    const name = process.name.toLowerCase();
    return !name.includes('stitching') && 
           !name.includes('stockfit') && 
           !name.includes('no-sew') && 
           !name.includes('hf welding') &&
           !name.includes('cutting');
  });

  // 메인 공정 그룹 구성
  const mainProcesses = [];

  // 1. Stitching 그룹
  if (stitchingProcesses.length > 0) {
    console.log('Stitching processes:', stitchingProcesses); // 디버깅용
    console.log('Config miniLineCount:', config?.miniLineCount); // 디버깅용
    
    // 예외 공정들 (miniLine/shift에 비례하지 않고 manAsy 사용)
    const exceptionProcessNames = ['cutting no-sew', 'cutting stitching', 'pre-folding', 'prefit stitching'];
    const exceptionProcesses = allProcesses.filter((process: any) => 
      exceptionProcessNames.some(name => 
        process.name.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    // 일반 stitching 공정들 (예외 공정 제외)
    const regularStitchingProcesses = stitchingProcesses.filter((process: any) => 
      !exceptionProcessNames.some(name => 
        process.name.toLowerCase().includes(name.toLowerCase())
      )
    );
    
    const stitchingTLGroup = [];
    
    // 1. Cutting TL 추가 (cutting no-sew + cutting stitching 합계)
    const cuttingProcesses = exceptionProcesses.filter((process: any) => 
      process.name.toLowerCase().includes('cutting')
    );
    
    if (cuttingProcesses.length > 0) {
      const totalCuttingManpower = cuttingProcesses.reduce((sum: number, process: any) => 
        sum + (process.manAsy || 0), 0
      );
      
      stitchingTLGroup.push({
        subtitle: "Cutting",
        manpower: totalCuttingManpower
      });
      
      console.log('Cutting processes:', cuttingProcesses, 'Total manpower:', totalCuttingManpower);
    }
    
    // 2. 기타 예외 공정들 (pre-folding, prefit stitching) - manAsy 사용
    const otherExceptionProcesses = exceptionProcesses.filter((process: any) => 
      !process.name.toLowerCase().includes('cutting')
    );
    
    otherExceptionProcesses.forEach((process: any) => {
      stitchingTLGroup.push({
        subtitle: process.name,
        manpower: process.manAsy // manAsy 사용
      });
    });
    
    // 3. 일반 stitching 공정들 - config의 miniLineCount 사용
    const regularStitchingTLs = regularStitchingProcesses.flatMap((process: any) => {
      const shifts = [];
      const miniLineCount = config?.miniLineCount || 1; // config 값 사용
      
      console.log(`Regular Stitching Process: ${process.name}, using config miniLineCount: ${miniLineCount}, manStt: ${process.manStt}`);
      
      for (let i = 1; i <= miniLineCount; i++) {
        shifts.push({
          subtitle: miniLineCount > 1 ? `${process.name} ${i}` : process.name,
          manpower: process.manStt // man stt 기준으로 각 miniLine별 인원
        });
      }
      return shifts;
    });
    
    stitchingTLGroup.push(...regularStitchingTLs);

    console.log('Generated Stitching TL Group:', stitchingTLGroup); // 디버깅용

    // TM 그룹도 동일한 로직 적용
    const stitchingTMGroup = [];
    
    // Cutting TM
    if (cuttingProcesses.length > 0) {
      stitchingTMGroup.push({
        subtitle: "Cutting TM",
        manpower: cuttingProcesses.reduce((sum: number, process: any) => sum + (process.manAsy || 0), 0)
      });
    }
    
    // 기타 예외 공정 TM들
    otherExceptionProcesses.forEach((process: any) => {
      stitchingTMGroup.push({
        subtitle: `${process.name} TM`,
        manpower: process.manAsy
      });
    });
    
    // 일반 stitching TM들
    const regularStitchingTMs = regularStitchingProcesses.flatMap((process: any) => {
      const shifts = [];
      const miniLineCount = config?.miniLineCount || 1;
      
      for (let i = 1; i <= miniLineCount; i++) {
        shifts.push({
          subtitle: miniLineCount > 1 ? `${process.name} TM ${i}` : `${process.name} TM`,
          manpower: process.manStt
        });
      }
      return shifts;
    });
    
    stitchingTMGroup.push(...regularStitchingTMs);

    mainProcesses.push({
      gl: { subtitle: "Stitching", count: 1 },
      tlGroup: stitchingTLGroup,
      tmGroup: stitchingTMGroup,
      processes: stitchingProcesses,
      showGL: true // 기본적으로 GL 표시
    });
  }

  // 2. Stockfit 그룹 (stockfitRatio 적용)
  if (stockfitProcesses.length > 0) {
    // stockfitRatio에 따라 GL 표시 여부 결정
    const ratio = config?.stockfitRatio || "2:1";
    
    // Stockfit 비율 확인: 이 라인에 GL(Stockfit)이 있어야 하는지 판단
    let shouldShowStockfitGL = true;
    
    if (ratio === "2:1" && lineIndex !== undefined) {
      // 2:1 비율: 2라인당 1개 GL (홀수 라인에만 표시)
      shouldShowStockfitGL = (lineIndex % 2 === 0); // 0, 2, 4... (Line 1, 3, 5...)
    }
    // 1:1 비율은 모든 라인에 GL 표시 (기본값)
    
    // 각 stockfit 공정의 miniLine 수만큼 TL 생성 (비율 표시 제거)
    const stockfitTLGroup = stockfitProcesses.flatMap((process: any) => {
      const shifts = [];
      const miniLineCount = process.miniLine || 1;
      
      for (let i = 1; i <= miniLineCount; i++) {
        const subtitle = miniLineCount > 1 
          ? `${process.name} ${i}` // (2:1) 제거
          : process.name; // (2:1) 제거
        shifts.push({
          subtitle,
          manpower: process.manStt
        });
      }
      return shifts;
    });
    
    // Stockfit 그룹을 항상 추가하되, GL 표시 여부만 플래그로 관리
    mainProcesses.push({
      gl: { subtitle: "Stockfit", count: 1 },
      tlGroup: stockfitTLGroup,
      tmGroup: [{ subtitle: "MH → Assembly" }],
      processes: stockfitProcesses,
      showGL: shouldShowStockfitGL // GL 표시 여부 플래그 추가
    });
  }

  // 3. Assembly 그룹 (고정 TL + 실제 공정)
  const assemblyTLGroup = [
    { subtitle: "Input" }, // 인원수 제거
    { subtitle: "Cementing" }, // 인원수 제거
    { subtitle: "Finishing" } // 인원수 제거
  ];
  
  // 실제 assembly 공정이 있어도 별도 TL로 추가하지 않음 (GL에서 표시)
  // GL의 subtitle에 실제 assembly 공정 정보 포함
  let assemblyGLSubtitle = "Assembly";
  let assemblyGLManpower = 0;
  
  if (assemblyProcesses.length > 0) {
    // 모든 assembly 공정의 manAsy 합계를 GL에 표시
    assemblyGLManpower = assemblyProcesses.reduce((sum: number, process: any) => 
      sum + (process.manAsy || 0), 0
    );
    
    console.log('Assembly processes:', assemblyProcesses, 'Total manpower:', assemblyGLManpower);
  }

  mainProcesses.push({
    gl: { 
      subtitle: assemblyGLManpower > 0 ? `Assembly [${assemblyGLManpower}명]` : "Assembly",
      count: 1 
    },
    tlGroup: assemblyTLGroup,
    tmGroup: [
      { subtitle: "MH → Assembly" },
      { subtitle: "MH → FG WH" },
      { subtitle: "MH → Last" },
    ],
    processes: assemblyProcesses,
    showGL: true // 기본적으로 GL 표시
  });

  return { 
    mainProcesses, 
    separatedProcesses: getSeparatedProcesses(selectedModel, config) 
  };
}

// No-sew와 HF Welding을 위한 분리된 공정 그룹
function getSeparatedProcesses(selectedModel?: any, config?: any) {
  if (!selectedModel || !config) return [];

  const separatedProcessNames = ['cutting no-sew', 'hf welding', 'no-sew'];
  const separatedProcesses = selectedModel.processes.filter((process: any) => 
    separatedProcessNames.some(name => 
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
}

export const ReactFlowPage1: React.FC<ReactFlowPage1Props> = ({ 
  lineModelSelections = [],
  onInit
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
    const nodeSpacing = 100;
    
    // GL 간격을 다시 적절히 설정 (TL이 수직 배치되므로 넓을 필요 없음)
    const glSpacing = 150; // 고정 간격으로 복원
    
    // 라인 폭도 다시 적절히 조정
    const avgGLCount = 3; // 평균적으로 3개 정도의 GL (Stitching, Stockfit, Assembly)
    const lineWidth = Math.max(500, avgGLCount * glSpacing + 150);

    // MGL 노드 (중앙 상단)
    const mglId = getNextId();
    const mglX = (config.lineCount * lineWidth) / 2;
    nodes.push({
      id: mglId,
      type: 'position',
      position: { x: mglX, y: 0 },
      data: { title: 'MGL', subtitle: 'Manufacturing General Leader', level: 0, colorCategory: 'OH' },
    });

    // 라인별 VSM, GL, TL, TM 생성
    Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
      const lineX = lineIndex * lineWidth;

      // 각 라인별로 모델 기반 공정 그룹 계산
      const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
      const selectedModel = models[modelIndex];
      const { mainProcesses, separatedProcesses } = getProcessGroups(config, selectedModel, lineIndex);

      // GL 노드들을 VSM 아래 수평으로 배치
      const glStartX = lineX + 50; // GL 시작 X 위치
      const glY = levelHeight * 2; // VSM 아래 한 레벨

      // VSM을 GL들의 중앙에 위치시키기
      const glCenterX = glStartX + (mainProcesses.length - 1) * glSpacing / 2;
      
      // VSM 노드 - GL들의 중앙에 배치
      const vsmId = getNextId();
      // 선택된 모델 정보로 서브타이틀 구성 (모델명 + 총인원수)
      const modelTotalManpower = selectedModel?.processes?.reduce((sum: number, p: any) => sum + (p.manAsy || 0), 0) || 0;
      const vsmSubtitle = selectedModel
        ? `${selectedModel.modelName} [${modelTotalManpower}명]`
        : `Line ${lineIndex + 1}`;

      nodes.push({
        id: vsmId,
        type: 'position',
        position: { x: glCenterX, y: levelHeight },
        data: { title: 'VSM', subtitle: vsmSubtitle, level: 1, colorCategory: 'OH' },
      });

      // MGL → VSM 연결
      edges.push({
        id: `edge-${mglId}-${vsmId}`,
        source: mglId,
        target: vsmId,
        type: 'smoothstep',
      });

      // 이 라인의 최대 TL 개수 계산 (TM 레벨 통일을 위해)
      const maxTLCount = Math.max(...mainProcesses.map(p => p.tlGroup.length));
      const tmStartY = glY + levelHeight + (maxTLCount * 80) + 40; // 모든 TL들 아래에서 TM 시작 (적절한 간격)

      mainProcesses.forEach((processGroup, processIndex) => {
        // GL 노드 - showGL 플래그 확인하여 선택적 생성
        let glId = '';
        const glX = glStartX + processIndex * glSpacing;
        
        if (processGroup.showGL !== false) { // showGL이 false가 아닌 경우에만 GL 생성
          glId = getNextId();
          
          nodes.push({
            id: glId,
            type: 'position',
            position: { x: glX, y: glY },
            data: { 
              title: 'GL', 
              subtitle: processGroup.gl.subtitle, 
              level: 2, 
              colorCategory: 'direct' 
            },
          });

          // VSM → GL 연결
          edges.push({
            id: `edge-${vsmId}-${glId}`,
            source: vsmId,
            target: glId,
            type: 'smoothstep',
          });
        }

        // TL 노드들 - GL 아래에 수직으로 배치 (GL이 없어도 위치는 동일)
        const tlStartY = glY + levelHeight; // GL이 없어도 TL 레벨은 동일하게 유지
        let lastTlId = '';
        processGroup.tlGroup.forEach((tl: any, tlIndex: number) => {
          const tlId = getNextId();
          const tlX = glX; // GL과 같은 X 위치 (센터 정렬)
          const tlY = tlStartY + (tlIndex * 80);
          
          nodes.push({
            id: tlId,
            type: 'position',
            position: { x: tlX, y: tlY },
            data: { 
              title: 'TL', 
              subtitle: tl.manpower ? `${tl.subtitle} [${tl.manpower}명]` : tl.subtitle, 
              level: 3, 
              colorCategory: 'direct' 
            },
          });

          // 연결 로직: GL이 있으면 GL → TL, 없으면 VSM → TL
          if (tlIndex === 0) {
            if (processGroup.showGL !== false && glId) {
              // GL → 첫 번째 TL 연결
              edges.push({
                id: `edge-${glId}-${tlId}`,
                source: glId,
                target: tlId,
                type: 'smoothstep',
              });
            } else {
              // VSM → 첫 번째 TL 직접 연결 (GL이 없는 경우)
              edges.push({
                id: `edge-${vsmId}-${tlId}`,
                source: vsmId,
                target: tlId,
                type: 'smoothstep',
              });
            }
          } else {
            // 나머지 TL들은 이전 TL과 연결
            edges.push({
              id: `edge-${lastTlId}-${tlId}`,
              source: lastTlId,
              target: tlId,
              type: 'smoothstep',
            });
          }
          lastTlId = tlId;
        });

        // TM 노드들 - 통일된 TM 레벨에서 시작 (적절한 간격)
        if (processGroup.tmGroup && processGroup.tmGroup.length > 0) {
          let lastTmId = '';
          processGroup.tmGroup.forEach((tm: any, tmIndex: number) => {
            const tmId = getNextId();
            const tmX = glX; // GL과 같은 X 위치 (센터 정렬)
            const tmY = tmStartY + (tmIndex * 80); // 통일된 TM 레벨에서 시작
            
            nodes.push({
              id: tmId,
              type: 'position',
              position: { x: tmX, y: tmY },
              data: { 
                title: 'TM(MH)', 
                subtitle: tm.manpower ? `${tm.subtitle} [${tm.manpower}명]` : tm.subtitle, 
                level: 4, 
                colorCategory: 'direct' 
              },
            });

            // 마지막 TL → 첫 번째 TM 연결
            if (tmIndex === 0 && lastTlId) {
              edges.push({
                id: `edge-${lastTlId}-${tmId}`,
                source: lastTlId,
                target: tmId,
                type: 'smoothstep',
              });
            } else if (tmIndex > 0) {
              // 나머지 TM들은 이전 TM과 연결
              edges.push({
                id: `edge-${lastTmId}-${tmId}`,
                source: lastTmId,
                target: tmId,
                type: 'smoothstep',
              });
            }
            lastTmId = tmId;
          });
        }
      });
    });

    // 모든 라인의 분리된 공정들을 모아서 오른쪽에 정리
    const allSeparatedProcesses: any[] = [];
    
    // 각 라인의 분리된 공정들 수집
    Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
      const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
      const selectedModel = models[modelIndex];
      const { separatedProcesses } = getProcessGroups(config, selectedModel, lineIndex);
      
      separatedProcesses.forEach((process: any) => {
        allSeparatedProcesses.push({
          ...process,
          lineIndex: lineIndex + 1
        });
      });
    });

    if (allSeparatedProcesses.length > 0) {
      const separatedStartX = config.lineCount * lineWidth + 100; // 모든 라인들 오른쪽
      const vsmY = levelHeight; // VSM 레벨 (기존 라인 VSM과 동일)
      const glY = levelHeight * 2; // GL 레벨

      // 공통으로 사용할 빈 부서(VSM 레벨) 노드 생성 함수
      const createBlankDeptNode = (xPos: number) => {
        const blankId = getNextId();
        nodes.push({
          id: blankId,
          type: 'position',
          position: { x: xPos, y: vsmY },
          data: { title: '', subtitle: '', level: 1, colorCategory: 'blank' },
        });
        // MGL에서 빈 부서 노드로 연결
        edges.push({
          id: `edge-${mglId}-${blankId}`,
          source: mglId,
          target: blankId,
          type: 'smoothstep',
        });
        return blankId;
      };

      // 분리 열별로 빈 VSM 노드 생성 후 ID 저장
      const blankDeptIds: { [key: string]: string } = {};
      blankDeptIds['nosewA'] = createBlankDeptNode(separatedStartX);
      blankDeptIds['nosewB'] = createBlankDeptNode(separatedStartX + glSpacing);
      blankDeptIds['hfA']    = createBlankDeptNode(separatedStartX + glSpacing * 2);
      blankDeptIds['hfB']    = createBlankDeptNode(separatedStartX + glSpacing * 3);

      // No-sew A 열 (첫 번째 열)
      const nosewAGlId = getNextId();
      const nosewAX = separatedStartX;
      
      nodes.push({
        id: nosewAGlId,
        type: 'position',
        position: { x: nosewAX, y: glY },
        data: { 
          title: 'GL', 
          subtitle: 'No-sew A', 
          level: 2, 
          colorCategory: 'direct' 
        },
      });

      // 빈 부서 노드 → No-sew A GL 연결
      edges.push({
        id: `edge-${blankDeptIds['nosewA']}-${nosewAGlId}`,
        source: blankDeptIds['nosewA'],
        target: nosewAGlId,
        type: 'smoothstep',
      });

      // No-sew A TL들 (해당 공정이 있는 라인만)
      let lastTlId = '';
      let tlIndex = 0;
      Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
        // 해당 라인의 No-sew 인원수 가져오기
        const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
        const selectedModel = models[modelIndex];
        const nosewProcess = selectedModel?.processes?.find((p: any) => 
          p.name.toLowerCase().includes('no-sew') && !p.name.toLowerCase().includes('cutting')
        );
        
        // manAsy를 시프트 수로 나누어 시프트당 인원 계산
        const totalManpower = nosewProcess?.manAsy || 0;
        const shiftsCount = nosewProcess?.shift || 1;
        const manpowerPerShift = Math.ceil(totalManpower / shiftsCount);
        
        // No-sew 공정이 있는 라인만 TL 생성
        if (totalManpower > 0) {
          const tlId = getNextId();
          const tlY = glY + levelHeight + (tlIndex * 80);
          
          nodes.push({
            id: tlId,
            type: 'position',
            position: { x: nosewAX, y: tlY },
            data: { 
              title: 'TL', 
              subtitle: `[${manpowerPerShift}명] / Line ${lineIndex + 1} / No-sew A`, 
              level: 3, 
              colorCategory: 'direct' 
            },
          });

          if (tlIndex === 0) {
            edges.push({
              id: `edge-${nosewAGlId}-${tlId}`,
              source: nosewAGlId,
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
          tlIndex++;
        }
      });

      // No-sew A TM들 (해당 공정이 있는 라인만)
      let lastTmId = '';
      const tmStartY = glY + levelHeight + (tlIndex * 80) + 40; // tlIndex 기반으로 계산
      let tmIndex = 0;
      Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
        // 해당 라인의 No-sew 인원수 확인
        const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
        const selectedModel = models[modelIndex];
        const nosewProcess = selectedModel?.processes?.find((p: any) => 
          p.name.toLowerCase().includes('no-sew')
        );
        const manpower = nosewProcess?.manAsy || 0;
        
        // No-sew 공정이 있는 라인만 TM 생성
        if (manpower > 0) {
          const tmId = getNextId();
          const tmY = tmStartY + (tmIndex * 80);
          
          nodes.push({
            id: tmId,
            type: 'position',
            position: { x: nosewAX, y: tmY },
            data: { 
              title: 'TM(MH)', 
              subtitle: `Line ${lineIndex + 1} Cutting / → No-sew A`, 
              level: 4, 
              colorCategory: 'direct' 
            },
          });

          if (tmIndex === 0 && lastTlId) {
            edges.push({
              id: `edge-${lastTlId}-${tmId}`,
              source: lastTlId,
              target: tmId,
              type: 'smoothstep',
            });
          } else if (tmIndex > 0) {
            edges.push({
              id: `edge-${lastTmId}-${tmId}`,
              source: lastTmId,
              target: tmId,
              type: 'smoothstep',
            });
          }
          lastTmId = tmId;
          tmIndex++;
        }
      });

      // No-sew B 열 (두 번째 열) - 쉬프트수가 2 이상일 때만
      let nosewBGlId = '';
      let nosewBX = 0;
      if (config.shiftsCount >= 2) {
        nosewBGlId = getNextId();
        nosewBX = separatedStartX + glSpacing;
        
        nodes.push({
          id: nosewBGlId,
          type: 'position',
          position: { x: nosewBX, y: glY },
          data: { 
            title: 'GL', 
            subtitle: 'No-sew B', 
            level: 2, 
            colorCategory: 'direct' 
          },
        });

        // 빈 부서 노드 → No-sew B GL 연결
        edges.push({
          id: `edge-${blankDeptIds['nosewB']}-${nosewBGlId}`,
          source: blankDeptIds['nosewB'],
          target: nosewBGlId,
          type: 'smoothstep',
        });
      }

      // No-sew B TL들 (쉬프트수가 2 이상이고 해당 공정이 있는 라인만)
      if (config.shiftsCount >= 2) {
        lastTlId = '';
        tlIndex = 0;
        Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
          // 해당 라인의 No-sew 인원수 가져오기
          const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
          const selectedModel = models[modelIndex];
          const nosewProcess = selectedModel?.processes?.find((p: any) => 
            p.name.toLowerCase().includes('no-sew') && !p.name.toLowerCase().includes('cutting')
          );
          
          // manAsy를 시프트 수로 나누어 시프트당 인원 계산
          const totalManpower = nosewProcess?.manAsy || 0;
          const shiftsCount = nosewProcess?.shift || 1;
          const manpowerPerShift = Math.ceil(totalManpower / shiftsCount);
          
          // No-sew 공정이 있는 라인만 TL 생성
          if (totalManpower > 0) {
            const tlId = getNextId();
            const tlY = glY + levelHeight + (tlIndex * 80);
            
            nodes.push({
              id: tlId,
              type: 'position',
              position: { x: nosewBX, y: tlY },
              data: { 
                title: 'TL', 
                subtitle: `[${manpowerPerShift}명] / Line ${lineIndex + 1} / No-sew B`, 
                level: 3, 
                colorCategory: 'direct' 
              },
            });

            if (tlIndex === 0) {
              edges.push({
                id: `edge-${nosewBGlId}-${tlId}`,
                source: nosewBGlId,
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
            tlIndex++;
          }
        });
      }

      // No-sew B TM들 (쉬프트수가 2 이상이고 해당 공정이 있는 라인만)
      if (config.shiftsCount >= 2) {
        lastTmId = '';
        const tmStartYB = glY + levelHeight + (tlIndex * 80) + 40; // No-sew B의 tlIndex 기반
        tmIndex = 0;
        Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
          // 해당 라인의 No-sew 인원수 확인
          const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
          const selectedModel = models[modelIndex];
          const nosewProcess = selectedModel?.processes?.find((p: any) => 
            p.name.toLowerCase().includes('no-sew') && !p.name.toLowerCase().includes('cutting')
          );
          
          // manAsy를 시프트 수로 나누어 시프트당 인원 계산
          const totalManpower = nosewProcess?.manAsy || 0;
          const shiftsCount = nosewProcess?.shift || 1;
          const manpowerPerShift = Math.ceil(totalManpower / shiftsCount);
          
          // No-sew 공정이 있는 라인만 TM 생성
          if (totalManpower > 0) {
            const tmId = getNextId();
            const tmY = tmStartYB + (tmIndex * 80);
            
            nodes.push({
              id: tmId,
              type: 'position',
              position: { x: nosewBX, y: tmY },
              data: { 
                title: 'TM(MH)', 
                subtitle: `Line ${lineIndex + 1} Cutting / → No-sew B`, 
                level: 4, 
                colorCategory: 'direct' 
              },
            });

            if (tmIndex === 0 && lastTlId) {
              edges.push({
                id: `edge-${lastTlId}-${tmId}`,
                source: lastTlId,
                target: tmId,
                type: 'smoothstep',
              });
            } else if (tmIndex > 0) {
              edges.push({
                id: `edge-${lastTmId}-${tmId}`,
                source: lastTmId,
                target: tmId,
                type: 'smoothstep',
              });
            }
            lastTmId = tmId;
            tmIndex++;
          }
        });
      }

      // HF Welding A 열 (세 번째 열, GL 없음)
      const hfAX = separatedStartX + (glSpacing * 2);
      
      // HF Welding A TL들 (해당 공정이 있는 라인만)
      lastTlId = '';
      tlIndex = 0;
      Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
        // 해당 라인의 HF Welding 인원수 가져오기
        const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
        const selectedModel = models[modelIndex];
        const hfProcess = selectedModel?.processes?.find((p: any) => 
          p.name.toLowerCase().includes('hf welding')
        );
        
        // manAsy를 시프트 수로 나누어 시프트당 인원 계산
        const totalManpower = hfProcess?.manAsy || 0;
        const shiftsCount = hfProcess?.shift || 1;
        const manpowerPerShift = Math.ceil(totalManpower / shiftsCount);
        
        // HF Welding 공정이 있는 라인만 TL 생성
        if (totalManpower > 0) {
          const tlId = getNextId();
          const tlY = glY + levelHeight + (tlIndex * 80);
          
          nodes.push({
            id: tlId,
            type: 'position',
            position: { x: hfAX, y: tlY },
            data: { 
              title: 'TL', 
              subtitle: `[${manpowerPerShift}명] / Line ${lineIndex + 1} / HF Welding A`, 
              level: 3, 
              colorCategory: 'direct' 
            },
          });

          if (tlIndex === 0) {
            // 첫 번째 TL은 빈 부서 노드에서 연결
            edges.push({
              id: `edge-${blankDeptIds['hfA']}-${tlId}`,
              source: blankDeptIds['hfA'],
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
          tlIndex++;
        }
      });

      // HF Welding A TM들 (해당 공정이 있는 라인만)
      lastTmId = '';
      const tmStartYHFA = glY + levelHeight + (tlIndex * 80) + 40; // HF Welding A의 tlIndex 기반
      tmIndex = 0;
      Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
        // 해당 라인의 HF Welding 인원수 확인
        const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
        const selectedModel = models[modelIndex];
        const hfProcess = selectedModel?.processes?.find((p: any) => 
          p.name.toLowerCase().includes('hf welding')
        );
        
        // manAsy를 시프트 수로 나누어 시프트당 인원 계산
        const totalManpower = hfProcess?.manAsy || 0;
        const shiftsCount = hfProcess?.shift || 1;
        const manpowerPerShift = Math.ceil(totalManpower / shiftsCount);
        
        // HF Welding 공정이 있는 라인만 TM 생성
        if (totalManpower > 0) {
          const tmId = getNextId();
          const tmY = tmStartYHFA + (tmIndex * 80);
          
          nodes.push({
            id: tmId,
            type: 'position',
            position: { x: hfAX, y: tmY },
            data: { 
              title: 'TM(MH)', 
              subtitle: `Line ${lineIndex + 1} Cutting / → HF Welding`, 
              level: 4, 
              colorCategory: 'direct' 
            },
          });

          if (tmIndex === 0 && lastTlId) {
            edges.push({
              id: `edge-${lastTlId}-${tmId}`,
              source: lastTlId,
              target: tmId,
              type: 'smoothstep',
            });
          } else if (tmIndex > 0) {
            edges.push({
              id: `edge-${lastTmId}-${tmId}`,
              source: lastTmId,
              target: tmId,
              type: 'smoothstep',
            });
          }
          lastTmId = tmId;
          tmIndex++;
        }
      });

      // HF Welding B 열 (네 번째 열, GL 없음) - 쉬프트수가 2 이상일 때만
      if (config.shiftsCount >= 2) {
        const hfBX = separatedStartX + (glSpacing * 3);
        
        // HF Welding B TL들 (해당 공정이 있는 라인만)
        lastTlId = '';
        tlIndex = 0;
        Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
          // 해당 라인의 HF Welding 인원수 가져오기
          const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
          const selectedModel = models[modelIndex];
          const hfProcess = selectedModel?.processes?.find((p: any) => 
            p.name.toLowerCase().includes('hf welding')
          );
          
          // manAsy를 시프트 수로 나누어 시프트당 인원 계산
          const totalManpower = hfProcess?.manAsy || 0;
          const shiftsCount = hfProcess?.shift || 1;
          const manpowerPerShift = Math.ceil(totalManpower / shiftsCount);
          
          // HF Welding 공정이 있는 라인만 TL 생성
          if (totalManpower > 0) {
            const tlId = getNextId();
            const tlY = glY + levelHeight + (tlIndex * 80);
            
            nodes.push({
              id: tlId,
              type: 'position',
              position: { x: hfBX, y: tlY },
              data: { 
                title: 'TL', 
                subtitle: `[${manpowerPerShift}명] / Line ${lineIndex + 1} / HF Welding B`, 
                level: 3, 
                colorCategory: 'direct' 
              },
            });

            if (tlIndex === 0) {
              // 첫 번째 TL은 빈 부서 노드에서 연결
              edges.push({
                id: `edge-${blankDeptIds['hfB']}-${tlId}`,
                source: blankDeptIds['hfB'],
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
            tlIndex++;
          }
        });

        // HF Welding B TM들 (해당 공정이 있는 라인만)
        lastTmId = '';
        const tmStartYHFB = glY + levelHeight + (tlIndex * 80) + 40; // HF Welding B의 tlIndex 기반
        tmIndex = 0;
        Array(config.lineCount).fill(null).forEach((_, lineIndex) => {
          // 해당 라인의 HF Welding 인원수 확인
          const modelIndex = effectiveLineModelSelections[lineIndex] || 0;
          const selectedModel = models[modelIndex];
          const hfProcess = selectedModel?.processes?.find((p: any) => 
            p.name.toLowerCase().includes('hf welding')
          );
          
          // manAsy를 시프트 수로 나누어 시프트당 인원 계산
          const totalManpower = hfProcess?.manAsy || 0;
          const shiftsCount = hfProcess?.shift || 1;
          const manpowerPerShift = Math.ceil(totalManpower / shiftsCount);
          
          // HF Welding 공정이 있는 라인만 TM 생성
          if (totalManpower > 0) {
            const tmId = getNextId();
            const tmY = tmStartYHFB + (tmIndex * 80);
            
            nodes.push({
              id: tmId,
              type: 'position',
              position: { x: hfBX, y: tmY },
              data: { 
                title: 'TM(MH)', 
                subtitle: `Line ${lineIndex + 1} Cutting / → HF Welding`, 
                level: 4, 
                colorCategory: 'direct' 
              },
            });

            if (tmIndex === 0 && lastTlId) {
              edges.push({
                id: `edge-${lastTlId}-${tmId}`,
                source: lastTlId,
                target: tmId,
                type: 'smoothstep',
              });
            } else if (tmIndex > 0) {
              edges.push({
                id: `edge-${lastTmId}-${tmId}`,
                source: lastTmId,
                target: tmId,
                type: 'smoothstep',
              });
            }
            lastTmId = tmId;
            tmIndex++;
          }
        });
      }
    }

    return { nodes, edges };
  }, [config.lineCount, config.shiftsCount, config.miniLineCount, config.stockfitRatio, models, effectiveLineModelSelections]);

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