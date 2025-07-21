"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  PositionBox,
  VerticalLine,
  MultiColumnDepartmentSection,
  Boundary,
  type MultiColumnDepartmentSectionProps
} from "@/components/common/OrganizationTree";
import { useOrgChart, type Config } from "@/context/OrgChartContext";
import { GAPS, BACKGROUNDS, BORDERS, LAYOUTS, DEPARTMENT_GAPS, COMMON_STYLES, CONNECTORS } from '@/components/common/styles';
import { getPage2SpacingConfig, getVerticalSpacing, getHorizontalSpacing } from "@/components/common/spacingConfig";
import { ReactFlowPage2 } from "@/components/common/ReactFlowPage2";
import { ReactFlowInstance } from 'reactflow';

// === [1] Config 인터페이스 제거 ===
// interface Config { ... } 삭제

// === [2] Page2 컴포넌트 ===
const Page2: React.FC = () => {
  const { config, updateConfig } = useOrgChart();

  // 다(多)컬럼으로 표현할 부서 리스트 - 컴포넌트 최상단에 정의
  const multiColumnDepts = ["FG WH", "Bottom Market", "P&L Market"];

  // === (A) 확대/축소 & 패닝(드래그) 관련 ===
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => rfInstance?.zoomIn?.({ duration: 300 });
  const handleZoomOut = () => rfInstance?.zoomOut?.({ duration: 300 });
  const handleZoomReset = () => rfInstance?.fitView?.({ duration: 300 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // 마우스 가운데(또는 왼쪽) 버튼으로 드래그 시작
    if (e.button === 1 || e.button === 0) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    containerRef.current.scrollLeft = scrollPos.x - dx;
    containerRef.current.scrollTop = scrollPos.y - dy;
  };
  const handleMouseUp = () => {
    if (isDragging && containerRef.current) {
      setScrollPos({
        x: containerRef.current.scrollLeft,
        y: containerRef.current.scrollTop,
      });
      setIsDragging(false);
    }
  };
  useEffect(() => {
    // 드래그 중 휠 스크롤 방지
    const preventWheel = (ev: WheelEvent) => {
      if (isDragging) ev.preventDefault();
    };
    window.addEventListener("wheel", preventWheel, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("wheel", preventWheel);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // === (B) 라인 수에 따라 달라지는 TM 처리 ===
  // 1) 일반적인 "Line X" 식
  const makeSingleLines = (count: number, prefix: string = 'Line ') =>
    Array.from({ length: count }, (_, i) => `${prefix}${i + 1}`);

  // 2) 2라인씩 묶는 "Line 1-2", "Line 3-4", ... (홀수 남으면 단독)
  const makeDoubleLines = (count: number, prefix: string = 'Line ') =>
    Array.from({ length: Math.ceil(count / 2) }, (_, i) => `${prefix}${i * 2 + 1}-${i * 2 + 2 > count ? i * 2 + 1 : i * 2 + 2}`);

  // FG WH Shipping TM 갯수 매핑 (라인 수 1~8 → 1,2,3,3,4,5,6,6)
  const getShippingTMCount = (lineCount: number) => {
    const lookup = [0, 1, 2, 3, 3, 4, 5, 6, 6];
    if (lineCount <= 8) return lookup[lineCount];
    // 9라인 이상은 대략 0.75배로 반올림
    return Math.ceil(lineCount * 0.75);
  };

  // === (C) 부서 목록 (lineCount 등에 따라 동적 생성) ===
  // 기존 departments를 동적으로 생성
  const departments = React.useMemo(() => {
    // Plant Production TM 계산 함수 (2라인마다 1명 증가)
    const calculatePlantProductionTMs = (lineCount: number) => {
      // Input과 Output 각각 2라인당 1명씩 계산
      const inputCount = Math.ceil(lineCount / 2);
      const outputCount = Math.ceil(lineCount / 2);
      
      // Input TM 생성
      const inputTMs = Array.from({ length: inputCount }, (_, i) => `Input ${i + 1}`);
      
      // Output TM 생성
      const outputTMs = Array.from({ length: outputCount }, (_, i) => `Output ${i + 1}`);
      
      // Input을 먼저 배치하고 Output을 나중에 배치
      return [inputTMs, outputTMs];
    };

    return [
      {
        title: ["Admin"],
        hasGL: false,  // GL이 없는 부서
        tl: [],        // TL도 없음
        tm: [
          ["Personnel"],
          ["Production"],
          ["ISQ"],
        ],
      },
      {
        title: ["Small Tooling"],
        hasGL: false,   // GL 없음
        tl: ["Small Tooling"],
        tm: [["Last Control"], ["Pallet"], ["Cutting Die/Pad/Mold"]],
      },
      {
        title: ["Raw Material"],
        hasGL: false,  // GL이 없는 부서
        tl: [],        // TL도 없음
        tm: [["Material WH → Cutting"], ["Material WH → Cutting"]],
      },
      {
        title: ["Sub Material"],
        hasGL: false,   // GL 없음
        tl: ["Material"],
        tm: [["Incoming"], ["Distribution"]],
      },
      {
        title: ["ACC Market"],
        hasGL: false,   // GL 없음
        tl: [],
        tm: makeDoubleLines(config.lineCount).map(line => [line]),
      },
      {
        title: "P&L Market",
        hasGL: true,   // GL이 있는 부서
        tl: ["P&L Market"],
        tm: [
          // 열 1
          [
            "Stencil1",
            "Stencil2",
            ...makeDoubleLines(config.lineCount).map(line => `${line} Box MH`),
          ],
          // 열 2
          [
            ...makeDoubleLines(config.lineCount).map(line => `${line} Paper MH`),
          ],
        ],
      },
      {
        title: ["Bottom Market"],
        hasGL: false,
        tl: ["Bottom Market Incoming"],
        tm: [
          ["Outsole", "Outsole", "Midsole", "Midsole"], // 열 1
          ["Bottom ACC"], // 열 2
        ],
      },
      {
        title: ["Plant Production"],
        hasGL: false,  // GL이 없는 부서
        tl: [],        // TL도 없음
        tm: calculatePlantProductionTMs(config.lineCount),
      },
      {
        title: "FG WH",
        hasGL: true,
        tl: ["FG WH"],
        tm: [
          // Shipping 카테고리: 라인 수에 따른 가변 TM
          Array.from({ length: getShippingTMCount(config.lineCount) }, (_, idx) => `Shipping TM ${idx + 1}`),
          // Incoming & Setting 카테고리 (라인 수 만큼)
          makeSingleLines(config.lineCount, '').map(i => `Incoming & Setting Line ${i}`),
          ["Report", "Metal Detect"],
        ],
      },
    ];
  }, [config]);

  // === (D) TL, TM 레이아웃 계산 (수직 간격 등) ===
  // TM 헤더 표시 로직 - 특정 키워드 포함 시 "TM (MH)" 로 표시
  const getTMTitle = (subtitle: string) => {
    const keywords = [
      'material',       // raw material
      'acc',            // ACC Market, Bottom ACC 등
      'outsole',        // Outsole
      'midsole',        // Midsole
      'box',            // Carton/Inner Box, Box MH etc.
      'incoming & setting' // Incoming & Setting
    ];
    const lower = subtitle.toLowerCase();
    return keywords.some(k => lower.includes(k)) ? 'TM (MH)' : 'TM';
  };
  const [dimensions, setDimensions] = useState({
    tlStartY: 0,
    tmStartY: 0,
    totalHeight: 0,
  });

  // 공통 spacing 설정 사용
  const spacingConfig = getPage2SpacingConfig();

  useEffect(() => {
    const boxHeight = 50;    // PositionBox 높이
    const verticalGap = spacingConfig.verticalHierarchy;  // 박스 간 간격을 spacingConfig 값으로 변경
    const glToTlGap = spacingConfig.verticalHierarchy;    // GL 아래 TL 시작점도 동일하게 변경
    const tlStartY = glToTlGap;

    // 가장 TM이 많은(=2차원 배열의 총 길이가 가장 큰) 부서 찾기
    const maxTmCount = Math.max(
      ...departments.map((dept) =>
        dept.tm.reduce((acc, arr) => acc + arr.length, 0)
      )
    );

    // TL이 1~2줄 있다는 가정으로, TM 시작을 tlStartY + 2박스 정도 아래
    const tmStartY = tlStartY + (boxHeight + verticalGap) * 2;

    // 전체 높이
    const totalHeight =
      tmStartY + boxHeight * maxTmCount + verticalGap * (maxTmCount - 1);

    setDimensions({ tlStartY, tmStartY, totalHeight });
  }, [departments, spacingConfig.verticalHierarchy]);

  // === (E) 인원 합계창에 표시할 "부서별 계산" (간단 예: 부서 수 / TL, TM 총합 등)
  // 일단은 Page1처럼 MGL/GL/TL/TM 합산 개념만 예시
  const calculateDepartmentCount = (dept: typeof departments[0]) => {
    // GL = 1명
    // TL = dept.tl.length
    // TM = dept.tm.reduce((acc, arr) => acc + arr.length, 0)
    return 1 + dept.tl.length + dept.tm.reduce((acc, arr) => acc + arr.length, 0);
  };

  const totalPM = 1; // 그냥 예시 (PM은 1명)
  const totalGL = departments.reduce(
    (acc, dept) => acc + (dept.hasGL ? 1 : 0),
    0
  );
  const totalTL = departments.reduce((acc, dept) => acc + dept.tl.length, 0);
  const totalTM = departments.reduce(
    (acc, dept) => acc + dept.tm.reduce((sum, arr) => sum + arr.length, 0),
    0
  );
  const totalPeople = totalPM + totalGL + totalTL + totalTM;

  // DepartmentSection 컴포넌트 props 타입 수정
  interface DepartmentSectionProps {
    title: string | string[];
    tlData: string[];
    tmData: string[][];
    tlStartY: number;
    tmStartY: number;
  }

  // === (F) DepartmentSection(부서별 TL/TM) 렌더링 컴포넌트 ===
  const DepartmentSection: React.FC<DepartmentSectionProps> = ({ title, tlData, tmData, tlStartY, tmStartY }) => {
    const isMultiColumnDept =
      (typeof title === "string" && multiColumnDepts.includes(title)) ||
      (Array.isArray(title) && title.some(t => multiColumnDepts.includes(t)));

    if (isMultiColumnDept) {
      return (
        <div className={COMMON_STYLES.DEPARTMENT} style={{ marginTop: `${spacingConfig.verticalHierarchy}px` }}>
          {tlData.length > 0 && (
            <Boundary type="TL">
              <div className={`${LAYOUTS.FLEX.COLUMN} items-center`}>
                <PositionBox 
                  title="TL" 
                  subtitle={tlData[0]} 
                  level={3} 
                  colorCategory={getColorCategory(title, 'TL', tlData[0])} 
                />
                <div 
                  className={LAYOUTS.FLEX.ROW}
                  style={{ 
                    gap: '24px',
                    marginTop: `${spacingConfig.verticalHierarchy}px`
                  }}
                >
                  {tmData.map((categoryTMs, categoryIndex) => {
                    // 컬럼 헤더 정의 (필요한 부서만)
                    const deptName = Array.isArray(title) ? title[0] : title;
                    let header = "";
                    if (deptName === "P&L Market") {
                      header = categoryIndex === 0 ? "Carton/Inner Box" : "Paper";
                    } else if (deptName === "Bottom Market") {
                      header = categoryIndex === 0 ? "Outsole, Midsole Bottom ACC" : "";
                    }

                    return (
                      <div 
                        key={categoryIndex}
                        className={`${LAYOUTS.FLEX.COLUMN} items-center`}
                        style={{ gap: `${spacingConfig.innerCategory}px` }}
                      >
                        {header && (
                          <div className="italic text-sm mb-1 text-center whitespace-nowrap">{header}</div>
                        )}

                        {categoryTMs.map((tm, tmIndex) => (
                          <PositionBox 
                            key={tmIndex} 
                            title={getTMTitle(tm)} 
                            subtitle={tm} 
                            level={4} 
                            colorCategory={getColorCategory(title, 'TM', tm)} 
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Boundary>
          )}
        </div>
      );
    }

    return (
      <div 
        className={`${LAYOUTS.FLEX.COLUMN} items-center relative`}
        style={{ marginTop: `${spacingConfig.verticalHierarchy}px` }}
      >
        {tlData.length > 0 ? (
          <Boundary type="TL">
            <div className={`${LAYOUTS.FLEX.COLUMN} items-center`}>
              {tlData.map((tl, index) => (
                <div 
                  key={index} 
                  className={`${LAYOUTS.FLEX.COLUMN} items-center`}
                >
                  <PositionBox 
                    title="TL" 
                    subtitle={tl} 
                    level={3} 
                    colorCategory={getColorCategory(title, 'TL', tl)} 
                  />
                  <div 
                    className={`${LAYOUTS.FLEX.COLUMN} items-center`} 
                    style={{ 
                      gap: `${spacingConfig.innerCategory}px`,
                      marginTop: `${spacingConfig.verticalHierarchy}px`
                    }}
                  >
                    {tmData[index]?.map((tmItem, tmIndex) => (
                      <PositionBox 
                        key={tmIndex} 
                        title={getTMTitle(tmItem)} 
                        subtitle={tmItem} 
                        level={4} 
                        colorCategory={getColorCategory(title, 'TM', tmItem)} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Boundary>
        ) : (
          <div>
            {/* TL이 없는 경우에도 TL 영역만큼의 공간 확보 */}
            <div style={{ 
              height: '120px',  // TL 박스 높이(64px) + 상하 패딩(28px * 2)
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }} />
            
            {/* TM 영역 */}
            <div 
              className={`${LAYOUTS.FLEX.COLUMN} items-center`} 
              style={{ 
                gap: `${spacingConfig.innerCategory}px`,
                marginTop: `${spacingConfig.verticalHierarchy}px`
              }}
            >
              {tmData.map((tmArr, index) => (
                <div key={index} className={`${LAYOUTS.FLEX.COLUMN} items-center`}>
                  {tmArr.map((tmItem, tmIndex) => (
                    <PositionBox 
                      key={tmIndex} 
                      title={getTMTitle(tmItem)} 
                      subtitle={tmItem} 
                      level={4} 
                      colorCategory={getColorCategory(title, 'TM', tmItem)} 
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // === 색상 카테고리 결정 함수 ===
  const getColorCategory = (
    deptTitle: string | string[], 
    position: 'GL' | 'TL' | 'TM', 
    subtitle?: string
  ): 'direct' | 'indirect' | 'OH' => {
    const deptName = Array.isArray(deptTitle) ? deptTitle[0] : deptTitle;
    
    // OH 색상이 되어야 할 조건들
    // 1. Admin-TM전체 (Admin은 GL이 없으므로 GL일 때도 포함)
    if (deptName === "Admin" && (position === "TM" || position === "GL")) {
      return "OH";
    }
    
    // 2. Small Tooling: GL/TL/TM
    if (deptName === "Small Tooling" && (position === "GL" || position === "TL" || position === "TM")) {
      return "OH";
    }
    
    // 3. Sub Material: GL/TL/TM
    if (deptName === "Sub Material" && (position === "GL" || position === "TL" || position === "TM")) {
      return "OH";
    }
    
    // 4. FG WH: shipping TM 만
    if (deptName === "FG WH" && position === "TM" && subtitle?.includes("Shipping")) {
      return "OH";
    }
    
    // 5. Plant Production: TM (직접 생산 관련)
    if (deptName === "Plant Production" && position === "TM") {
      return "direct";
    }
    
    // 나머지는 모두 indirect
    return "indirect";
  };

  // 간격 설정 패널 렌더링 (비활성화)
  const renderSpacingPanel = () => {
    return null; // 공통 spacing 설정 사용으로 개별 조정 비활성화
  };

  // === (G) 실제 JSX 반환 ===
  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative">
      {/* ReactFlow 조직도 */}
      <ReactFlowPage2 onInit={(inst) => setRfInstance(inst)} />

      {/* 색상 범례 - 오른쪽 상단 */}
      <div className="fixed right-8 top-8 flex flex-row gap-2 z-50">
        <div className="bg-gray-50 border border-gray-300 px-4 py-2 rounded-lg shadow-sm">
          <span className="text-sm font-semibold text-black">Direct</span>
        </div>
        <div className="bg-gray-200 border border-gray-400 px-4 py-2 rounded-lg shadow-sm">
          <span className="text-sm font-semibold text-black">Indirect</span>
        </div>
        <div className="bg-gray-400 border border-gray-500 px-4 py-2 rounded-lg shadow-sm">
          <span className="text-sm font-semibold text-black">OH</span>
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

      {/* 설정 & 인원 합계 패널 - 오른쪽 하단 */}
      <div className="fixed right-8 bottom-8 flex flex-row gap-4 z-50 items-end">
        {/* 라인 수 설정 */}
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 self-end">
          <div className="flex items-center gap-4">
            <label className="flex flex-col">
              <span className="text-sm font-semibold">라인 수</span>
              <input
                type="number"
                className="w-16 border p-1 rounded"
                value={config.lineCount}
                min="1"
                max="8"
                onChange={(e) => {
                  const value = Math.max(1, Math.min(8, parseInt(e.target.value) || 1));
                  updateConfig({ ...config, lineCount: value });
                }}
              />
            </label>
          </div>
        </div>

        {/* 인원 합계 */}
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 self-end">
          <div className="space-y-2">
            {/* GL */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">GL:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {totalGL}
              </div>
            </div>
            {/* TL */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">TL:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {totalTL}
              </div>
            </div>
            {/* TM */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">TM:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {totalTM}
              </div>
            </div>
            {/* 총합 */}
            <div className="pt-2 mt-2 border-t flex items-center justify-between">
              <span className="font-semibold">총합:</span>
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

export default Page2;
