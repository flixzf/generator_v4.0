"use client";
import React, { useState } from "react";
import Page1 from "../components/pages/page1";
import Page2 from "../components/pages/page2";
import Page3 from "../components/pages/page3";
import Page4Direct from "../components/pages/page4-direct";
import Page4Indirect from "../components/pages/page4-indirect";
import Page5 from "../components/pages/page5";
import { OrgChartProvider } from "@/context/OrgChartContext";

export default function OrgChartPage() {
  const [currentPage, setCurrentPage] = useState("1");

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "1":
        return <Page1 />;
      case "2":
        return <Page2 />;
      case "3":
        return <Page3 />;
      case "4-direct":
        return <Page4Direct />;
      case "4-indirect":
        return <Page4Indirect />;
      case "5":
        return <Page5 />;
      default:
        return <Page1 />;
    }
  };

  return (
    <div className="p-4">
      <OrgChartProvider>
        <div className="p-4">
          {/* 페이지 선택 드롭다운 */}
          <select
            onChange={(e) => setCurrentPage(e.target.value)}
            value={currentPage}
            className="mb-4 p-3 border rounded"
          >
            <option value="1">Line</option>
            <option value="2">Plant</option>
            <option value="3">Support Department</option>
            <option value="4-direct">Aggregation-Direct</option>
            <option value="4-indirect">Aggregation-Indirect+OH</option>
            <option value="5">Model-based Manpower Setting</option>
          </select>

          {renderCurrentPage()}
        </div>
      </OrgChartProvider>
    </div>
  );
}
