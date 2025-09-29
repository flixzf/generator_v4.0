/**
 * Department Data Configuration
 * 遺???곗씠???ㅼ젙 (?꾩떆濡?蹂듭썝)
 */

export interface DeptLike {
  title: string[] | string;
  hasGL?: boolean;
  glCount?: number;
  tl: string[];
  tm: string[][];
  parts?: (string | null)[];
  categoryTLMap?: number[];
}

// ?섏씠吏 2??遺???곗씠??
export function getDepartmentsForPage(pageNumber: number | string) {
  if (pageNumber === 2 || pageNumber === "page2") {
    return [
      {
        title: ["Admin"],
        hasGL: false,
        tl: [],
        tm: [["Personnel"], ["Production"], ["ISQ"]],
      },
      {
        title: ["Small Tooling"],
        hasGL: false,
        tl: ["Small Tooling"],
        tm: [["Last Control"], ["Pallet"], ["Cutting Die/Pad/Mold"]],
      },
    ];
  }

  if (pageNumber === 3) {
    return [
      {
        title: ["TPM"],
        hasGL: false,
        tl: ["TPM TL"],
        tm: [["TPM TM"]],
      },
      {
        title: ["CQM"],
        hasGL: false,
        tl: ["CQM TL"],
        tm: [["CQM TM"]],
      },
      {
        title: ["Quality"],
        hasGL: true,
        glCount: 1,
        tl: ["Quality TL"],
        tm: [["Quality TM"]],
      },
      {
        title: ["Lean"],
        hasGL: false,
        tl: ["Lean TL"],
        tm: [["Lean TM"]],
      },
      {
        title: ["Security"],
        hasGL: false,
        tl: ["Security TL"],
        tm: [["Security TM"]],
      },
      {
        title: ["RMCC"],
        hasGL: false,
        tl: ["RMCC TL"],
        tm: [["RMCC TM"]],
      },
    ];
  }

  return [];
}
