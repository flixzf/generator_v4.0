"use client";
import React, { useState } from "react";
import { useOrgChart } from "@/context/OrgChartContext";
import { ReactFlowPage2 } from "@/components/common/reactflow/ReactFlowPage2";
import { ReactFlowInstance } from 'reactflow';

// === Page2 컴포넌트 ===
const Page2: React.FC = () => {
  const { config, updateConfig } = useOrgChart();

  // === 확대/축소 관련 ===
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

  const handleZoomIn = () => rfInstance?.zoomIn?.({ duration: 300 });
  const handleZoomOut = () => rfInstance?.zoomOut?.({ duration: 300 });
  const handleZoomReset = () => rfInstance?.fitView?.({ duration: 300 });

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