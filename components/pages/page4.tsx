"use client";
import React from "react";
import { useOrgChart } from "@/context/OrgChartContext";

export default function Page4() {
  // 부서명 매핑 (표시용 이름 -> Context의 키값)
  const deptMapping = {
    "Line": "Line",
    "Admin": "Admin",
    "Small Tooling": "SmallTooling",
    "Raw Material": "RawMaterial",
    "Sub Material": "SubMaterial",
    "ACC": "ACC",
    "P&L": "PL",
    "Bottom Market": "BottomMarket",
    "FG WH": "FGWH"
  } as const;

  const deptNames = [
    "Line",
    "Admin",
    "Small Tooling",
    "Raw Material",
    "Sub Material",
    "ACC",
    "P&L",
    "Bottom Market",
    "FG WH",
  ] as const;

  // In-Line과 Out-Line 카테고리 정의
  const inLineDepts = ["Line"];
  const outLineDepts = ["Admin", "Small Tooling", "Raw Material", "Sub Material", "ACC", "P&L", "Bottom Market", "FG WH"];

  const levels = ["MGL", "VSM", "GL", "TL", "TM"] as const;
  const { departments } = useOrgChart();

  // 직급별 총합 계산 (MGL은 중복 제거하여 1명만)
  const getLevelSum = (level: typeof levels[number]): string => {
    if (level === "MGL") {
      return "1"; // MGL은 전체에서 1명만
    }
    const sum = Object.values(departments).reduce((sum, dept) => sum + (dept[level] || 0), 0);
    return sum > 0 ? sum.toString() : "";
  };

  // 부서별 총합 계산
  const getDepartmentSum = (deptName: typeof deptNames[number]): string => {
    const dept = departments[deptMapping[deptName]];
    if (!dept) return "";
    const sum = levels.reduce((sum, level) => sum + (dept[level] || 0), 0);
    return sum > 0 ? sum.toString() : "";
  };

  // 특정 부서의 특정 직급 인원수 가져오기
  const getPositionCount = (deptName: typeof deptNames[number], level: typeof levels[number]): string => {
    // Line 부서의 MGL은 표시하지 않음 (중복 제거)
    if (deptName === "Line" && level === "MGL") {
      return "";
    }
    
    const count = departments[deptMapping[deptName]]?.[level] || 0;
    return count > 0 ? count.toString() : "";
  };

  // 전체 총합 계산 (MGL은 1명만 계산)
  const totalSum = levels.reduce((sum, level) => {
    if (level === "MGL") {
      return sum + 1; // MGL은 1명만
    }
    return sum + Object.values(departments).reduce((deptSum, dept) => deptSum + (dept[level] || 0), 0);
  }, 0);

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            {/* 카테고리 행 (In-Line / Out-Line) */}
            <tr>
              <th className="border bg-slate-600 text-white p-2" rowSpan={2}>Level</th>
              <th className="border bg-slate-600 text-white p-2" rowSpan={2}>SUM</th>
              <th className="border bg-slate-600 text-white p-2" colSpan={inLineDepts.length}>In-Line</th>
              <th className="border bg-slate-600 text-white p-2" colSpan={outLineDepts.length}>Out-Line</th>
            </tr>
            {/* 부서명 행 */}
            <tr>
              {inLineDepts.map((dept, index) => (
                <th key={`in-${index}`} className="border bg-slate-600 text-white p-2">
                  {dept}
                </th>
              ))}
              {outLineDepts.map((dept, index) => (
                <th key={`out-${index}`} className="border bg-slate-600 text-white p-2">
                  {dept}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {levels.map((level, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="border p-2 font-semibold">{level}</td>
                <td className="border p-2 text-center">{getLevelSum(level)}</td>
                {deptNames.map((dept) => (
                  <td key={dept} className="border p-2 text-center">
                    {getPositionCount(dept, level)}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-gray-100 font-bold">
              <td className="border p-2">TOTAL</td>
              <td className="border p-2 text-center">{totalSum}</td>
              {deptNames.map((dept) => (
                <td key={dept} className="border p-2 text-center">
                  {getDepartmentSum(dept)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
