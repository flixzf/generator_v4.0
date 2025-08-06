/**
 * Centralized department data structures
 * This replaces all the scattered department arrays across different pages
 */

export interface DepartmentConfig {
  title: string | string[];
  hasGL: boolean;
  tl: string[];
  tm: string[][];
}

/**
 * Page 2 & Page 4 Indirect departments (Admin, Small Tooling, Raw Material, etc.)
 */
export const indirectDepartments: DepartmentConfig[] = [
  {
    title: ["Admin"],
    hasGL: false,
    tl: [],
    tm: [
      ["Personnel"],
      ["Production"],
      ["ISQ"],
    ],
  },
  {
    title: ["Small Tooling"],
    hasGL: false,
    tl: ["Small Tooling"],
    tm: [["Last Control"], ["Pallet"], ["Cutting Die/Pad/Mold"]],
  },
  {
    title: ["Raw Material"],
    hasGL: false,
    tl: [],
    tm: [["Raw Material"], ["Raw Material"]],
  },
  {
    title: ["Sub Material"],
    hasGL: false,
    tl: ["Material"],
    tm: [["Incoming"], ["Distribution"]],
  },
  {
    title: ["ACC Market", "P&L Market", "Bottom Market"],
    hasGL: false,
    tl: [],
    tm: [
      ["ACC Market"],
      ["P&L Market"],
      ["Bottom Market"],
    ],
  },
  {
    title: ["FG WH"],
    hasGL: false,
    tl: [],
    tm: [
      ["Receiving"],
      ["Shipping"],
    ],
  },
];

/**
 * Page 3 departments (Quality, CE) - basic structure
 * Note: Some departments need dynamic generation based on config
 */
export const supportDepartments: DepartmentConfig[] = [
  {
    title: ["Quality"],
    hasGL: true,
    tl: ["Quality"],
    tm: [
      ["Incoming"],
      ["In-Process"],
      ["Final"],
      ["MQAA Audit"],
    ],
  },
  {
    title: ["CE"],
    hasGL: false, // Updated based on actual usage
    tl: ["CE"],
    tm: [
      ["Mixing"],
    ],
  },
];

/**
 * Get departments for a specific page
 */
export function getDepartmentsForPage(page: 'page2' | 'page3' | 'page4-indirect' | 'page4-direct', config?: any): DepartmentConfig[] {
  switch (page) {
    case 'page2':
    case 'page4-indirect':
    case 'page4-direct':
      return indirectDepartments;
    case 'page3':
      if (!config) return supportDepartments;
      // Return basic departments for page3, dynamic ones should be added separately
      return [
        ...supportDepartments,
        // Additional dynamic departments can be added by the calling component
      ];
    default:
      return [];
  }
}

/**
 * Get all departments (for validation purposes)
 */
export function getAllDepartments(): DepartmentConfig[] {
  return [...indirectDepartments, ...supportDepartments];
}