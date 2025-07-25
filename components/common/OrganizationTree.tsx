"use client";
import React, { useState, useRef, useEffect } from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { GAPS, BACKGROUNDS, BORDERS, LAYOUTS, DEPARTMENT_GAPS, COMMON_STYLES, CONNECTORS } from './styles';
import { 
  InteractivePositionBox, 
  PositionData, 
  createPositionDataFromLegacy 
} from './InteractivePositionBox';
import { ReactFlowOrgChart } from './ReactFlowOrgChart';
import { calculatePositionCount } from './calculatePositionCount';

// 상단에 상수 추가
const POSITION_BOX_CONFIG = {
  width: 48, // tailwind의 w-48 (12rem)
  gap: 4,    // 1rem
} as const;

// ---------------------------
// **직책 박스 컴포넌트 (PositionBox)**
// ---------------------------
export const PositionBox: React.FC<{
  title: string;
  subtitle?: string;
  level: number;
  className?: string;
  colorCategory?: 'direct' | 'indirect' | 'OH';
}> = ({ title, subtitle, level, className = '', colorCategory }) => {
  let baseClassName = `
    w-${POSITION_BOX_CONFIG.width} h-20
    border border-gray-300 rounded
    flex flex-col justify-center items-center m-2
  `;
  
  // 새로운 색상 체계 적용
  if (colorCategory) {
    if (colorCategory === 'OH') {
      baseClassName += " bg-gray-400 border-gray-500 text-black"; // 가장 진한 색상 (기존 GL 색상)
    } else if (colorCategory === 'indirect') {
      baseClassName += " bg-gray-200 border-gray-400 text-black"; // 중간 색상
    } else if (colorCategory === 'direct') {
      baseClassName += " bg-gray-50 border-gray-300 text-black"; // 가장 옅은 색상
    }
  } else {
    // 기존 level 기반 색상 (하위 호환성을 위해 유지)
    if (level === 0) baseClassName += " bg-gray-700 text-white border-gray-500";
    else if (level === 1) baseClassName += " bg-gray-500 text-white border-gray-700";
    else if (level === 2) baseClassName += " bg-gray-400 border-gray-500";
    else if (level === 3) baseClassName += " bg-gray-300 border-gray-500";
    else baseClassName += " bg-blue-50 border-gray-500";
  }

  return (
    <div className={`${baseClassName} ${className}`}>
      <div className="text-center">
        <div className="font-bold">{title}</div>
        {subtitle && <div className="text-sm">{subtitle}</div>}
      </div>
    </div>
  );
};

// ---------------------------
// **간단 연결선 컴포넌트 (VerticalLine)**
// ---------------------------
export const VerticalLine: React.FC<{
  height?: number;
  className?: string;
}> = ({ height = 20, className = '' }) => {
  return (
    <div
      className={`${CONNECTORS.CONTAINER.DEFAULT} ${CONNECTORS.CONTAINER.VERTICAL} w-full relative`}
      style={{ height: `${height}px` }}
    >
      {/* 중앙 수직선 */}
      <div className={`${CONNECTORS.VERTICAL.DEFAULT} h-[30px]`} />
      
      {/* 수평선과 수직선들을 포함하는 컨테이너 */}
      <div className="relative w-full">
        {/* 수평선들 */}
        <div className={`${CONNECTORS.HORIZONTAL.DEFAULT} absolute`} style={{ width: '100%' }} />
        
        {/* 수직선들 */}
        <div className={`${CONNECTORS.VERTICAL.DEFAULT} h-[20px] absolute`} style={{ top: '0px' }} />
      </div>
    </div>
  );
};

// ---------------------------
// **MGLConnector 컴포넌트**
// ---------------------------
export const MGLConnector: React.FC<{ lineCount: number }> = ({ lineCount }) => {
  const [vsmPositions, setVsmPositions] = useState<number[]>([]);
  const connectorRef = useRef<HTMLDivElement>(null);

  // LM 박스들의 위치를 계산하는 함수
  const calculateLMPositions = () => {
    const vsmElements = document.querySelectorAll('[data-vsm-box="true"]');
    if (!connectorRef.current || vsmElements.length === 0) return;

    const connectorRect = connectorRef.current.getBoundingClientRect();
    const positions = Array.from(vsmElements).map(vsm => {
      const rect = vsm.getBoundingClientRect();
      return rect.left + (rect.width / 2) - connectorRect.left;
    });
    setVsmPositions(positions);
  };

  // LM 박스들이 렌더링된 후 위치 계산
  useEffect(() => {
    const timer = setTimeout(calculateLMPositions, 100);
    return () => clearTimeout(timer);
  }, [lineCount]);

  return (
    <div ref={connectorRef} className={`${CONNECTORS.CONTAINER.DEFAULT} ${CONNECTORS.CONTAINER.VERTICAL} w-full relative`}>
      {/* 중앙 수직선 */}
      <div className={`${CONNECTORS.VERTICAL.DEFAULT} h-[30px]`} />
      
      {/* 수평선과 수직선들을 포함하는 컨테이너 */}
      <div className="relative w-full">
        {vsmPositions.length > 0 && (
          <>
            {/* 수평선들 */}
            {vsmPositions.map((position, i) => (
              <div
                key={i}
                className={`${CONNECTORS.HORIZONTAL.DEFAULT} absolute`}
                style={{
                  width: i === 0 ? `${position}px` :
                         i === vsmPositions.length - 1 ? `${vsmPositions[i] - vsmPositions[i-1]}px` :
                         `${position - vsmPositions[i-1]}px`,
                  left: i === 0 ? '50%' : `${vsmPositions[i-1]}px`,
                  top: '0px'
                }}
              />
            ))}
            
            {/* 수직선들 */}
            {vsmPositions.map((position, i) => (
              <div
                key={i}
                className={`${CONNECTORS.VERTICAL.DEFAULT} h-[20px] absolute`}
                style={{
                  left: `${position}px`,
                  top: '0px'
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// ---------------------------
// **연결선 컴포넌트 (ConnectingLines)**
// ---------------------------
export const ConnectingLines: React.FC<{
  count: number;
  type?: "vertical" | "horizontal";
}> = ({ count, type = "vertical" }) => {
  if (type !== "vertical") {
    return (
      <div className={`${CONNECTORS.CONTAINER.DEFAULT} ${CONNECTORS.CONTAINER.HORIZONTAL} h-4`}>
        <div className={`${CONNECTORS.HORIZONTAL.DEFAULT} w-full`} />
      </div>
    );
  }

  if (count <= 1) {
    return (
      <div className={`${CONNECTORS.CONTAINER.DEFAULT} ${CONNECTORS.CONTAINER.VERTICAL} h-8`}>
        <div className={`${CONNECTORS.VERTICAL.DEFAULT} h-full`} />
      </div>
    );
  }

  return (
    <div className={`${CONNECTORS.CONTAINER.DEFAULT} relative h-12`}>
      {/* 상단 수직선 */}
      <div
        className={`${CONNECTORS.VERTICAL.DEFAULT} absolute left-1/2`}
        style={{ height: '50%', top: 0 }}
      />
      {/* 중앙 수평선 */}
      <div
        className={`${CONNECTORS.HORIZONTAL.DEFAULT} absolute top-1/2`}
        style={{
          left: `${(0.5 / count) * 100}%`,
          right: `${(0.5 / count) * 100}%`
        }}
      />
      {/* 하단 수직선들 */}
      {Array(count).fill(null).map((_, idx) => (
        <div
          key={idx}
          className={`${CONNECTORS.VERTICAL.DEFAULT} absolute`}
          style={{
            left: `${((idx + 0.5) / count) * 100}%`,
            top: '50%',
            height: '50%'
          }}
        />
      ))}
    </div>
  );
};

export interface LMGroupProps {
  vsm: { subtitle: string };
  config: Config;
  spacingConfig: {
    verticalHierarchy: number;
    horizontalCategory: number;
    innerCategory: number;
  };
  lineIndex?: number;
  models?: any[];
  selectedModelIndex?: number;
  onModelChange?: (modelIndex: number) => void;
  onPositionClick?: (data: PositionData) => void;
  onPositionDoubleClick?: (data: PositionData) => void;
  onPositionHover?: (data: PositionData) => void;
  selectedPosition?: PositionData | null;
  highlightedPositions?: string[];
  showSeparatedProcesses?: boolean;
}

export const LMGroup: React.FC<LMGroupProps> = ({ 
  vsm, 
  config, 
  spacingConfig, 
  lineIndex, 
  models = [], 
  selectedModelIndex = 0, 
  onModelChange,
  onPositionClick,
  onPositionDoubleClick,
  onPositionHover,
  selectedPosition,
  highlightedPositions = [],
  showSeparatedProcesses = true
}) => {
  // 선택된 모델 정보
  const selectedModel = models[selectedModelIndex];
  
  // page1.tsx의 getProcessGroups 함수를 사용해야 하지만 여기서는 직접 구현
  const getProcessGroupsForModel = (config: Config, selectedModel?: any, context: 'display' | 'calculation' = 'display') => {
    if (!selectedModel) {
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
            },
            {
              gl: { subtitle: "Stockfit", count: 1 },
              tlGroup: [{ subtitle: "Stockfit" }],
              tmGroup: [{ subtitle: "MH → Assembly" }],
            },
            {
              gl: { subtitle: "Assembly", count: 1 },
              tlGroup: [{ subtitle: "Input" }, { subtitle: "Cementing" }, { subtitle: "Finishing" }],
              tmGroup: [
                { subtitle: "MH → Assembly" },
                { subtitle: "MH → FG WH" },
                { subtitle: "MH → Last" },
              ],
            },
          ],
          separatedProcesses: []
        };
      }
    }

    const allProcesses = selectedModel.processes || [];
    
    // 1. Stitching 관련 공정들
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

    const mainProcesses = [];

    // 1. Stitching 그룹
    if (stitchingProcesses.length > 0) {
      // 모델에서 cutting 관련 공정 찾기
      const cuttingNoSewProcess = allProcesses.find((process: any) => 
        process.name.toLowerCase().includes('cutting no-sew') || 
        process.name.toLowerCase().includes('cutting nosew')
      );
      const cuttingStitchingProcess = allProcesses.find((process: any) => 
        process.name.toLowerCase().includes('cutting stitching')
      );

      const tlGroup = [];
      
      // Cutting No-sew 추가 (실제 데이터 또는 기본값)
      tlGroup.push({
        subtitle: "Cutting No-sew",
        manpower: cuttingNoSewProcess ? cuttingNoSewProcess.manAsy : 6
      });
      
      // Cutting Stitching 추가 (실제 데이터 또는 기본값)
      tlGroup.push({
        subtitle: "Cutting Stitching", 
        manpower: cuttingStitchingProcess ? cuttingStitchingProcess.manAsy : 5
      });
      
      // 나머지 stitching 공정들 추가
      tlGroup.push(...stitchingProcesses.map((process: any) => ({ 
        subtitle: process.name,
        manpower: process.manAsy 
      })));

      mainProcesses.push({
        gl: { subtitle: "Stitching", count: 1 },
        tlGroup,
        tmGroup: stitchingProcesses.map((process: any) => ({ 
          subtitle: `${process.name} TM`,
          manpower: process.manAsy 
        })),
        processes: stitchingProcesses
      });
    }

    // 2 & 3. Stockfit-Assembly 그룹 (display 컨텍스트) 또는 개별 그룹 (calculation 컨텍스트)
    if (context === 'display') {
      // 디스플레이 컨텍스트에서는 Stockfit-Assembly를 병합
      
      // Stockfit TL 그룹
      const stockfitTLGroup = stockfitProcesses.map((process: any) => ({ 
        subtitle: `${process.name} (Stockfit)`,
        manpower: process.manAsy 
      }));
      
      // Assembly TL 그룹 (고정 TL + 실제 공정)
      const assemblyTLGroup = [
        { subtitle: "Input (Assembly)", manpower: 5 },
        { subtitle: "Cementing (Assembly)", manpower: 8 },
        { subtitle: "Finishing (Assembly)", manpower: 6 }
      ];
      
      // 실제 assembly 공정이 있으면 추가
      if (assemblyProcesses.length > 0) {
        assemblyProcesses.forEach((process: any) => {
          assemblyTLGroup.push({ 
            subtitle: `${process.name} (Assembly)`,
            manpower: process.manAsy 
          });
        });
      }
      
      // 병합된 TM 그룹
      const mergedTMGroup = [
        { subtitle: "Stockfit", manpower: stockfitProcesses.reduce((sum: number, p: any) => sum + (p.manAsy || 0), 0) },
        { subtitle: "Assembly", manpower: assemblyProcesses.reduce((sum: number, p: any) => sum + (p.manAsy || 0), 0) },
        { subtitle: "Assembly Last", manpower: 0 }
      ];
      
      // 병합된 Stockfit-Assembly 그룹 추가
      const stockfitManpower = stockfitProcesses.reduce((sum: number, p: any) => sum + (p.manAsy || 0), 0);
      const assemblyManpower = assemblyProcesses.reduce((sum: number, p: any) => sum + (p.manAsy || 0), 0);
      const totalManpower = stockfitManpower + assemblyManpower;
      
      mainProcesses.push({
        gl: { 
          subtitle: totalManpower > 0 ? `Stockfit-Assembly [${totalManpower}]` : "Stockfit-Assembly", 
          count: 1 
        },
        tlGroup: [...stockfitTLGroup, ...assemblyTLGroup],
        tmGroup: mergedTMGroup,
        processes: [...stockfitProcesses, ...assemblyProcesses],
        sourceProcesses: {
          stockfit: stockfitProcesses,
          assembly: assemblyProcesses
        }
      });
    } else {
      // 계산 컨텍스트에서는 기존 구조 유지 (Stockfit과 Assembly 분리)
      
      // 2. Stockfit 그룹
      if (stockfitProcesses.length > 0) {
        mainProcesses.push({
          gl: { subtitle: "Stockfit", count: 1 },
          tlGroup: stockfitProcesses.map((process: any) => ({ 
            subtitle: process.name,
            manpower: process.manAsy 
          })),
          tmGroup: [{ subtitle: "MH → Assembly" }],
          processes: stockfitProcesses
        });
      }

      // 3. Assembly 그룹 (고정 TL + 실제 공정)
      const assemblyTLGroup = [
        { subtitle: "Input", manpower: 5 },
        { subtitle: "Cementing", manpower: 8 },
        { subtitle: "Finishing", manpower: 6 }
      ];
      
      if (assemblyProcesses.length > 0) {
        assemblyProcesses.forEach((process: any) => {
          assemblyTLGroup.push({ 
            subtitle: process.name,
            manpower: process.manAsy 
          });
        });
      }

      mainProcesses.push({
        gl: { subtitle: "Assembly", count: 1 },
        tlGroup: assemblyTLGroup,
        tmGroup: [
          { subtitle: "MH → Assembly" },
          { subtitle: "MH → FG WH" },
          { subtitle: "MH → Last" },
        ],
        processes: assemblyProcesses
      });
    }

    return { mainProcesses, separatedProcesses: [] };
  };

  const { mainProcesses, separatedProcesses } = getProcessGroupsForModel(config, selectedModel);
  
  const tlHeights = mainProcesses.map(group => {
    const tlCount = group.tlGroup.length;
    return tlCount * 80 + (tlCount - 1) * 16;
  });
  const maxTLHeight = Math.max(...tlHeights);

  // 분리된 공정 (no-sew, hf welding) 계산
  const getSeparatedProcessesForLine = () => {
    if (!selectedModel) return [];
    
    const separatedProcessNames = ['cutting no-sew', 'hf welding', 'no-sew'];
    const separatedProcesses = selectedModel.processes.filter((process: any) => 
      separatedProcessNames.some((name: string) => 
        process.name.toLowerCase().includes(name.toLowerCase()) || 
        name.toLowerCase().includes(process.name.toLowerCase())
      )
    );
    
    // 시프트 수에 따라 A, B 구분
    const result: Array<{ name: string; manAsy: number; shiftIndex?: number }> = [];
    
    separatedProcesses.forEach((process: any) => {
      const processName = process.name;
      
      if (processName.toLowerCase().includes('no-sew')) {
        for (let i = 0; i < config.shiftsCount; i++) {
          const suffix = i === 0 ? 'A' : 'B';
          result.push({
            name: `${processName} ${suffix}`,
            manAsy: process.manAsy,
            shiftIndex: i
          });
        }
      } else {
        result.push({
          name: processName,
          manAsy: process.manAsy
        });
      }
    });
    
    return result;
  };

  const separatedProcessesForLine = getSeparatedProcessesForLine();

  // InteractivePositionBox 생성 헬퍼 함수
  const createInteractiveBox = (
    title: string,
    subtitle?: string,
    level: number = 0,
    colorCategory?: 'direct' | 'indirect' | 'OH',
    additionalData?: Partial<PositionData>
  ) => {
    const data = createPositionDataFromLegacy(title, subtitle, level, colorCategory);
    
    // 추가 데이터 설정
    if (additionalData) {
      Object.assign(data, additionalData);
    }
    
    // 라인 인덱스 설정
    data.lineIndex = lineIndex;
    
    // 선택/하이라이트 상태 적용
    data.isSelected = selectedPosition?.id === data.id;
    data.isHighlighted = highlightedPositions.includes(data.id);

    return (
      <InteractivePositionBox
        data={data}
        onClick={onPositionClick}
        onDoubleClick={onPositionDoubleClick}
        onHover={onPositionHover}
        showTooltip={true}
        isInteractive={true}
      />
    );
  };

  return (
    <div className="flex flex-row items-start mx-8 gap-8">
      {/* 메인 공정 영역 (왼쪽) */}
      <div className="flex flex-col items-center">
        {/* LM 박스와 모델 선택 드롭다운 */}
        <div className="flex flex-col items-center">
          {createInteractiveBox("LM", vsm.subtitle, 1, "OH", {
            department: `Line ${(lineIndex || 0) + 1} 관리`,
            manpower: 1, // LM은 항상 1명으로 고정
            responsibilities: ["라인 생산 관리", "품질 관리", "일정 관리"],
            processName: selectedModel ? `${selectedModel.category} - ${selectedModel.modelName}` : "모델 미선택",
            efficiency: 90,
            status: "active"
          })}
          
          {/* 모델 선택 드롭다운 */}
          {models.length > 0 && onModelChange && (
            <div className="mt-2 min-w-[180px]">
              <select
                value={selectedModelIndex}
                onChange={(e) => {
                  e.stopPropagation();
                  onModelChange(parseInt(e.target.value));
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full text-xs p-1 border border-gray-300 rounded bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                style={{ fontSize: '10px' }}
              >
                {models.map((model, index) => (
                  <option key={index} value={index}>
                    {model.category} - {model.modelName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
      {/* LM과 GL 사이 간격 */}
      <div style={{ height: `${spacingConfig.verticalHierarchy}px` }} />
      <div className="flex flex-row">
          {mainProcesses.map((group, idx) => {
          const glHeight = tlHeights[idx];
          const spacerHeight = Math.max(0, maxTLHeight - glHeight) + spacingConfig.verticalHierarchy;
          return (
            <div key={idx} className="flex flex-col items-center mx-6">
                {createInteractiveBox("GL", group.gl.subtitle, 2, "indirect", {
                  department: `${group.gl.subtitle} 부서`,
                  manpower: group.gl.count || 1,
                  responsibilities: [`${group.gl.subtitle} 관리`, "품질 검사", "작업 지시"],
                  processName: group.gl.subtitle,
                  efficiency: 85,
                  status: "active"
                })}
                
              {/* GL과 TL 사이 간격 */}
              <div style={{ height: `${spacingConfig.verticalHierarchy}px` }} />
              <div className="flex flex-col">
                  {group.tlGroup.map((tl: any, tlIdx: number) => (
                    <div key={tlIdx}>
                      {createInteractiveBox("TL", tl.subtitle, 3, "indirect", {
                        department: `${tl.subtitle} 팀`,
                        manpower: tl.manpower || 5,
                        responsibilities: [`${tl.subtitle} 운영`, "팀 관리", "진도 체크"],
                        processName: tl.subtitle,
                        efficiency: 80,
                        status: "active"
                      })}
                    </div>
                ))}
              </div>
                {/* TL과 TM 사이 간격 */}
              <div style={{ height: spacerHeight }} />
              <div className="flex flex-col">
                  {group.tmGroup?.map((tm: any, tmIdx: number) => (
                    <div key={tmIdx}>
                      {createInteractiveBox("TM", tm.subtitle, 4, "indirect", {
                        department: `${tm.subtitle} 팀`,
                        manpower: tm.manpower || 12,
                        responsibilities: [`${tm.subtitle} 작업`, "현장 관리"],
                        processName: tm.subtitle,
                        efficiency: 75,
                        status: "active"
                      })}
                    </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      </div>

      {/* 분리된 공정 영역 (오른쪽) - No-sew/HF Welding */}
      {showSeparatedProcesses && separatedProcessesForLine.length > 0 && (
        <div className="flex flex-col items-center ml-8 border-l-2 border-gray-300 pl-8">
          <div className="text-xs font-semibold text-gray-600 mb-4">분리 공정</div>
          
          <div className="flex flex-col items-center">
            {createInteractiveBox("GL", "No-sew/HF Welding", 2, "direct", {
              department: "분리 공정부",
              manpower: separatedProcessesForLine.length,
              responsibilities: ["분리 공정 관리", "특수 작업"],
              processName: "No-sew/HF Welding",
              efficiency: 90,
              status: "active"
            })}
            
            <div style={{ height: `${spacingConfig.verticalHierarchy}px` }} />
            
            <div className="flex flex-col">
              {separatedProcessesForLine.map((process, idx: number) => (
                <div key={idx} className="flex flex-col items-center mb-4">
                  {createInteractiveBox("TL", process.name, 3, "direct", {
                    department: `${process.name} 팀`,
                    manpower: 2,
                    responsibilities: [`${process.name} 운영`],
                    processName: process.name,
                    efficiency: 85,
                    status: "active"
                  })}
                  
                  <div style={{ height: `${spacingConfig.verticalHierarchy / 2}px` }} />
                  
                  {createInteractiveBox("TM", `${process.manAsy}명`, 4, "direct", {
                    department: `${process.name} 작업팀`,
                    manpower: process.manAsy,
                    responsibilities: [`${process.name} 작업`],
                    processName: process.name,
                    efficiency: 80,
                    status: "active"
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export interface MultiColumnDepartmentSectionProps {
  title: string | string[];
  tlData: string[];
  tmData: string[][];
  tlStartY: number;
  tmStartY: number;
  spacingConfig: {
    verticalHierarchy: number;
    horizontalCategory: number;
    innerCategory: number;
  };
}

export const MultiColumnDepartmentSection: React.FC<MultiColumnDepartmentSectionProps> = ({
  title,
  tlData,
  tmData,
  tlStartY,
  tmStartY,
  spacingConfig
}) => {
  const columnCount = tmData.length;
  const boxWidthRem = POSITION_BOX_CONFIG.width / 4;
  const gapRem = POSITION_BOX_CONFIG.gap / 4;
  
  // TM 섹션의 전체 너비 계산 (박스 너비 + 간격)
  const totalWidth = (columnCount * boxWidthRem) + ((columnCount - 1) * gapRem);
  
  return (
    <div className="flex flex-col items-center relative">
      {/* TL 섹션 */}
      {tlData.length > 0 && (
        <div 
          style={{ 
            position: "absolute",
            top: `${tlStartY}px`,
            left: "50%",
            transform: "translateX(-50%)",
            width: "fit-content",
          }}
        >
          <Boundary type="TL">
            <div className="flex flex-col items-center">
              {tlData.map((tl, index) => (
                <div 
                  key={index} 
                  className="flex flex-col items-center"
                  style={{ marginBottom: `${spacingConfig.verticalHierarchy}px` }}
                >
                  <PositionBox title="TL" subtitle={tl} level={3} />
                  <div className={`${CONNECTORS.CONTAINER.DEFAULT} ${CONNECTORS.CONTAINER.VERTICAL}`}>
                    <VerticalLine height={20} />
                  </div>
                </div>
              ))}
            </div>
          </Boundary>
        </div>
      )}

      {/* TM 섹션 */}
      <div 
        style={{ 
          position: "absolute",
          top: `${tmStartY}px`,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: `${spacingConfig.innerCategory}px`,
          width: `${totalWidth}rem`
        }}
      >
        {tmData.map((column, colIndex) => (
          <div 
            key={colIndex} 
            className="flex flex-col items-center" 
            style={{ 
              width: `${boxWidthRem}rem`,
              gap: `${spacingConfig.verticalHierarchy}px`
            }}
          >
            {column.map((tm, tmIndex) => (
              <PositionBox key={tmIndex} title="TM" subtitle={tm} level={4} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------
// **OrganizationTree 컴포넌트 (전체 조직도)**
// ---------------------------
export const OrganizationTree: React.FC<{ page?: string }> = ({ page = "1" }) => {
  const [config, setConfig] = useState<Config>({
    lineCount: 4,
    shiftsCount: 2,
    miniLineCount: 2,
    hasTonguePrefit: true,
  });

  // 페이지 선택 메뉴 상태 관리
  const [showPageMenu, setShowPageMenu] = useState(false);
  const [selectedPage, setSelectedPage] = useState(page);

  // 기본 확대/축소 값 (첫 화면에 조직도가 모두 보이도록 계산한 값)
  const [zoomScale, setZoomScale] = useState<number>(0.4);
  const handleZoomIn = () => setZoomScale((prev) => prev + 0.1);
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.1, prev - 0.1));
  const handleZoomReset = () => setZoomScale(0.4);

  // 드래그 상태 및 스크롤 관리
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    containerRef.current.scrollLeft = scrollPosition.x - dx;
    containerRef.current.scrollTop = scrollPosition.y - dy;
  };

  const handleMouseUp = () => {
    if (isDragging && containerRef.current) {
      setScrollPosition({
        x: containerRef.current.scrollLeft,
        y: containerRef.current.scrollTop,
      });
      setIsDragging(false);
    }
  };

  useEffect(() => {
    const preventWheel = (e: WheelEvent) => {
      if (isDragging) e.preventDefault();
    };
    window.addEventListener("wheel", preventWheel, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("wheel", preventWheel);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Use the imported calculatePositionCount function
  const calculatePositionCountLocal = (position: string): number => {
    return calculatePositionCount(position, config, getProcessGroups);
  };

  const totalPeople = ["MGL", "LM", "GL", "TL", "TM"].reduce(
    (acc, pos) => acc + calculatePositionCountLocal(pos),
    0
  );

  const renderOrgChart = (page: string) => {
    switch (page) {
      case "1":
        return (
          <div className="border rounded-lg shadow-sm p-12 mx-auto">
            <ReactFlowOrgChart />
          </div>
        );
      case "2":
        return (
          <div className="p-8 border rounded-lg shadow-sm mx-auto">
            <h2 className="text-xl font-bold">페이지 2</h2>
            <p className="mt-4">여기에 페이지 2의 디자인을 구현하세요.</p>
          </div>
        );
      case "3":
        return (
          <div className="p-8 border rounded-lg shadow-sm mx-auto">
            <h2 className="text-xl font-bold">페이지 3</h2>
            <p className="mt-4">여기에 페이지 3의 디자인을 구현하세요.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white relative">
      <div
        ref={containerRef}
        className="h-full"
        style={{
          overflow: "auto",
          cursor: isDragging ? "grabbing" : "grab",
          width: "100%",
          height: "100%",
          padding: "2rem",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      >
        <div
          className="transition-transform duration-200"
          style={{
            minWidth: `${100 * zoomScale}%`,
            minHeight: `${100 * zoomScale}%`,
            transform: `scale(${zoomScale})`,
          }}
        >
          <div
            className="transform-gpu"
            style={{
              transformOrigin: "0 0",
              padding: "1rem",
              margin: "0 auto",
              width: "fit-content",
            }}
          >
            {renderOrgChart(selectedPage)}
          </div>
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <div className="fixed right-8 bottom-8 flex flex-col gap-4 z-50">
        {/* 페이지 선택과 줌 컨트롤 */}
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <div className="flex gap-2 mb-4">
            <Select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="min-w-[120px]"
            >
              <MenuItem value="1">Page 1</MenuItem>
              <MenuItem value="2">Page 2</MenuItem>
              <MenuItem value="3">Page 3</MenuItem>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomIn}
              className="w-10 h-10 border border-gray-500 rounded hover:bg-gray-100 flex items-center justify-center"
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              className="w-10 h-10 border border-gray-500 rounded hover:bg-gray-100 flex items-center justify-center"
            >
              -
            </button>
            <button
              onClick={handleZoomReset}
              className="w-20 h-10 border border-gray-500 rounded hover:bg-gray-100 flex items-center justify-center"
            >
              리셋
            </button>
          </div>
        </div>

        {/* 통계 정보 */}
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 w-64">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">MGL:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {calculatePositionCountLocal("MGL")}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">LM:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {calculatePositionCountLocal("LM")}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">GL:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {calculatePositionCountLocal("GL")}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">TL:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {calculatePositionCountLocal("TL")}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">TM:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {calculatePositionCountLocal("TM")}
              </div>
            </div>
            <div className="pt-2 mt-2 border-t flex items-center justify-between">
              <span className="font-semibold">총 인원수:</span>
              <div className="bg-gray-200 px-3 py-0.5 rounded font-bold">
                {totalPeople}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 

// 내보낼 Config 인터페이스 추가
export interface Config {
  lineCount: number;
  shiftsCount: number;
  miniLineCount: number;
  hasTonguePrefit: boolean;
}
  
// 내보낼 getProcessGroups 함수 추가
export function getProcessGroups(config: Config) {
  return {
    mainProcesses: [
      {
        gl: { subtitle: "Cutting-Prefit", count: 1 },
        tlGroup: Array(config.shiftsCount)
          .fill(null)
          .map((_, idx) => ({ subtitle: `No-sew Shift ${idx + 1}` })),
        tmGroup: Array(config.shiftsCount)
          .fill(null)
          .map((_, idx) => ({ subtitle: `MH to No-sew Shift ${idx + 1}` })),
      },
      {
        gl: { subtitle: "Stitching", count: 1 },
        tlGroup: [
          ...Array(config.miniLineCount)
            .fill(null)
            .map((_, idx) => ({ subtitle: `Mini Line ${idx + 1}` })),
          { subtitle: "Tongue Prefit" },
        ],
        tmGroup: Array(config.miniLineCount)
          .fill(null)
          .map((_, idx) => ({ subtitle: `MH to Stitching ${idx + 1}` })),
      },
      {
        gl: { subtitle: "Stockfit", count: 1 },
        tlGroup: [{ subtitle: "Stockfit" }],
        tmGroup: [{ subtitle: "MH → Assembly" }],
      },
      {
        gl: { subtitle: "Assembly", count: 1 },
        tlGroup: [
          { subtitle: "Input" },
          { subtitle: "Cementing" },
          { subtitle: "Finishing" },
        ],
        tmGroup: [
          { subtitle: "MH → Assembly" },
          { subtitle: "MH → FG WH" },
          { subtitle: "MH → Last" },
        ],
      },
    ],
    separatedProcesses: []
  };
}

interface BoundaryProps {
  type: 'GL' | 'TL';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Boundary: React.FC<BoundaryProps> = ({ type, children, style }) => {
  return (
    <div 
      className={`border border-gray-300 bg-gray-50/20 rounded-lg p-4`}
      style={style}
    >
      {children}
    </div>
  );
};