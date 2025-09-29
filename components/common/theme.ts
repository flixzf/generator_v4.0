/**
 * Unified Theme Configuration
 * Centralizes colors, spacing, and shared styles for the org chart UI.
 */

export type ColorCategory = "direct" | "indirect" | "OH";

export const COLORS = {
  // 吏곸젒/媛꾩젒/OH Color 泥닿퀎
  CATEGORIES: {
    direct: {
      bg: "bg-white",
      border: "border-gray-300 border-dashed",
      text: "text-black",
    },
    indirect: {
      bg: "bg-gray-200",
      border: "border-gray-400",
      text: "text-black",
    },
    OH: {
      bg: "bg-gray-400",
      border: "border-gray-500",
      text: "text-black",
    },
  },

  // 湲곕낯 Color ?붾젅??
  BACKGROUNDS: {
    primary: "bg-white",
    secondary: "bg-gray-50",
    tertiary: "bg-gray-100",
  },

  BORDERS: {
    default: "border border-gray-300",
    light: "border border-gray-200",
    dark: "border border-gray-500",
  },
} as const;

// === 媛꾧꺽 ?ㅼ젙 ===
export const SPACING = {
  // 怨꾩링媛?媛꾧꺽 (GL-TL-TM)
  HIERARCHY: {
    vertical: 120, // ?덈꺼媛??몃줈 媛꾧꺽
    between: 80, // TM ?몃줈 ?ㅽ깮 媛꾧꺽
  },

  // 遺??移댄뀒怨좊━媛?媛꾧꺽
  DEPARTMENT: {
    horizontal: 160, // ?쒖? 媛濡?媛꾧꺽
    compact: 67, // ?뺤텞 媛濡?媛꾧꺽 (Page2)
    gutter: -50, // 遺?쒓컙 ?щ갚
  },

  // Tailwind ?대옒??
  CLASSES: {
    gaps: {
      small: "gap-2",
      medium: "gap-4",
      large: "gap-8",
      xlarge: "gap-16",
    },
    margins: {
      hierarchy: "mt-3",
      category: "gap-2",
    },
  },
} as const;

// === 諛뺤뒪 ?ш린 ?ㅼ젙 ===
export const BOX = {
  SIZES: {
    standard: {
      width: 192, // w-48
      height: 80, // h-20
    },
    node: {
      height: 60,
      padding: 16,
      total: 76, // height + padding
    },
    dept: {
      height: 40,
      padding: 16,
      total: 56, // height + padding
    },
  },

  CLASSES: {
    base: "border rounded flex flex-col justify-center items-center m-2",
    standard: "w-48 h-20",
    interactive: "hover:shadow-lg transition-shadow",
  },
} as const;

// === ?덉씠?꾩썐 ?ㅽ???===
export const LAYOUT = {
  FLEX: {
    center: "flex items-center justify-center",
    column: "flex flex-col",
    row: "flex flex-row",
    between: "flex justify-between",
  },

  POSITION: {
    relative: "relative",
    absolute: "absolute",
    fixed: "fixed",
  },

  COMMON: {
    fullscreen: "h-screen w-screen overflow-hidden bg-white relative",
    panel: "bg-white p-4 rounded-lg shadow-lg border border-gray-200",
    button:
      "bg-white border border-gray-300 px-3 py-2 rounded shadow hover:bg-gray-50",
  },
} as const;

// === ?곌껐???ㅽ???===
export const EDGES = {
  OFFSET: 24, // 爰얠엫 ?ㅽ봽??
  STYLES: {
    default: "stroke-gray-400",
    thick: "stroke-2",
    thin: "stroke-1",
  },
} as const;

// === Color 遺꾨쪟 ?⑥닔 ===
import { classifyPosition } from "./classification";

export function getColorCategory(
  department: string | string[],
  level: "VSM" | "A.VSM" | "GL" | "TL" | "PART" | "TM" | "DEPT",
  subtitle?: string,
): ColorCategory {
  const deptName = Array.isArray(department) ? department[0] : department;
  return classifyPosition(deptName, level, undefined, subtitle);
}

// === ?ㅽ????앹꽦 ?ы띁 ===
export function getBoxStyle(colorCategory?: ColorCategory): string {
  const base = BOX.CLASSES.base + " " + BOX.CLASSES.standard;

  if (!colorCategory) {
    return base + " bg-gray-100 border-gray-300";
  }

  const colors = COLORS.CATEGORIES[colorCategory];
  return `${base} ${colors.bg} ${colors.border} ${colors.text}`;
}

// === 踰붾? ?ㅽ????앹꽦 ?⑥닔 ===
export function getLegendItemStyle(colorCategory: ColorCategory): string {
  const colors = COLORS.CATEGORIES[colorCategory];
  return `${colors.bg} ${colors.border} px-4 py-2 rounded-lg shadow-sm`;
}

export function getLegendTextStyle(): string {
  return "text-sm font-semibold text-black";
}

export function getPanelStyle(
  position: "top-left" | "top-right" | "bottom-right",
): string {
  const base = `${LAYOUT.POSITION.fixed} ${LAYOUT.COMMON.panel} z-50`;

  const positions = {
    "top-left": "left-8 top-8",
    "top-right": "right-8 top-8",
    "bottom-right": "right-8 bottom-8",
  };

  return `${base} ${positions[position]}`;
}

// === ?섏씠吏蹂??ㅼ젙 ===
export const PAGE_CONFIGS = {
  page1: {
    spacing: SPACING.DEPARTMENT.horizontal,
    title: "Line Organization",
  },
  page2: {
    spacing: SPACING.DEPARTMENT.compact,
    title: "Plant Overview",
  },
  page3: {
    spacing: SPACING.DEPARTMENT.horizontal,
    title: "Support Organization",
  },
} as const;
