"use client";
import React from 'react';
import { useOrgChart } from '@/context/OrgChartContext';

export default function Page4Direct() {
  const { models, config, lineModelSelections } = useOrgChart();

  // 각 라인의 소계 계산
  const calculateSubtotal = (processes: any[]) => {
    return processes.reduce((acc, process) => {
      acc.manStt += process.manStt || 0;
      acc.manAsy += process.manAsy || 0;
      return acc;
    }, { manStt: 0, manAsy: 0 });
  };

  // 전체 합계 계산
  const calculateTotal = () => {
    let totalManStt = 0;
    let totalManAsy = 0;

    // 설정된 라인 수만큼 반복
    for (let i = 0; i < config.lineCount; i++) {
      const modelIndex = lineModelSelections[i] || 0; // 각 라인에 할당된 모델 인덱스
      const model = models[modelIndex];
      if (model) {
        const subtotal = calculateSubtotal(model.processes);
        totalManStt += subtotal.manStt;
        totalManAsy += subtotal.manAsy;
      }
    }

    return { totalManStt, totalManAsy };
  };

  const total = calculateTotal();

  // lineModelSelections가 준비되었는지 확인
  if (!lineModelSelections || lineModelSelections.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Total Headcount  - Direct</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-slate-600 text-white">
            <tr>
              <th className="border p-1">Line</th>
              <th className="border p-1">Category</th>
              <th className="border p-1">Model</th>
              <th className="border p-1">Style No.</th>
              <th className="border p-1">Process</th>
              <th className="border p-1">Man stt</th>
              <th className="border p-1">Man asy</th>
              <th className="border p-1">Mini Line</th>
              <th className="border p-1">Shift</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: config.lineCount }).map((_, lineIndex) => {
              const modelIndex = lineModelSelections[lineIndex] || 0;
              const model = models[modelIndex];
              if (!model) return null;

              const subtotal = calculateSubtotal(model.processes);

              return (
                <React.Fragment key={`line-${lineIndex}`}>
                  {model.processes.map((process, processIndex) => (
                    <tr 
                      key={`${model.styleNo}-${process.name}-${lineIndex}`} 
                      className={lineIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}
                    >
                      {processIndex === 0 && (
                        <>
                          <td className="border p-1" rowSpan={model.processes.length}>
                            {lineIndex + 1}
                          </td>
                          <td className="border p-1" rowSpan={model.processes.length}>
                            {model.category}
                          </td>
                          <td className="border p-1" rowSpan={model.processes.length}>
                            {model.modelName}
                          </td>
                          <td className="border p-1" rowSpan={model.processes.length}>
                            {model.styleNo}
                          </td>
                        </>
                      )}
                      <td className="border p-1">{process.name}</td>
                      <td className="border p-1 text-center">{process.manStt.toFixed(1)}</td>
                      <td className="border p-1 text-center">{process.manAsy.toFixed(1)}</td>
                      <td className="border p-1 text-center">{process.miniLine}</td>
                      <td className="border p-1 text-center">{process.shift}</td>
                    </tr>
                  ))}
                  {/* Sub Total Row */}
                  <tr className="bg-gray-200 font-bold">
                    <td colSpan={5} className="border p-1 text-right">
                      SUB TOTAL (Line {lineIndex + 1})
                    </td>
                    <td className="border p-1 text-center">{subtotal.manStt.toFixed(1)}</td>
                    <td className="border p-1 text-center">{subtotal.manAsy.toFixed(1)}</td>
                    <td colSpan={2} className="border p-1"></td>
                  </tr>
                </React.Fragment>
              );
            })}
            {/* Grand Total Row */}
            <tr className="bg-slate-300 font-extrabold">
              <td colSpan={5} className="border p-1 text-right">GRAND TOTAL</td>
              <td className="border p-1 text-center">{total.totalManStt.toFixed(1)}</td>
              <td className="border p-1 text-center">{total.totalManAsy.toFixed(1)}</td>
              <td colSpan={2} className="border p-1"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}