"use client";
import React, { useState, useEffect, useRef } from "react";
import { useOrgChart } from "@/context/OrgChartContext";
import { ReactFlowPage3 } from "@/components/common/ReactFlowPage3";
import { makeDoubleLines } from "@/components/common/LineUtils";
import { ReactFlowInstance } from 'reactflow';

const Page3: React.FC = () => {
  const { config, updateConfig } = useOrgChart();

  // === 확대/축소 & 패닝(드래그) 관련 ===
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => rfInstance?.zoomIn?.({ duration: 300 });
  const handleZoomOut = () => rfInstance?.zoomOut?.({ duration: 300 });
  const handleZoomReset = () => rfInstance?.fitView?.({ duration: 300 });

  const handleMouseDown = (e: React.MouseEvent) => {
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

  // Use centralized line utilities

  // === 인원 수 계산 함수 ===
  const calculatePositionCount = (position: string): number => {
    let total = 0;
    
    // page3의 부서들 직접 계산
    const page3DepartmentCounts = {
      Quality: {
        GL: 1,
        TL: 2, // QA, MA
        TM: (config.lineCount * 4) + 3 + 1 // QA TM (라인당 4명) + HEPA MA검사 3명 + MQAA Audit 1명
      },
      CE: {
        GL: 1,
        TL: 2, // Mixing, Assembly Control
        TM: Math.ceil(config.lineCount / 2) * 2 // 2개 라인당 1명씩 두 그룹
      },
      TPM: {
        GL: 1,
        TL: 3, // Stitching, Cutting & Stockfit·Assembly, CMMS & Electricity
        TM: 6 // Stitching 2명 + Cutting 2명 + Tech 2명
      },
      CQM: {
        GL: 1,
        TL: 0,
        TM: 0
      },
      Lean: {
        GL: 1,
        TL: 0,
        TM: Math.ceil(config.lineCount / 2) // 2개 라인당 1명
      },
      Security: {
        GL: 0,
        TL: 0,
        TM: config.gateCount // 게이트 수만큼
      },
      RMCC: {
        GL: 0,
        TL: 0,
        TM: 1 // Solid Waste 1명
      }
    };
    
    // 각 부서별 계산
    Object.values(page3DepartmentCounts).forEach(dept => {
      if (position === "GL") {
        total += dept.GL;
      } else if (position === "TL") {
        total += dept.TL;
      } else if (position === "TM") {
        total += dept.TM;
      }
    });
    
    return total;
  };

  const totalPeople = ["GL", "TL", "TM"].reduce(
    (acc, pos) => acc + calculatePositionCount(pos),
    0
  );

  // === 메인 렌더링 ===
  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative">
      {/* ReactFlow 조직도 - 전체 화면 */}
      <ReactFlowPage3 onInit={(inst) => setRfInstance(inst)} />
      
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

      {/* 모든 컨트롤 패널을 오른쪽 하단에 수평으로 배치 */}
      <div className="fixed right-8 bottom-8 flex flex-row gap-4 z-50 items-end">
        {/* 기본 설정 패널 */}
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 self-end">
          <div className="flex items-center gap-4">
            <label className="flex flex-col">
              <span className="text-sm font-semibold">라인 수</span>
              <input
                type="number"
                className="w-16 border p-1 rounded"
                value={config.lineCount}
                min="1"
                max="5"
                onChange={(e) => {
                  const value = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                  updateConfig({ ...config, lineCount: value });
                }}
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm font-semibold">게이트 수</span>
              <input
                type="number"
                className="w-16 border p-1 rounded"
                value={config.gateCount}
                min="1"
                max="20"
                onChange={(e) => {
                  const value = Math.max(1, Math.min(20, parseInt(e.target.value) || 1));
                  updateConfig({ ...config, gateCount: value });
                }}
              />
            </label>
          </div>
        </div>

        {/* 인원 합계창 */}
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 self-end">
          <div className="space-y-2">
            {/* GL */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">GL:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {calculatePositionCount("GL")}
              </div>
            </div>
            {/* TL */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">TL:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {calculatePositionCount("TL")}
              </div>
            </div>
            {/* TM */}
            <div className="flex items-center justify-between">
              <span className="font-semibold">TM:</span>
              <div className="bg-gray-100 px-3 py-0.5 rounded">
                {calculatePositionCount("TM")}
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

export default Page3;