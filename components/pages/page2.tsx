"use client";
import React, { useState, useMemo } from "react";
import { useOrgChart } from "@/context/OrgChartContext";
import { ReactFlowPage2 } from "@/components/common/reactflow/ReactFlowPage2";
import { ReactFlowInstance } from 'reactflow';
import { makeDoubleLines } from "@/components/common/utils";

// === Page2 컴포넌트 ===
const Page2: React.FC = () => {
  const { config, updateConfig } = useOrgChart();

  // === 확대/축소 관련 ===
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const handleZoomIn = () => rfInstance?.zoomIn?.({ duration: 300 });
  const handleZoomOut = () => rfInstance?.zoomOut?.({ duration: 300 });
  const handleZoomReset = () => rfInstance?.fitView?.({ duration: 300 });

  // === 인원 계산 ===
  const positionCounts = useMemo(() => {
    const L = config.lineCount;

    // Admin TM 계산
    let personnelCount = L >= 5 ? 2 : 1;
    let productionCount = L >= 2 ? (L >= 7 ? 2 : 1) : 0;
    let isqCount = L >= 3 ? 1 : 0;
    const adminTMCount = personnelCount + productionCount + isqCount;

    // Small Tooling TM 계산
    const smallToolingTMCount = Math.max(0, L - 1);

    // Market TM 계산
    let subMaterialCount = L >= 7 ? 4 : (L >= 5 ? 3 : (L >= 3 ? 2 : 1));
    let rawMaterialTMCount = L >= 7 ? 5 : (L >= 6 ? 4 : (L >= 5 ? 3 : (L >= 3 ? 2 : (L >= 2 ? 1 : 0))));
    let accMarketCount = L >= 7 ? 4 : (L >= 5 ? 3 : (L >= 3 ? 2 : 1));

    let bottomMarketTMCount = 0;
    if (L === 1) bottomMarketTMCount = 2;
    else if (L === 2) bottomMarketTMCount = 3;
    else if (L === 3) bottomMarketTMCount = 4;
    else if (L === 4) bottomMarketTMCount = 5;
    else if (L === 5) bottomMarketTMCount = 6;
    else if (L === 6) bottomMarketTMCount = 7;
    else if (L === 7) bottomMarketTMCount = 8;
    else bottomMarketTMCount = 9;

    const marketTMCount = subMaterialCount + rawMaterialTMCount + accMarketCount + bottomMarketTMCount;

    // Plant Production TM 계산
    const plantProductionTMCount = makeDoubleLines(L).length * 2; // Input + Output

    // FG WH/P&L Market TM 계산
    let stencilCount = L >= 7 ? 4 : (L >= 5 ? 3 : (L >= 3 ? 2 : 1));
    const coLabelCount = 1;
    let boxCount = L >= 7 ? 4 : (L >= 5 ? 3 : (L >= 3 ? 2 : 1));
    let paperCount = L >= 7 ? 4 : (L >= 5 ? 3 : (L >= 3 ? 2 : 1));
    let shippingCount = L >= 7 ? 6 : (L >= 6 ? 5 : (L >= 5 ? 4 : (L >= 3 ? 3 : (L >= 2 ? 2 : 1))));
    const incomingSettingCount = L;
    const scanSystemReportCount = 1;
    const fgwhPnlMarketTMCount = stencilCount + coLabelCount + boxCount + paperCount + shippingCount + incomingSettingCount + scanSystemReportCount;

    // 총 TM 수
    const totalTM = adminTMCount + smallToolingTMCount + marketTMCount + plantProductionTMCount + fgwhPnlMarketTMCount;

    // GL 수 (Market, FG WH/P&L Market만 GL 있음)
    const totalGL = 2; // Market GL 1개 + FG WH/P&L Market GL 1개

    // TL 수
    const totalTL = 1 + 2 + 2; // Small Tooling 1개 + Market 2개 (Upper/Bottom) + FG WH/P&L 2개 (P&L/FG WH)

    return {
      GL: totalGL,
      TL: totalTL,
      TM: totalTM
    };
  }, [config.lineCount]);

  const totalPeople = positionCounts.GL + positionCounts.TL + positionCounts.TM;

  // === JSX 반환 ===
  return (
    <div className="h-screen w-screen overflow-hidden bg-white relative">
      {/* ReactFlow 조직도 */}
      <ReactFlowPage2 onInit={(inst) => setRfInstance(inst)} />

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

      {/* 줌 컨트롤 - 왼쪽 상단 */}
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
      </div>
    </div>
  );
};

export default Page2;