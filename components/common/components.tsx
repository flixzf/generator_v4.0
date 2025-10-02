/**



 * ?�� Common UI Components



 * 박스?� ?�드 컴포?�트?�을 ?�합 관�?



 */

import React from "react";

import { Handle, Position } from "reactflow";

import {
  getBoxStyle,
  getLegendItemStyle,
  getLegendTextStyle,
  ColorCategory,
  LAYOUT,
} from "./theme";

// === 기본 Position Box ===

interface PositionBoxProps {
  title: string;

  subtitle?: string;

  level: number;

  className?: string;

  colorCategory?: ColorCategory;
}

export const PositionBox: React.FC<PositionBoxProps> = ({
  title,

  subtitle,

  level,

  className = "",

  colorCategory,
}) => {
  const boxStyle = getBoxStyle(colorCategory);

  return (
    <div className={`${boxStyle} ${className}`}>
      <div className="text-center">
        <div className="font-bold">{title}</div>

        {subtitle && <div className="text-sm">{subtitle}</div>}
      </div>
    </div>
  );
};

// === ReactFlow Custom Node ===

interface CustomPositionNodeProps {
  data: {
    title: string;

    subtitle?: string;

    level: "VSM" | "A.VSM" | "GL" | "TL" | "PART" | "TM" | "DEPT";

    colorCategory?: ColorCategory;

    showHandles?: boolean;

    minHeight?: number;

    isPartLabel?: boolean;
  };
}

export const CustomPositionNode: React.FC<CustomPositionNodeProps> = ({
  data,
}) => {
  const {
    title,

    subtitle,

    level,

    colorCategory,

    showHandles = true,

    minHeight = 60,

    isPartLabel = false,
  } = data;

  let bgColor = "bg-gray-100";

  let borderColor = "border-gray-300";

  let textColor = "text-black";

  const isDept = level === "DEPT";

  // DEPT 레벨은 별도의 진한 회색 스타일 적용
  if (isDept) {
    bgColor = "bg-gray-600";
    borderColor = "border-3 border-gray-700";
    textColor = "text-white";
  } else if (!isPartLabel && colorCategory) {
    switch (colorCategory) {
      case "direct":
        bgColor = "bg-gray-50";

        borderColor = "border-2 border-dashed border-gray-400";

        break;

      case "indirect":
        bgColor = "bg-gray-200";

        borderColor = "border-gray-400";

        break;

      case "OH":
        bgColor = "bg-gray-400";

        borderColor = "border-gray-500";

        break;
    }
  }

  const nodeMinHeight = isDept ? 40 : minHeight;

  const shouldShowHandles = !isPartLabel && showHandles;

  const classNames = [LAYOUT.FLEX.center, "text-center", "font-medium"];

  let style = {} as React.CSSProperties;

  if (isPartLabel) {
    classNames.push(
      "bg-transparent",
      "border-none",
      "shadow-none",
      "px-0",
      "py-0",
      "text-gray-800",
      "font-semibold",
      "pointer-events-none",
      "whitespace-nowrap",
    );

    style = {
      width: "auto",
      height: "auto",
      padding: 0,
      transform: "translate(-50%, 36px)",
      textAlign: "center",
      pointerEvents: "none",
    };
  } else {
    classNames.push(
      bgColor,
      borderColor,
      textColor,
      "border",
      "rounded",
      "px-2",
      "py-1",
    );

    style = {
      minHeight: `${nodeMinHeight}px`,

      width: "160px",

      height: "64px",

      padding: "8px",
    };
  }

  return (
    <div className={classNames.join(" ")} style={style}>
      {shouldShowHandles && (
        <>
          <Handle
            type="target"
            position={Position.Top}
            style={{ background: "#666", width: 8, height: 8 }}
          />

          <Handle
            type="source"
            position={Position.Bottom}
            style={{ background: "#666", width: 8, height: 8 }}
          />
        </>
      )}

      <div>
        <div
          className={`font-bold ${isDept ? "text-base" : "text-sm"} leading-tight${isPartLabel ? " text-gray-800" : ""}`}
        >
          {title}
        </div>

        {!isPartLabel && subtitle && (
          <div className={`${isDept ? "text-sm font-bold" : "text-xs"} mt-1 leading-tight`}>{subtitle}</div>
        )}
      </div>
    </div>
  );
};

// === Custom Edge};

// === Custom Edge (?�결Reset ===

interface CustomCenterYEdgeProps {
  id: string;

  sourceX: number;

  sourceY: number;

  targetX: number;

  targetY: number;

  data?: {
    centerY?: number;

    offset?: number;
  };
}

export const CustomCenterYEdge: React.FC<CustomCenterYEdgeProps> = ({
  sourceX,

  sourceY,

  targetX,

  targetY,

  data,
}) => {
  const centerY = data?.centerY || (sourceY + targetY) / 2;

  const offset = data?.offset || 24;

  // 꺾이Reset경로 계산

  const pathData = [
    `M ${sourceX} ${sourceY}`,

    `L ${sourceX} ${centerY - 2}`,

    `Q ${sourceX} ${centerY} ${sourceX + (targetX > sourceX ? 2 : -2)} ${centerY}`,

    `L ${targetX + (targetX > sourceX ? -2 : 2)} ${centerY}`,

    `Q ${targetX} ${centerY} ${targetX} ${centerY + 2}`,

    `L ${targetX} ${targetY}`,
  ].join(" ");

  return (
    <path
      d={pathData}
      fill="none"
      stroke="#666"
      strokeWidth={2}
      className="react-flow__edge-path"
    />
  );
};

// === 컨트�?버튼Reset===

interface ZoomControlsProps {
  onZoomIn: () => void;

  onZoomOut: () => void;

  onZoomReset: () => void;

  className?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,

  onZoomOut,

  onZoomReset,

  className = "",
}) => {
  const buttonClass =
    "bg-white border border-gray-300 px-3 py-2 rounded shadow hover:bg-gray-50";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button onClick={onZoomIn} className={buttonClass}>
        Zoom +
      </button>

      <button onClick={onZoomOut} className={buttonClass}>
        Zoom -
      </button>

      <button onClick={onZoomReset} className={buttonClass}>
        Reset
      </button>
    </div>
  );
};

// === ?�상 범�? ===

export const ColorLegend: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const legendItems: { category: ColorCategory; label: string }[] = [
    { category: "direct", label: "Direct" },

    { category: "indirect", label: "Indirect" },

    { category: "OH", label: "OH" },
  ];

  return (
    <div className={`flex flex-row gap-2 ${className}`}>
      {legendItems.map(({ category, label }) => (
        <div key={category} className={getLegendItemStyle(category)}>
          <span className={getLegendTextStyle()}>{label}</span>
        </div>
      ))}
    </div>
  );
};

// === ?�인 Reset?�정 ?�널 ===

interface LineCountConfigProps {
  value: number;

  onChange: (value: number) => void;

  min?: number;

  max?: number;

  className?: string;
}

export const LineCountConfig: React.FC<LineCountConfigProps> = ({
  value,

  onChange,

  min = 1,

  max = 8,

  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Math.max(
      min,
      Math.min(max, parseInt(e.target.value) || min),
    );

    onChange(newValue);
  };

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-lg border border-gray-200 ${className}`}
    >
      <div className="flex items-center gap-4">
        <label className="flex flex-col">
          <span className="text-sm font-semibold">Line Count</span>

          <input
            type="number"
            className="w-16 border p-1 rounded"
            value={value}
            min={min}
            max={max}
            onChange={handleChange}
          />
        </label>
      </div>
    </div>
  );
};

// === ReactFlow node types ===

export const nodeTypes = {
  customPosition: CustomPositionNode,
};

// === ReactFlow edge types ===

export const edgeTypes = {
  customCenterY: CustomCenterYEdge,
};
