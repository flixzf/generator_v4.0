"use client";
import React, { useState, useEffect, useRef } from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { PositionBox } from "@/components/common/components";
import { useOrgChart } from "@/context/OrgChartContext";
import { LAYOUT } from '@/components/common/theme';
import { ReactFlowPage1 } from "@/components/common/reactflow/ReactFlowPage1";
import { ReactFlowInstance } from 'reactflow';

// ---------------------------
// Config 인터페이스
// ---------------------------
export interface Config {
  lineCount: number;
  shiftsCount: number;
  miniLineCount: number;
  hasTonguePrefit: boolean;
  cuttingPrefitCount: number;
  stitchingCount: number;
  stockfitCount: number;
  assemblyCount: number;
}

// ---------------------------
// 초기 값
// ---------------------------
const defaultConfig: Config = {
  lineCount: 4,
  shiftsCount: 2,
  miniLineCount: 2,
  hasTonguePrefit: true,
  cuttingPrefitCount: 1,
  stitchingCount: 1,
  stockfitCount: 1,
  assemblyCount: 1,
};

// Import the real getProcessGroups function from ReactFlowPage1
import { getProcessGroups } from '@/components/common/reactflow/ReactFlowPage1';

// ---------------------------
// 메인 컴포넌트
// ---------------------------
const Page1: React.FC = () => {
  const {
    config,
    updateConfig,
    models,
    lineModelSelections,
    updateLineModelSelection
  } = useOrgChart();


  // 줌(확대/축소)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  // 참조 (상단 컨테이너, 조직도)
  const topContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // 공통 spacing 설정 사용
  // const spacingConfig = getPage1SpacingConfig(); // 삭제된 함수 - 더 이상 사용하지 않음


  // ---------------------------
  // 모든 라인의 분리 공정을 수집하는 함수
  // ---------------------------
  const getAllSeparatedProcesses = () => {
    const allSeparatedProcesses: Array<{
      lineIndex: number;
      processes: Array<{ name: string; manAsy: number; shiftIndex?: number }>;
    }> = [];

    lineModelSelections.forEach((modelIndex, lineIndex) => {
      const selectedModel = models[modelIndex];
      if (!selectedModel) return;

      const separatedProcessNames = ['cutting no-sew', 'hf welding', 'no-sew'];
      const separatedProcesses = selectedModel.processes.filter((process: any) =>
        separatedProcessNames.some(name =>
          process.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(process.name.toLowerCase())
        )
      );

      if (separatedProcesses.length === 0) return;

      const processesForLine: Array<{ name: string; manAsy: number; shiftIndex?: number }> = [];

      separatedProcesses.forEach((process: any) => {
        const processName = process.name;

        if (processName.toLowerCase().includes('no-sew')) {
          for (let i = 0; i < config.shiftsCount; i++) {
            const suffix = i === 0 ? 'A' : 'B';
            processesForLine.push({
              name: `${processName} ${suffix}`,
              manAsy: process.manAsy,
              shiftIndex: i
            });
          }
        } else {
          processesForLine.push({
            name: processName,
            manAsy: process.manAsy
          });
        }
      });

      if (processesForLine.length > 0) {
        allSeparatedProcesses.push({
          lineIndex,
          processes: processesForLine
        });
      }
    });

    return allSeparatedProcesses;
  };

  // ---------------------------
  // 통합된 분리 공정 영역 렌더링 함수 (4열 구조, 데이터 기반 동적 렌더링)
  // ---------------------------
  const renderSeparatedProcessesSection = () => {
    // 라인별 모델에서 separatedProcesses 추출
    const separatedByTypeAndShift = [
      { key: 'nosewA', type: 'no-sew', shift: 0, label: 'No-sew A', gl: true },
      { key: 'nosewB', type: 'no-sew', shift: 1, label: 'No-sew B', gl: true },
      { key: 'hfA', type: 'hf welding', shift: 0, label: 'HF Welding A', gl: false },
      { key: 'hfB', type: 'hf welding', shift: 1, label: 'HF Welding B', gl: false },
    ];

    // 각 열별로 실제로 해당 공정이 있는지 체크
    const columns = separatedByTypeAndShift.map(col => {
      // 각 라인별로 해당 공정이 있는지 확인
      const lines = [];
      for (let lineIdx = 0; lineIdx < config.lineCount; lineIdx++) {
        const modelIdx = lineModelSelections[lineIdx] || 0;
        const model = models[modelIdx];
        if (!model) continue;
        // no-sew/hf welding 공정만 추출
        const found = model.processes.find(proc => {
          if (col.type === 'no-sew') {
            return proc.name.toLowerCase().includes('no-sew');
          } else {
            return proc.name.toLowerCase().includes('hf welding');
          }
        });
        if (found) {
          lines.push({
            lineIdx,
            manpower: found.manAsy,
            processName: found.name
          });
        }
      }
      return { ...col, lines };
    });

    // 실제로 라인에 해당 공정이 하나라도 있으면 그 열만 렌더링
    const columnsToRender = columns.filter(col => col.lines.length > 0);
    if (columnsToRender.length === 0) return null;

    // PM 박스 높이 (80px) + 간격 + LM 박스 높이 (80px) + 간격을 계산하여 GL 레벨 맞춤
    const pmHeight = 80;
    const vsmHeight = 80;
    const verticalGap = 48; // 기본 hierarchy 간격
    const topMargin = pmHeight + verticalGap + vsmHeight + verticalGap;

    return (
      <div className="flex flex-col items-center ml-8 border-l-2 border-gray-300 pl-8">
        <div className="text-sm font-semibold text-gray-600 mb-4">분리 공정</div>
        <div className="flex flex-row gap-8" style={{ marginTop: `${topMargin}px` }}>
          {columnsToRender.map((col, colIdx) => (
            <div key={col.key} className="flex flex-col items-center">
              {/* GL (No-sew만) */}
              {col.gl && (
                <div className="mb-2">
                  <PositionBox title="GL" subtitle={col.label} level={2} />
                </div>
              )}
              {/* 헤더 (GL 없는 경우) */}
              {!col.gl && (
                <div className="mb-2 text-base font-semibold text-gray-700">{col.label}</div>
              )}
              {/* TL 4개 세로로 */}
              {col.lines.map((line, idx) => (
                <div key={line.lineIdx} className="mb-2">
                  <PositionBox 
                    title="TL" 
                    subtitle={`TL [${line.manpower}] / Line ${line.lineIdx + 1} / ${col.label}`} 
                    level={3} 
                  />
                </div>
              ))}
              {/* TL-TM 구분선/여백 */}
              <div style={{ height: `48px` }} />
              {/* TM 4개 세로로 */}
              {col.lines.map((line, idx) => (
                <div key={line.lineIdx} className="mb-2">
                  <PositionBox 
                    title="TM" 
                    subtitle={`TM(MH) / Line ${line.lineIdx + 1} Cutting / → ${col.label}`} 
                    level={4} 
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 줌(확대/축소)
  const handleZoomIn = () => rfInstance?.zoomIn?.({ duration: 300 });
  const handleZoomOut = () => rfInstance?.zoomOut?.({ duration: 300 });

  // "리셋"버튼: ReactFlow fitView 사용
  const handleZoomReset = () => {
    rfInstance?.fitView?.({ duration: 300 });
  };


  // ===== 초기 렌더링 시, 조직도를 상단 컨테이너에 맞춤 =====
  useEffect(() => {
    // 마운트된 직후(조금 늦게) 측정하도록 setTimeout
    const timer = setTimeout(() => {
      fitChartToContainer();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // fitChartToContainer: 상단 컨테이너 크기에 조직도가 '가로/세로' 모두 들어가도록 스케일 계산 + 중앙정렬
  const fitChartToContainer = () => {
    if (!topContainerRef.current || !chartRef.current) return;

    const containerRect = topContainerRef.current.getBoundingClientRect();
    const chartRect = chartRef.current.getBoundingClientRect();

    if (chartRect.width === 0 || chartRect.height === 0) return;

    // 컨테이너 대비 조직도 스케일 (여백 고려)
    const padding = 40;
    const availableWidth = containerRect.width - padding * 2;
    const availableHeight = containerRect.height - padding * 2;

    const scaleX = availableWidth / chartRect.width;
    const scaleY = availableHeight / chartRect.height;
    const newScale = Math.min(scaleX, scaleY, 1);

    // 중앙 정렬을 위한 offset 계산
    const scaledWidth = chartRect.width * newScale;
    const scaledHeight = chartRect.height * newScale;

    const offsetX = (containerRect.width - scaledWidth) / 2;
    const offsetY = (containerRect.height - scaledHeight) / 2;

    if (rfInstance) {
      rfInstance.setViewport({ x: offsetX, y: offsetY, zoom: newScale });
    }
  };

  // 인원 수 계산
  const calculatePositionCount = (position: string): number => {
    if (position === "PM") return 1;

    if (position === "LM") {
      // LM은 1개 라인당 1명으로 계산
      return config.lineCount;
    }

    // 모델 기반 인원 계산
    let total = 0;

    // 분리된 공정을 가진 라인들 찾기
    const linesWithNosew: number[] = [];
    const linesWithHfWelding: number[] = [];

    lineModelSelections.forEach((modelIndex, lineIndex) => {
      const selectedModel = models[modelIndex];
      if (!selectedModel) return;

      // 'display' 컨텍스트를 명시적으로 전달하여 병합된 구조를 사용
      const { mainProcesses } = getProcessGroups(config, selectedModel, lineIndex, 'display');

      // 메인 공정들의 인원 계산
      mainProcesses.forEach((group) => {
        if (position === "GL") {
          // 병합된 노드는 하나의 GL로 계산
          total += group.gl.count || 1;
        } else if (position === "TL") {
          // TL은 그룹 내 모든 TL 포함 (병합된 구조에서도 모든 TL 카운트)
          total += group.tlGroup.length;
        } else if (position === "TM") {
          // TM은 OH/indirect 박스 개수만 계산 (실제 direct 인원수가 아님)
          total += group.tmGroup?.length || 0;
        }
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

    // No-sew 분리된 공정 인원 계산 (ReactFlowPage1 로직과 동일)
    if (linesWithNosew.length > 0) {
      const shiftCols = config.shiftsCount || 1;
      const totalTLCount = linesWithNosew.length * shiftCols;

      if (position === "GL") {
        // No-sew GL: 4개 TL당 1개 GL (Math.floor(totalTLCount / 4))
        total += Math.floor(totalTLCount / 4);
      } else if (position === "TL") {
        // No-sew TL: 각 라인 × 시프트 수
        total += totalTLCount;
      } else if (position === "TM") {
        // No-sew TM: 각 라인 × 시프트 수
        total += totalTLCount;
      }
    }

    // HF Welding 분리된 공정 인원 계산 (ReactFlowPage1 로직과 동일)
    if (linesWithHfWelding.length > 0) {
      const hfCols = config.shiftsCount || 1;

      if (position === "GL") {
        // HF Welding은 GL이 없음
        total += 0;
      } else if (position === "TL") {
        // HF Welding TL: 각 라인 × 시프트 수
        total += linesWithHfWelding.length * hfCols;
      } else if (position === "TM") {
        // HF Welding TM: 2개 라인당 1개 × 시프트 수
        const hfTmGroups = Math.ceil(linesWithHfWelding.length / 2);
        total += hfTmGroups * hfCols;
      }
    }

    return total;
  };

  // 라인별 모델 상세 정보 계산
  const getLineModelDetails = () => {
    if (models.length === 0 || lineModelSelections.length === 0) return [];

    return lineModelSelections.map((modelIndex, lineIndex) => {
      const model = models[modelIndex] || models[0];
      return {
        lineIndex,
        model,
        totalManpower: model.processes.reduce((total: number, process: any) => total + process.manAsy, 0),
        vsmRequired: 1 // LM은 항상 1명으로 고정
      };
    });
  };

  // 모델별 상세 인원 정보 계산 (기존 함수 유지 - 호환성용)
  const getModelDetails = () => {
    if (models.length === 0) return [];

    return models.map(model => ({
      ...model,
      totalManpower: model.processes.reduce((total: number, process: any) => total + process.manAsy, 0),
      vsmRequired: 1 // LM은 항상 1명으로 고정
    }));
  };

  // 인원 요약 계산
  const positionCounts = {
    PM: calculatePositionCount("PM"),
    LM: calculatePositionCount("LM"),
    GL: calculatePositionCount("GL"),
    TL: calculatePositionCount("TL"),
    TM: calculatePositionCount("TM")
  };

  const totalPeople = Object.values(positionCounts).reduce((acc, count) => acc + count, 0);


  // 실제 JSX
  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative">
      {/* 조직도 영역 */}
      <div
        ref={topContainerRef}
        className="w-full h-full relative"
      >
        {/* ReactFlow 조직도 - 전체 화면 */}
        <div
          ref={chartRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <ReactFlowPage1
            lineModelSelections={lineModelSelections}
            onInit={(inst) => setRfInstance(inst)}
          />
        </div>

        {/* 색상 범례 - 오른쪽 상단 */}
        <div className="fixed right-8 top-8 flex flex-row gap-2 z-50">
          <div className="bg-gray-50 border-2 border-dashed border-gray-400 px-4 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-semibold text-black">Direct</span>
          </div>
          <div className="bg-gray-200 border border-gray-400 px-4 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-semibold text-black">Indirect</span>
          </div>
          <div className="bg-gray-400 border border-gray-500 px-4 py-2 rounded-lg shadow-sm">
            <span className="text-sm font-semibold text-black">OH</span>
          </div>
        </div>

        {/* 인원 요약 정보 패널 - 오른쪽 상단 */}
        <div className="fixed right-8 top-24 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="font-semibold text-lg mb-2">인원 요약</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">VSM:</span>
              <span>{positionCounts.PM}명</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">A.VSM:</span>
              <span>{positionCounts.LM}명</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">GL:</span>
              <span>{positionCounts.GL}명</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">TL:</span>
              <span>{positionCounts.TL}명</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">TM:</span>
              <span>{positionCounts.TM}명</span>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold">
              <span>총 인원:</span>
              <span>{totalPeople}명</span>
            </div>
          </div>
        </div>

        {/* 줌 컨트롤 - 왼쪽 상단 (드롭다운과 겹치지 않도록 아래로) */}
        <div className="fixed left-8 top-28 flex flex-col gap-2 z-50">
          <button
            onClick={handleZoomIn}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow hover:bg-gray-50"
          >
            🔍+
          </button>
          <button
            onClick={handleZoomOut}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow hover:bg-gray-50"
          >
            🔍-
          </button>
          <button
            onClick={handleZoomReset}
            className="bg-white border border-gray-300 px-3 py-2 rounded shadow hover:bg-gray-50"
          >
            ↻
          </button>
        </div>


        {/* 설정 패널 - 우측 하단으로 이동 */}
        <div className="fixed right-8 bottom-8 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex flex-col">
              <span className="text-sm font-semibold">라인 수</span>
              <input
                type="number"
                className="w-20 border p-1 rounded"
                value={config.lineCount}
                min="1"
                max="8"
                step="1"
                onChange={(e) => {
                  const inputValue = e.target.value === '' ? '1' : e.target.value;
                  const value = Math.max(1, Math.min(8, parseInt(inputValue) || 1));
                  updateConfig({ lineCount: value });
                }}
                style={{
                  appearance: 'auto',
                  margin: 0,
                }}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold">쉬프트 수</span>
              <input
                type="number"
                className="w-20 border p-1 rounded"
                value={config.shiftsCount}
                min="1"
                max="5"
                step="1"
                onChange={(e) => {
                  const inputValue = e.target.value === '' ? '1' : e.target.value;
                  const value = Math.max(1, Math.min(5, parseInt(inputValue) || 1));
                  updateConfig({ shiftsCount: value });
                }}
                style={{
                  appearance: 'auto',
                  margin: 0,
                }}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold">미니 라인 수</span>
              <input
                type="number"
                className="w-20 border p-1 rounded"
                value={config.miniLineCount}
                min="1"
                max="5"
                step="1"
                onChange={(e) => {
                  const inputValue = e.target.value === '' ? '1' : e.target.value;
                  const value = Math.max(1, Math.min(5, parseInt(inputValue) || 1));
                  updateConfig({ miniLineCount: value });
                }}
                style={{
                  appearance: 'auto',
                  margin: 0,
                }}
              />
            </label>

          </div>

          {/* 라인별 모델 선택 */}
          {models.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold mb-2">라인별 모델 선택:</div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {Array(config.lineCount).fill(null).map((_, lineIndex) => (
                  <div key={lineIndex} className="flex items-center space-x-2">
                    <span className="text-xs font-medium w-12">Line {lineIndex + 1}:</span>
                    <Select
                      size="small"
                      value={lineModelSelections[lineIndex] || 0}
                      onChange={(e) => updateLineModelSelection(lineIndex, parseInt(e.target.value as string))}
                      className="flex-1"
                    >
                      {models.map((model, modelIndex) => (
                        <MenuItem key={modelIndex} value={modelIndex}>
                          <span className="text-xs">{model.category} - {model.modelName}</span>
                        </MenuItem>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default Page1;
