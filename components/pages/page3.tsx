"use client";
import React, { useState, useEffect, useRef } from "react";
import { useOrgChart } from "@/context/OrgChartContext";
import { ReactFlowPage3 } from "@/components/common/reactflow/ReactFlowPage3";
import { makeDoubleLines } from "@/components/common/utils";
import { ReactFlowInstance } from 'reactflow';

const Page3: React.FC = () => {
  const { config, updateConfig } = useOrgChart();

  // === 확대/축소 관련 ===
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const handleZoomIn = () => rfInstance?.zoomIn?.({ duration: 300 });
  const handleZoomOut = () => rfInstance?.zoomOut?.({ duration: 300 });
  const handleZoomReset = () => rfInstance?.fitView?.({ duration: 300 });


  // Use centralized line utilities

  // === 인원 수 계산 함수 ===
  const calculatePositionCount = (position: string): number => {
    let total = 0;
    
    const L = config.lineCount;
    const G = config.gateCount;
    const P = config.qaPrs ?? 2400;

    const qaTmPerLine = (p: number) => {
      if (p <= 900) return 1;
      if (p <= 2000) return 2;
      if (p <= 2400) return 3;
      return 4;
    };

    // MA TM 총합 (2212221 반복)
    const maPattern = [2, 2, 1, 2, 2, 2, 1];
    let maTotal = 0;
    for (let i = 0; i < L; i++) maTotal += maPattern[i % maPattern.length];

    // CE
    const ceTotal = Math.ceil(L / 2);
    const ceTLs = L >= 1 ? ["CE"] : [];
    const ceTMs = Math.max(0, ceTotal - 1);

    // TPM
    const tpmTLs: string[] = [];
    if (L >= 3) tpmTLs.push("Stitching");
    tpmTLs.push("Cutting & Stockfit·Assembly");
    tpmTLs.push("No-sew/HF/Cutting");

    const tpmStitchingTM = (L <= 4 ? L : 4 + Math.ceil((L - 4) / 2));
    const tpmCSATM = (L <= 5 ? (L - 1) : 4 + Math.ceil((L - 5) / 2));
    const noSewTm = (L === 1 ? 0 : L === 2 ? 1 : L === 3 ? 2 : 2 + Math.floor((L - 3) / 2));
    const cmmsTm = (L < 4 ? 0 : 1 + Math.floor((L - 4) / 8));
    const tpmTotalTM = tpmStitchingTM + tpmCSATM + noSewTm + cmmsTm;

    // CQM
    const cqmTLCount = Math.ceil(L / 8);

    // Lean
    const leanTLCount = Math.ceil(L / 4);

    // page3의 부서들 직접 계산 (ReactFlowPage3.tsx와 동기화)
    const page3DepartmentCounts = {
      Quality: {
        GL: Math.ceil(L / 2),
        TL: L, // QA Line 1, 2, ... (라인당 1개)
        TM: (L * qaTmPerLine(P)) + maTotal + 1 // QA TM + MA + BNP-MDP
      },
      CE: {
        GL: 0,
        TL: ceTLs.length,
        TM: ceTMs
      },
      TPM: {
        GL: 1,
        TL: tpmTLs.length,
        TM: tpmTotalTM
      },
      CQM: {
        GL: 0,
        TL: cqmTLCount,
        TM: 0
      },
      Lean: {
        GL: 0,
        TL: leanTLCount,
        TM: 0
      },
      Security: {
        GL: 0,
        TL: 0,
        TM: G
      },
      RMCC: {
        GL: 0,
        TL: 0,
        TM: 1
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

      {/* 인원 요약 정보 패널 - 오른쪽 상단 */}
      <div className="fixed right-8 top-24 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-50">
        <div className="font-semibold text-lg mb-2">인원 요약</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">GL:</span>
            <span>{calculatePositionCount("GL")}명</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">TL:</span>
            <span>{calculatePositionCount("TL")}명</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">TM:</span>
            <span>{calculatePositionCount("TM")}명</span>
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

      {/* 설정 패널 - 오른쪽 하단 */}
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
      </div>


    </div>
  );
};

export default Page3;