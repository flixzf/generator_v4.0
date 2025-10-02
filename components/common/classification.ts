/**

 * 통합 Position Classification System

 * 직군 분류 (Direct/Indirect/OH) 로직을 담당

 */

export type ColorCategory = "direct" | "indirect" | "OH";

// === 분류 규칙 타입 정의 ===

interface ClassificationRule {
  departments: string[];

  defaultCategory: ColorCategory;

  levelOverrides?: Record<string, ColorCategory>;

  specialRules?: Array<{
    condition: (
      dept: string,
      level: string,
      subtitle?: string,
      title?: string,
    ) => boolean;

    category: ColorCategory;
  }>;
}

// === 부문 분류 규칙 ===

const CLASSIFICATION_RULES: ClassificationRule[] = [
  // OH (지원부서/관리부서)

  {
    departments: [
      "Admin",
      "CE",
      "Small Tooling",
      "Sub Material",
      "TPM",
      "CQM",
      "Lean",
      "Security",
      "RMCC",
    ],

    defaultCategory: "OH",

    specialRules: [
      // CE TM Mixing은 직접 업무

      {
        condition: (dept, level, subtitle, title) =>
          dept === "CE" &&
          level === "TM" &&
          ((subtitle?.includes("Mixing") ?? false) ||
            (title?.includes("Mixing") ?? false)),

        category: "direct",
      },
      // Small Tooling의 TL과 TM은 Indirect

      {
        condition: (dept, level) =>
          dept === "Small Tooling" &&
          (level === "TL" || level === "TM"),

        category: "indirect",
      },
    ],
  },

  // Indirect (간접 생산)

  {
    departments: [
      "Line",
      "Quality",
      "Raw Material",
      "ACC Market",
      "Market",
      "P&L Market",
      "Bottom Market",
      "FG WH",
      "No-sew",
      "HF Welding",
      "Separated",
      "Plant Production",
    ],

    defaultCategory: "indirect",

    levelOverrides: {
      VSM: "OH",

      "A.VSM": "OH",
    },

    specialRules: [
      // Quality GL은 OH

      {
        condition: (dept, level) => dept === "Quality" && level === "GL",

        category: "OH",
      },

      // FG WH TM Shipping은 OH

      {
        condition: (dept, level, subtitle, title) =>
          dept.includes("FG WH") &&
          level === "TM" &&
          ((subtitle?.includes("Shipping") ?? false) ||
            (title?.includes("Shipping") ?? false)),

        category: "OH",
      },

      // Plant Production과 연결된 생산 부문의 TM은 직접 업무

      {
        condition: (dept, level) =>
          dept.includes("Plant Production") && level === "TM",

        category: "direct",
      },
    ],
  },
];

// === 부서명 정규화 ===

function normalizeDepartmentName(department: string): string {
  if (!department) return department;

  const mainName = department.split("\n")[0].trim();

  const normalizations: Record<string, string> = {
    RawMaterial: "Raw Material",

    SubMaterial: "Sub Material",

    BottomMarket: "Bottom Market",

    FGWH: "FG WH",

    ACC: "ACC Market",

    PL: "P&L Market",
  };

  return normalizations[mainName] || mainName;
}

// === 메인 분류 함수 ===

export function classifyPosition(
  department: string,

  level: "VSM" | "A.VSM" | "GL" | "TL" | "PART" | "TM" | "DEPT",

  processType?: string,

  subtitle?: string,

  title?: string,
): ColorCategory {
  try {
    const normalizedDept = normalizeDepartmentName(department);

    // VSM, A.VSM은 항상 OH

    if (level === "VSM" || level === "A.VSM") {
      return "OH";
    }

    // 특수공정 처리

    if (processType === "No-sew" || processType === "HF Welding") {
      return "indirect";
    }

    // 정규 규칙 적용

    for (const rule of CLASSIFICATION_RULES) {
      if (rule.departments.includes(normalizedDept)) {
        // 특수 규칙 확인

        if (rule.specialRules) {
          for (const specialRule of rule.specialRules) {
            if (specialRule.condition(normalizedDept, level, subtitle, title)) {
              return specialRule.category;
            }
          }
        }

        // 레벨별 오버라이드 확인

        if (rule.levelOverrides?.[level]) {
          return rule.levelOverrides[level];
        }

        // 기본 카테고리 반환

        return rule.defaultCategory;
      }
    }

    // 규칙에 없는 부서는 indirect로 처리

    console.warn(
      `Unknown department: ${normalizedDept}, defaulting to indirect`,
    );

    return "indirect";
  } catch (error) {
    console.error("Classification error:", error);

    return "indirect"; // 오류 시 기본값
  }
}

// === 일괄 분류 ===

export interface Position {
  id: string;

  department: string;

  level: "VSM" | "A.VSM" | "GL" | "TL" | "PART" | "TM" | "DEPT";

  title?: string;

  subtitle?: string;

  processType?: string;
}

export function batchClassifyPositions(
  positions: Position[],
): Array<Position & { classification: ColorCategory }> {
  return positions.map((position) => ({
    ...position,

    classification: classifyPosition(
      position.department,

      position.level,

      position.processType,

      position.subtitle,

      position.title,
    ),
  }));
}

// === 통계 계산 ===

export interface ClassificationStats {
  total: number;

  direct: number;

  indirect: number;

  OH: number;

  byDepartment: Record<
    string,
    { direct: number; indirect: number; OH: number }
  >;
}

export function getClassificationStats(
  positions: Array<Position & { classification: ColorCategory }>,
): ClassificationStats {
  const stats: ClassificationStats = {
    total: positions.length,

    direct: 0,

    indirect: 0,

    OH: 0,

    byDepartment: {},
  };

  positions.forEach((position) => {
    // 전체 통계

    stats[position.classification]++;

    // 부서별 통계

    const dept = normalizeDepartmentName(position.department);

    if (!stats.byDepartment[dept]) {
      stats.byDepartment[dept] = { direct: 0, indirect: 0, OH: 0 };
    }

    stats.byDepartment[dept][position.classification]++;
  });

  return stats;
}

// === 검증 함수 ===

export function validateClassification(
  department: string,

  level: "VSM" | "A.VSM" | "GL" | "TL" | "PART" | "TM" | "DEPT",

  expectedCategory: ColorCategory,

  processType?: string,

  subtitle?: string,

  title?: string,
): { isValid: boolean; actualCategory: ColorCategory; message?: string } {
  const actualCategory = classifyPosition(
    department,
    level,
    processType,
    subtitle,
    title,
  );

  const isValid = actualCategory === expectedCategory;

  return {
    isValid,

    actualCategory,

    message: isValid
      ? undefined
      : `Expected ${expectedCategory}, got ${actualCategory} for ${department} ${level}`,
  };
}

// === 디버그용 함수 ===

export interface PositionDetails {
  normalizedDept: string;

  matchingRule?: string;

  category: ColorCategory;
}

export function getClassificationInfo(
  department: string,
  level: string,
): PositionDetails {
  const normalizedDept = normalizeDepartmentName(department);

  let matchingRule: string | undefined;

  for (const rule of CLASSIFICATION_RULES) {
    if (rule.departments.includes(normalizedDept)) {
      matchingRule = `${rule.departments[0]} rule (${rule.defaultCategory})`;

      break;
    }
  }

  return {
    normalizedDept,

    matchingRule,

    category: classifyPosition(department, level as any),
  };
}
