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

  const pageOptions = [
    { value: "1", group: "Organization Structure", label: "Production Line" },
    { value: "2", group: "Organization Structure", label: "Production Plant" },
    { value: "3", group: "Organization Structure", label: "Support Department" },
    { value: "4-indirect", group: "Total Headcount", label: "Indirect + Overhead" },
    { value: "4-direct", group: "Total Headcount", label: "Direct" },
    { value: "5", group: "DB", label: "IE Report" },
  ];

  return (
    <div className="p-4">
      <OrgChartProvider>
        <div className="p-4">
          {/* 페이지 선택 드롭다운 */}
          <select
            onChange={(e) => setCurrentPage(e.target.value)}
            value={currentPage}
            className="mb-4 p-3 border border-gray-400 rounded font-mono"
          >
            {pageOptions.map((opt, index) => {
              // Check if this is the first occurrence of this group
              const isFirstInGroup = index === 0 || pageOptions[index - 1].group !== opt.group;

              // For display in dropdown: hide group label for non-first items
              const dropdownText = isFirstInGroup
                ? `${'\u00A0'.repeat(27 - opt.group.length)}${opt.group} - ${opt.label}`
                : `${'\u00A0'.repeat(27)} - ${opt.label}`;

              return (
                <option key={opt.value} value={opt.value}>
                  {dropdownText}
                </option>
              );
            })}
          </select>

          {renderCurrentPage()}
        </div>
      </OrgChartProvider>
    </div>
  );
}
