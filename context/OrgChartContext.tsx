"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

// 모델별 공정 데이터 타입 추가
type ProcessData = {
  name: string;
  manStt: number;
  manAsy: number;
  miniLine: number;
  shift: number;
};

type ModelData = {
  category: string;
  modelName: string;
  styleNo: string;
  processes: ProcessData[];
};

type Department = {
  name: string;
  title?: string[];  // page2의 title 참조용
  tl?: string[];     // page2의 tl 참조용
  tm?: string[][];   // page2의 tm 참조용
  MGL: number;
  VSM: number;
  GL: number;
  TL: number;
  TM: number;
};

type Config = {
  lineCount: number;
  gateCount: number;  // 게이트 수 추가
  shiftsCount: number;
  miniLineCount: number;
  hasTonguePrefit: boolean;
  stockfitRatio: string;
  cuttingPrefitCount: number;
  stitchingCount: number;
  stockfitCount: number;
  assemblyCount: number;
};

type OrgChartData = {
  departments: {
    Line: Department;
    Admin: Department;
    SmallTooling: Department;
    RawMaterial: Department;
    SubMaterial: Department;
    ACC: Department;
    PL: Department;
    BottomMarket: Department;
    FGWH: Department;
    Quality: Department;
    CE: Department;
    TPM: Department;
    CQM: Department;
    Lean: Department;
    Security: Department;
    RMCC: Department;
  };
  config: Config;
  models: ModelData[];
  updateDepartment: (deptName: keyof OrgChartData['departments'], positions: Partial<Department>) => void;
  updateConfig: (newConfig: Partial<Config>) => void;
  updateModel: (modelIndex: number, model: ModelData) => void;
  addModel: (model: ModelData) => void;
  removeModel: (modelIndex: number) => void;
  getTotalByPosition: (position: 'MGL' | 'VSM' | 'GL' | 'TL' | 'TM') => number;
  lineModelSelections: number[];
  updateLineModelSelection: (lineIndex: number, modelIndex: number) => void;
};

const OrgChartContext = createContext<OrgChartData | null>(null);

// === 유틸리티 함수 ===
const makeDoubleLines = (count: number, prefix: string = 'Line ') => {
  const result: string[] = [];
  let i = 1;
  while (i <= count) {
    if (i + 1 <= count) {
      // 2개씩 묶음
      result.push(`${prefix}${i}-${i + 1}`);
      i += 2;
    } else {
      // 홀수 남으면 단독
      result.push(`${prefix}${i}`);
      i += 1;
    }
  }
  return result;
};

// === 초기 부서 데이터 ===
const initialDepartments: Record<keyof OrgChartData['departments'], Department> = {
  Line: {
    name: 'Line',
    title: ['Line'],
    tl: [
      'Cutting-Prefit',
      'Stitching', 
      'Stockfit',
      'Assembly'
    ],
    tm: [
      ['Cutting-Prefit TM'],
      ['Stitching TM'],
      ['Stockfit TM'],
      ['Assembly Input', 'Assembly Cementing', 'Assembly Finishing']
    ],
    MGL: 1,
    VSM: 1,
    GL: 1,
    TL: 4,
    TM: 6
  },
  Admin: {
    name: 'Admin',
    title: ['Admin'],
    tl: [],
    tm: [['Payroll'], ['APS'], ['Material'], ['Production'], ['GMES']],
    MGL: 0,
    VSM: 0,
    GL: Array.isArray(['Admin']) ? 0 : 1,
    TL: [].length,
    TM: [['Payroll'], ['APS'], ['Material'], ['Production'], ['GMES']].length
  },
  SmallTooling: {
    name: 'Small Tooling',
    title: ['Small Tooling'],
    tl: ['Small Tooling'],
    tm: [['Cutting Die'], ['Pallet'], ['Pad/Mold']],
    MGL: 0,
    VSM: 0,
    GL: Array.isArray(['Small Tooling']) ? 0 : 1,
    TL: ['Small Tooling'].length,
    TM: [['Cutting Die'], ['Pallet'], ['Pad/Mold']].length
  },
  RawMaterial: {
    name: 'Raw Material',
    title: ['Raw Material'],
    tl: ['Incoming', 'Distribution'],
    tm: [['Line 1-2'], ['Line 3-4'], ['Line 5-6'], ['Line 7-8']],
    MGL: 0,
    VSM: 0,
    GL: 0,
    TL: 2,
    TM: 4
  },
  SubMaterial: {
    name: 'Sub Material',
    title: ['Sub Material'],
    tl: ['SAP RO'],
    tm: [['Incoming Mgmt.'], ['Distribution']],
    MGL: 0,
    VSM: 0,
    GL: 0,
    TL: 1,
    TM: 2
  },
  ACC: {
    name: 'ACC',
    title: ['ACC'],
    tl: ['Incoming', 'Distribution'],
    tm: [['Line 1-2'], ['Line 3-4'], ['Line 5-6'], ['Line 7-8']],
    MGL: 0,
    VSM: 0,
    GL: 0,
    TL: 2,
    TM: 4
  },
  PL: {
    name: 'P&L',
    title: ['P&L'],
    tl: ['Stencil 1-2', 'Stencil 3-4', 'Stencil 5-6'],
    tm: [['Incoming'], ['Setting'], ['Line 1-2'], ['Line 3-4'], ['Line 5-6'], ['Line 7-8']],
    MGL: 0,
    VSM: 0,
    GL: 0,
    TL: 3,
    TM: 6
  },
  BottomMarket: {
    name: 'Bottom Market',
    title: ['Bottom Market'],
    tl: ['Outsole', 'Midsole', 'Airbag'],
    tm: [
      ['Outsole 1-2'], ['Outsole 3-4'],
      ['Midsole Incoming'], ['Midsole Setting'],
      ['Airbag 1-2'], ['Airbag 3-4'], ['Airbag 5-6'], ['Airbag 7-8']
    ],
    MGL: 0,
    VSM: 0,
    GL: 0,
    TL: 3,
    TM: 8
  },

  FGWH: {
    name: 'FG WH',
    title: ['FG WH'],
    tl: ['Shipping 1-4', 'Shipping 5-8'],
    tm: [
      ['Shipping 1-2'], ['Shipping 3-4'],
      ['Shipping 5-6'], ['Shipping 7-8'],
      ['Report'], ['Metal Detect']
    ],
    MGL: 0,
    VSM: 0,
    GL: 0,
    TL: 2,
    TM: 6
  },

  Quality: {
    name: 'Quality',
    title: ['Quality'],
    tl: ['QA', 'MA'],
    tm: [[]],
    MGL: 0,
    VSM: 0,
    GL: 1,
    TL: 2,
    TM: 17  // QA TM 16명 + MA TM 1명
  },
  
  // 나머지 부서들은 기본 구조만 추가
  CE: {
    name: 'CE',
    title: ['CE'],
    tl: ['Mixing', 'Assembly Control'],
    tm: [[]],
    MGL: 0,
    VSM: 0,
    GL: 1,
    TL: 2,
    TM: 2
  },
  TPM: {
    name: 'TPM',
    title: ['TPM'],
    tl: ['Stitching', 'Cutting & Stockfit·Assembly', 'CMMS & Electricity'],
    tm: [[]],
    MGL: 0,
    VSM: 0,
    GL: 1,
    TL: 3,
    TM: 3
  },
  CQM: {
    name: 'CQM',
    title: ['CQM-NPI'],
    tl: [],
    tm: [[]],
    MGL: 0,
    VSM: 0,
    GL: 1,
    TL: 0,
    TM: 0
  },
  Lean: {
    name: 'Lean',
    title: ['Lean'],
    tl: [],  // TL 없음
    tm: [[]],  // 빈 배열로 초기화 (실제 값은 calculateLeanDepartment에서 설정)
    MGL: 0,
    VSM: 0,
    GL: 1,  // GL 1명 고정
    TL: 0,  // TL 없음
    TM: 0   // 초기값 0 (실제 값은 calculateLeanDepartment에서 계산)
  },
  Security: {
    name: 'Security',
    title: ['Security'],
    tl: [],
    tm: [[]],  // 빈 배열로 초기화 (실제 값은 calculateSecurityDepartment에서 설정)
    MGL: 0,
    VSM: 0,
    GL: 0,  // GL 없음
    TL: 0,
    TM: 0   // 초기값 0 (실제 값은 calculateSecurityDepartment에서 계산)
  },
  RMCC: {
    name: 'RMCC',
    title: ['RMCC'],
    tl: [],
    tm: [['Solid Waste']],  // 1명 고정
    MGL: 0,
    VSM: 0,
    GL: 0,  // GL 없음
    TL: 0,
    TM: 1
  }
};

// 3. 계산 함수들 수정
const calculateDepartment = (
  deptName: keyof OrgChartData['departments'],
  prevDepartments?: OrgChartData['departments']
): Department => {
  const initial = initialDepartments[deptName];
  const prev = prevDepartments?.[deptName];

  // GL 값을 부서별로 설정
  let glCount = 0;
  if (deptName === 'Quality' || deptName === 'CE' || deptName === 'TPM' || deptName === 'CQM' || deptName === 'Lean') {
    glCount = 1;
  }

  // TM 값을 부서별로 설정
  let tmCount = 0;
  switch (deptName) {
    case 'Quality':
      tmCount = 2;  // QA TM 1명, MA TM 1명
      break;
    case 'CE':
      tmCount = 2;  // Mixing TM 1명, Assembly Control TM 1명
      break;
    case 'TPM':
      tmCount = 6;  // Stitching 2명, Cutting & Stockfit·Assembly 2명, CMMS 1명, Electricity 1명
      break;
    case 'CQM':
      tmCount = 0;  // TM 없음
      break;
    default:
      tmCount = prev?.tm?.length || initial.tm?.length || 0;
  }

  return {
    name: deptName,
    title: prev?.title || initial.title,
    tl: prev?.tl || initial.tl,
    tm: prev?.tm || initial.tm,
    MGL: 0,
    VSM: 0,
    GL: glCount,
    TL: prev?.tl?.length || initial.tl?.length || 0,
    TM: tmCount
  };
};

// === Lean 부서 계산 함수 추가 ===
const calculateLeanDepartment = (config: Config): Department => {
  const tmCount = Math.ceil(config.lineCount / 2);  // 2개 라인당 1명
  return {
    name: 'Lean',
    title: ['Lean'],
    tl: [],
    tm: [makeDoubleLines(config.lineCount).map(line => `Line ${line}`)],
    MGL: 0,
    VSM: 0,
    GL: 1,
    TL: 0,
    TM: tmCount
  };
};

// Quality 부서 계산 함수 추가
const calculateQualityDepartment = (config: Config): Department => {
  const qaTmCount = config.lineCount * 4;  // 라인당 4명의 QA TM
  const maTmCount = 4;  // MA TM은 4명으로 고정

  return {
    name: 'Quality',
    title: ['Quality'],
    tl: ['QA', 'MA'],
    tm: [
      Array.from({ length: config.lineCount }, (_, i) => [
        `Line ${i + 1} QA-1`,
        `Line ${i + 1} QA-2`,
        `Line ${i + 1} QA-3`,
        `Line ${i + 1} QA-4`
      ]).flat(),
      ['HEPA MA 검사-1', 'HEPA MA 검사-2', 'MQAA Audit-1', 'MQAA Audit-2']
    ],
    MGL: 0,
    VSM: 0,
    GL: 1,
    TL: 2,
    TM: qaTmCount + maTmCount  // QA TM + MA TM
  };
};

// CE 부서 계산 함수 추가
const calculateCEDepartment = (config: Config): Department => {
  // 2개 라인당 1명씩 계산
  const mixingTmCount = Math.ceil(config.lineCount / 2);  // 2개 라인당 1명
  const assemblyTmCount = Math.ceil(config.lineCount / 2);  // 2개 라인당 1명

  const tmArray = [
    makeDoubleLines(config.lineCount).map(line => `Mixing ${line}`),
    makeDoubleLines(config.lineCount).map(line => `Assembly ${line}`)
  ];

  return {
    name: 'CE',
    title: ['CE'],
    tl: ['Mixing', 'Assembly Control'],
    tm: tmArray,
    MGL: 0,
    VSM: 0,
    GL: 1,
    TL: 2,
    TM: mixingTmCount + assemblyTmCount  // 실제 TM 수 계산
  };
};

// TPM 부서 계산 함수 추가
const calculateTPMDepartment = (config: Config): Department => {
  // Stitching: 2개 라인당 1명
  const stitchingTmCount = Math.ceil(config.lineCount / 2);
  
  // Cutting & Stockfit·Assembly: 2개 라인당 1명
  const cuttingStockfitTmCount = Math.ceil(config.lineCount / 2);
  
  // CMMS & Electricity: CMMS 1명, Electricity 1명 고정
  const cmmsTmCount = 1;
  const electricityTmCount = 1;

  return {
    name: 'TPM',
    title: ['TPM'],
    tl: ['Stitching', 'Cutting & Stockfit·Assembly', 'CMMS & Electricity'],
    tm: [
      // Stitching TM
      makeDoubleLines(config.lineCount).map(line => `Stitching ${line}`),
      
      // Cutting & Stockfit·Assembly TM
      makeDoubleLines(config.lineCount).map(line => `C&S ${line}`),
      
      // CMMS & Electricity TM
      ['CMMS', 'Electricity']
    ],
    MGL: 0,
    VSM: 0,
    GL: 1,
    TL: 3,
    TM: stitchingTmCount + cuttingStockfitTmCount + cmmsTmCount + electricityTmCount
  };
};

export function OrgChartProvider({ children }: { children: React.ReactNode }) {
  // 초기 모델 데이터 (CSV 파일 기반)
  const initialModels: ModelData[] = [
    {
      category: "Running",
      modelName: "Vomero 18",
      styleNo: "HM6803-007",
      processes: [
        { name: "Cutting", manStt: 5.5, manAsy: 11.0, miniLine: 1, shift: 1 },
        { name: "HF Welding", manStt: 20.0, manAsy: 40.0, miniLine: 1, shift: 2 },
        { name: "No-sew", manStt: 18.0, manAsy: 36.0, miniLine: 1, shift: 2 },
        { name: "Stitching", manStt: 44.0, manAsy: 88.0, miniLine: 2, shift: 1 },
        { name: "Stockfit", manStt: 70.0, manAsy: 70.0, miniLine: 1, shift: 1 },
        { name: "Assembly", manStt: 85.0, manAsy: 85.0, miniLine: 1, shift: 1 },
      ]
    },
    {
      category: "Jordan",
      modelName: "AJ1 Low",
      styleNo: "553558-065",
      processes: [
        { name: "Cutting", manStt: 11.3, manAsy: 22.5, miniLine: 1, shift: 1 },
        { name: "Pre-Folding", manStt: 12.0, manAsy: 24.0, miniLine: 1, shift: 1 },
        { name: "Computer Stitching", manStt: 13.0, manAsy: 26.0, miniLine: 2, shift: 1 },
        { name: "Pre-Stitching", manStt: 24.5, manAsy: 49.0, miniLine: 2, shift: 1 },
        { name: "Stitching", manStt: 53.0, manAsy: 106.0, miniLine: 2, shift: 1 },
        { name: "Stockfit", manStt: 21.0, manAsy: 21.0, miniLine: 1, shift: 1 },
        { name: "Assembly", manStt: 94.0, manAsy: 94.0, miniLine: 1, shift: 1 },
      ]
    },
    {
      category: "NSW",
      modelName: "Air Max 90",
      styleNo: "CN8490-002/100",
      processes: [
        { name: "Cutting", manStt: 10.0, manAsy: 20.0, miniLine: 1, shift: 1 },
        { name: "Pre-Stitching", manStt: 30.0, manAsy: 60.0, miniLine: 2, shift: 1 },
        { name: "Stitching", manStt: 61.5, manAsy: 123.0, miniLine: 2, shift: 1 },
        { name: "Stockfit", manStt: 26.0, manAsy: 26.0, miniLine: 1, shift: 1 },
        { name: "Assembly", manStt: 74.0, manAsy: 74.0, miniLine: 1, shift: 1 },
      ]
    },
    {
      category: "Kids",
      modelName: "CB2",
      styleNo: "DV5457-104",
      processes: [
        { name: "Cutting", manStt: 5.5, manAsy: 11.0, miniLine: 1, shift: 1 },
        { name: "Computer Stitching", manStt: 17.0, manAsy: 34.0, miniLine: 1, shift: 1 },
        { name: "Pre-Stitching", manStt: 17.0, manAsy: 34.0, miniLine: 1, shift: 1 },
        { name: "Stitching", manStt: 44.0, manAsy: 88.0, miniLine: 2, shift: 1 },
        { name: "Assembly", manStt: 107.0, manAsy: 107.0, miniLine: 1, shift: 1 },
      ]
    }
  ];

  // 모델 상태 관리
  const [models, setModels] = useState<ModelData[]>(initialModels);
  
  const [lineModelSelections, setLineModelSelections] = useState<number[]>([]);

  // 1. 기본 계산 함수들 먼저 정의
  const calculateTotalTL = (config: Config) => {
    const perLineTL = (
      config.shiftsCount +
      (config.miniLineCount + (config.hasTonguePrefit ? 1 : 0)) +
      (config.stockfitRatio === "1:1" ? 1 : 2) +
      3
    );
    return perLineTL * config.lineCount;
  };

  const calculateTotalTM = (config: Config) => {
    const perLineTM = (
      config.shiftsCount +
      config.miniLineCount +
      1 +
      3
    );
    return perLineTM * config.lineCount;
  };

  // 2. 부서별 계산 함수들 정의
  const calculateLineDepartment = (config: Config, prevDepartments?: OrgChartData['departments']): Department => {
    // 이전 상태나 초기값에 상관없이 항상 config 기반으로 계산
    return {
      name: 'Line',
      title: ['Line'],
      tl: [
        'Cutting-Prefit',
        'Stitching',
        'Stockfit',
        'Assembly'
      ],
      tm: [
        // Cutting-Prefit TM: shiftsCount만큼
        Array(config.shiftsCount).fill('Cutting-Prefit TM'),
        
        // Stitching TM: miniLineCount + hasTonguePrefit만큼
        Array(config.miniLineCount + (config.hasTonguePrefit ? 1 : 0)).fill('Stitching TM'),
        
        // Stockfit TM: stockfitRatio에 따라
        Array(config.stockfitRatio === "1:1" ? 1 : 2).fill('Stockfit TM'),
        
        // Assembly TM: 3개 고정 (Input, Cementing, Finishing)
        ['Assembly Input', 'Assembly Cementing', 'Assembly Finishing']
      ],
      MGL: 1,
      VSM: config.lineCount,  // lineCount에 따라 변경
      GL: 4 * config.lineCount,  // lineCount당 4명의 GL
      TL: calculateTotalTL(config),  // config 기반으로 TL 계산
      TM: calculateTotalTM(config)   // config 기반으로 TM 계산
    };
  };

  const calculateAdminDepartment = (config: Config): Department => {
    const adminLinesCount = Math.ceil(config.lineCount / 2); // Line 수에 따른 그룹 수 계산
    const adminTL: string[] = [];  // 초기 tl 배열을 빈 배열로 설정

    return {
      name: 'Admin',
      title: ['Admin'],
      tl: adminTL,  // 수정된 tl 배열 사용
      tm: [['Payroll'], ['APS'], ['Material'], ['Production'], ['GMES']],
      MGL: 1,
      VSM: 0,
      GL: Array.isArray(['Admin']) ? 0 : 1,
      TL: adminTL.length,
      TM: 5 + adminLinesCount // 기타 계산 로직
    };
  };

  const calculateSmallToolingDepartment = (prevDepartments?: OrgChartData['departments']): Department => {
    if (prevDepartments?.SmallTooling) {
      const dept = prevDepartments.SmallTooling;
      return {
        name: 'Small Tooling',
        title: dept.title,
        tl: dept.tl,
        tm: dept.tm,
        MGL: 0,
        VSM: 0,
        GL: Array.isArray(dept.title) ? 0 : 1, // title이 배열이면 0, 문자열이면 1
        TL: dept.tl?.length || 1, // TL 배열의 크기
        TM: dept.tm?.length || 3 // TM 배열의 크기 (Cutting Die, Pallet, Pad/Mold)
      };
    }

    // 초기값 
    return {
      name: 'Small Tooling',
      title: ['Small Tooling'], // 배열로 초기화
      tl: ['Small Tooling'], // 1개 요소로 초기화
      tm: [['Cutting Die'], ['Pallet'], ['Pad/Mold']], // 3개 요소로 초기화
      MGL: 0,
      VSM: 0, 
      GL: 0, // title이 배열이므로 0
      TL: 1,
      TM: 3
    };
  };

  const calculateRawMaterialDepartment = (
    config: Config,
    prevDepartments?: OrgChartData['departments']
  ): Department => {
    // 라인 수에 따른 TM 배열 생성
    const generateTmLines = (lineCount: number) => {
      const tmLines = [];
      for (let i = 1; i <= lineCount; i++) {
        tmLines.push([`Line ${i}`]);
      }
      return tmLines;
    };

    if (prevDepartments?.RawMaterial) {
      const dept = prevDepartments.RawMaterial;
      return {
        name: 'Raw Material',
        title: dept.title,
        tl: dept.tl,
        tm: generateTmLines(config.lineCount),
        MGL: 0,
        VSM: 0,
        GL: Array.isArray(dept.title) ? 0 : 1,
        TL: 0,
        TM: config.lineCount
      };
    }

    return {
      name: 'Raw Material',
      title: ['Raw Material'],
      tl: ['Incoming', 'Distribution'],
      tm: generateTmLines(config.lineCount),
      MGL: 0,
      VSM: 0,
      GL: 0,
      TL: 0,
      TM: config.lineCount
    };
  };

  const calculateSubMaterialDepartment = (prevDepartments?: OrgChartData['departments']): Department => {
    if (prevDepartments?.SubMaterial) {
      const dept = prevDepartments.SubMaterial;
      return {
        name: 'Sub Material',
        title: dept.title,
        tl: dept.tl,
        tm: dept.tm,
        MGL: 0,
        VSM: 0,
        GL: Array.isArray(dept.title) ? 0 : 1,
        TL: dept.tl?.length || 1,
        TM: dept.tm?.length || 2
      };
    }

    return {
      name: 'Sub Material',
      title: ['Sub Material'],
      tl: ['SAP RO'],
      tm: [['Incoming Mgmt.'], ['Distribution']],
      MGL: 0,
      VSM: 0,
      GL: 0,
      TL: 1,
      TM: 2
    };
  };

  const calculateACCDepartment = (
    config: Config,
    prevDepartments?: OrgChartData['departments']
  ): Department => {
    // lineCount 기반으로 tm 배열을 생성하는 함수 (RawMaterial 방식과 동일)
    const generateTmLines = (lineCount: number) => {
      const tmLines = [];
      for (let i = 1; i <= lineCount; i++) {
        tmLines.push([`Line ${i}`]);
      }
      return tmLines;
    };

    

    if (prevDepartments?.ACC) {
      const dept = prevDepartments.ACC;
      return {
        name: 'ACC',
        title: dept.title,
        tl: dept.tl,
        tm: generateTmLines(config.lineCount),
        MGL: 0,
        VSM: 0,
        GL: Array.isArray(dept.title) ? 0 : 1,
        TL: dept.tl?.length || 1,
        TM: config.lineCount
      };
    }

    return {
      name: 'ACC',
      title: ['ACC'],
      tl: ["Line"],
      tm: generateTmLines(config.lineCount),
      MGL: 0,
      VSM: 0,
      GL: 0,
      TL: 1,
      TM: config.lineCount
    };
  };

  const calculatePLDepartment = (
    config: Config, 
    prevDepartments?: OrgChartData['departments']
  ): Department => {
    // lineCount 기반으로 tm 배열을 생성하는 함수
    const generateTmLines = (lineCount: number) => {
      const tmLines = [];
      for (let i = 1; i <= lineCount; i++) {
        tmLines.push([`Line ${i}`]);
      }
      return tmLines;
    };

    // 새로운 TM 계산 방식: Math.ceil(lineCount/2) + lineCount + 1
    // 예를 들어 4라인이면: 2 + 4 + 1 = 7, 5라인이면: 3 + 5 + 1 = 9
    const computedTM = Math.ceil(config.lineCount / 2) + config.lineCount + 1;

    if (prevDepartments?.PL) {
      const dept = prevDepartments.PL;
      return {
        name: 'P&L',
        title: dept.title,
        tl: dept.tl,
        tm: generateTmLines(config.lineCount),
        MGL: 0,
        VSM: 0,
        GL: 1,
        TL: dept.tl?.length || 1,
        TM: computedTM
      };
    }

    return {
      name: 'P&L',
      title: ['P&L'],
      tl: ['Incoming & Setting'],
      tm: generateTmLines(config.lineCount),
      MGL: 0,
      VSM: 0,
      GL: 1,
      TL: 1,
      TM: computedTM
    };
  };

  const calculateBottomMarketDepartment = (
    config: Config,
    prevDepartments?: OrgChartData['departments']
  ): Department => {
    // lineCount 기반으로 tm 배열을 생성하는 함수
    // 기존의 BottomMarket 부서에서는 고정값 대신 config에 따른 동적 배열 생성 방식으로 변경합니다.
    const generateTmLines = (lineCount: number) => {
      const tmLines = [];
      for (let i = 1; i <= lineCount; i++) {
        tmLines.push([`Bottom Market Line ${i}`]);
      }
      return tmLines;
    };

    // 새로운 TM 계산 방식: (라인수 * 2) + 1 + (라인수 / 2, 올림)
    const computedTM = (config.lineCount * 2) + 1 + Math.ceil(config.lineCount / 2);

    if (prevDepartments?.BottomMarket) {
      const dept = prevDepartments.BottomMarket;
      return {
        name: 'Bottom Market',
        title: dept.title,
        tl: dept.tl,
        tm: generateTmLines(config.lineCount),
        MGL: 0,
        VSM: 0,
        GL: Array.isArray(dept.title) ? 0 : 1,
        TL: dept.tl?.length || 1,
        TM: computedTM
      };
    }

    return {
      name: 'Bottom Market',
      title: ['Bottom Market'],
      tl: ['Bottom Market'],
      tm: generateTmLines(config.lineCount),
      MGL: 0,
      VSM: 0,
      GL: 0,
      TL: 1,
      TM: computedTM
    };
  };



  const calculateFGWHDepartment = (
    config: Config,
    prevDepartments?: OrgChartData['departments']
  ): Department => {
    // 새로운 TM 계산 방식: (라인수 * 2) + 2
    const computedTM = (config.lineCount * 2) + 2;

    // TM 배열을 동적으로 생성하는 함수. 예시로 간단하게 "Team i" 형태로 생성합니다.
    const generateTmLines = (count: number) => {
      return Array.from({ length: count }, (_, i) => [`Team ${i + 1}`]);  // 각 요소를 배열로 감싸기
    };

    if (prevDepartments?.FGWH) {
      const dept = prevDepartments.FGWH;
      return {
        name: 'FG WH',
        title: dept.title,
        tl: dept.tl,
        tm: generateTmLines(computedTM),
        MGL: 0,
        VSM: 0,
        GL: 1,
        TL: 1,          // TL은 1로 고정
        TM: computedTM  // TM은 (라인수 * 2) + 2로 계산
      };
    }

    return {
      name: 'FG WH',
      title: ['FG WH'],
      tl: ['Shipping'],
      tm: generateTmLines(computedTM),
      MGL: 0,
      VSM: 0,
      GL: 1,
      TL: 1,          // TL은 1로 고정
      TM: computedTM  // TM은 (라인수 * 2) + 2로 계산
    };
  };

  // 3. state 선언
  const [config, setConfig] = useState<Config>({
    lineCount: 4,
    gateCount: 5,  // 초기 게이트 수 설정
    shiftsCount: 2,
    miniLineCount: 2,
    hasTonguePrefit: true,
    stockfitRatio: "2:1",
    cuttingPrefitCount: 1,
    stitchingCount: 1,
    stockfitCount: 1,
    assemblyCount: 1
  });

  // 4. departments state 초기화
  const [departments, setDepartments] = useState<OrgChartData['departments']>(() => {
    const deps = {} as OrgChartData['departments'];
    
    // 초기화 시에도 각 부서별 적절한 계산 함수 사용
    deps.Line = calculateLineDepartment(config);
    deps.Admin = calculateAdminDepartment(config);
    deps.SmallTooling = calculateSmallToolingDepartment();
    deps.RawMaterial = calculateRawMaterialDepartment(config);
    deps.SubMaterial = calculateSubMaterialDepartment();
    deps.ACC = calculateACCDepartment(config);
    deps.PL = calculatePLDepartment(config);
    deps.BottomMarket = calculateBottomMarketDepartment(config);
    
    deps.FGWH = calculateFGWHDepartment(config);
    
    deps.Quality = calculateQualityDepartment(config);
    deps.CE = calculateCEDepartment(config);
    deps.TPM = calculateTPMDepartment(config);
    deps.CQM = calculateDepartment('CQM');
    deps.Lean = calculateLeanDepartment(config);
    deps.Security = calculateSecurityDepartment(config);
    deps.RMCC = calculateRMCCDepartment();
    
    return deps;
  });

  // 라인 모델 선택 상태 동기화
  useEffect(() => {
    setLineModelSelections(prev => {
      const newSelections = new Array(config.lineCount).fill(0);
      // 기존 선택값 유지
      for(let i = 0; i < Math.min(prev.length, config.lineCount); i++) {
        newSelections[i] = prev[i];
      }
      return newSelections;
    });
  }, [config.lineCount]);

  // 5. 업데이트 함수들
  const updateDepartment = (
    deptName: keyof OrgChartData['departments'], 
    positions: Partial<Department>
  ) => {
    setDepartments(prev => ({
      ...prev,
      [deptName]: { ...prev[deptName], ...positions }
    }));
  };

  const updateDepartmentsBasedOnConfig = (newConfig: Config) => {
    setDepartments(prev => {
      const deps = {} as OrgChartData['departments'];
      
      // 각 부서별로 적절한 계산 함수 사용
      deps.Line = calculateLineDepartment(newConfig);  // Line은 config만 사용
      deps.Admin = calculateAdminDepartment(newConfig);
      deps.SmallTooling = calculateSmallToolingDepartment(prev);
      deps.RawMaterial = calculateRawMaterialDepartment(newConfig, prev);
      deps.SubMaterial = calculateSubMaterialDepartment(prev);
      deps.ACC = calculateACCDepartment(newConfig, prev);
      deps.PL = calculatePLDepartment(newConfig, prev);
      deps.BottomMarket = calculateBottomMarketDepartment(newConfig, prev);
      
      deps.FGWH = calculateFGWHDepartment(newConfig, prev);
      
      deps.Quality = calculateQualityDepartment(newConfig);
      deps.CE = calculateCEDepartment(newConfig);
      deps.TPM = calculateTPMDepartment(newConfig);
      deps.CQM = calculateDepartment('CQM');
      deps.Lean = calculateLeanDepartment(newConfig);  // Lean 부서 계산 추가
      deps.Security = calculateSecurityDepartment(newConfig);
      deps.RMCC = calculateRMCCDepartment();
      
      return deps;
    });
  };

  const updateConfig = (newConfig: Partial<Config>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
      updateDepartmentsBasedOnConfig(updated);
      return updated;
    });
  };

  // 직급별 총합 계산 함수
  const getTotalByPosition = (position: 'MGL' | 'VSM' | 'GL' | 'TL' | 'TM'): number => {
    return Object.values(departments).reduce((sum, dept) => sum + dept[position], 0);
  };

  // 모델 관련 함수들
  const updateModel = (modelIndex: number, model: ModelData) => {
    setModels(prev => {
      const newModels = [...prev];
      newModels[modelIndex] = model;
      return newModels;
    });
  };

  const addModel = (model: ModelData) => {
    setModels(prev => [...prev, model]);
  };

  const removeModel = (modelIndex: number) => {
    setModels(prev => prev.filter((_, index) => index !== modelIndex));
  };

  const updateLineModelSelection = (lineIndex: number, modelIndex: number) => {
    setLineModelSelections(prev => {
      const newSelections = [...prev];
      newSelections[lineIndex] = modelIndex;
      return newSelections;
    });
  };

  return (
    <OrgChartContext.Provider value={{ 
      departments, 
      config,
      models,
      updateDepartment,
      updateConfig,
      updateModel,
      addModel,
      removeModel,
      getTotalByPosition,
      lineModelSelections,
      updateLineModelSelection
    }}>
      {children}
    </OrgChartContext.Provider>
  );
}

export function useOrgChart() {
  const context = useContext(OrgChartContext);
  if (!context) {
    throw new Error('useOrgChart must be used within an OrgChartProvider');
  }
  return context;
}

// Config 타입을 한 번만 export
export type { Config };

// Security 부서 계산 함수
const calculateSecurityDepartment = (config: Config): Department => {
  return {
    name: 'Security',
    title: ['Security'],
    tl: [],
    tm: [Array.from({ length: config.gateCount }, (_, i) => `Gate ${i + 1}`)],
    MGL: 0,
    VSM: 0,
    GL: 0,  // GL 없음
    TL: 0,
    TM: config.gateCount
  };
};

// RMCC 부서 계산 함수
const calculateRMCCDepartment = (): Department => {
  return {
    name: 'RMCC',
    title: ['RMCC'],
    tl: [],
    tm: [['Solid Waste']],  // 1명 고정
    MGL: 0,
    VSM: 0,
    GL: 0,  // GL 없음
    TL: 0,
    TM: 1
  };
};
