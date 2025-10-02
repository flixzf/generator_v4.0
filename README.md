# 조직도 생성기 (Organization Chart Generator)

> **최신 업데이트**: ReactFlow 기반 인터랙티브 조직도, 부서별 바운딩 박스 레이아웃 적용 완료

이 프로젝트는 **제조/생산 조직의 인원 구조를 시각화하고, 다양한 기준(라인, 플랜트, 지원부서 등)으로 인원 배분을 분석**하는 웹 애플리케이션입니다. Next.js 15 기반으로 개발되었으며, ReactFlow를 활용해 드래그 가능한 인터랙티브 조직도를 제공합니다.

---

## 주요 기능

- **인터랙티브 조직도 시각화**
  ReactFlow 기반으로 드래그, 줌, 미니맵 등 인터랙티브 기능 제공
- **6가지 뷰 제공**
  Line(공정별), Plant(부서별), Support(지원부서), Direct/Indirect 인원 집계, Model 기반 산정
- **계층별 직책 관리**
  PM → LM → GL → TL → TM 계층 구조
- **모델 기반 인원 산정**
  생산 모델별 공정/인원 정보 기반 자동 계산
- **부서별 스마트 레이아웃**
  바운딩 박스 기반 균등 간격 자동 배치

---

## 📁 프로젝트 구조

```
generator_v4.0/
├── app/                    # Next.js 15 App Router
│   ├── layout.tsx          # 루트 레이아웃 (폰트, 글로벌 스타일)
│   ├── page.tsx            # 메인 페이지 (뷰 선택 드롭다운)
│   └── globals.css         # Tailwind 글로벌 스타일
│
├── components/
│   ├── common/             # 공통 컴포넌트 및 유틸리티
│   │   ├── components.tsx      # PositionBox, CustomNode, Edge 컴포넌트
│   │   ├── theme.ts            # 색상 테마 및 스타일 설정
│   │   ├── layout.ts           # 레이아웃 계산 로직
│   │   ├── classification.ts   # 직책 분류 엔진
│   │   ├── utils.ts            # 유틸리티 함수
│   │   ├── department-data.ts  # 부서 데이터 정의
│   │   ├── PositionBox.tsx     # 직책 박스 UI 컴포넌트
│   │   └── reactflow/          # ReactFlow 페이지별 구현
│   │       ├── ReactFlowPage1.tsx  # Line 뷰
│   │       ├── ReactFlowPage2.tsx  # Plant 뷰
│   │       └── ReactFlowPage3.tsx  # Support 뷰
│   │
│   └── pages/              # 페이지별 메인 컴포넌트
│       ├── page1.tsx           # Line 기반 조직도
│       ├── page2.tsx           # Plant/부서별 조직도
│       ├── page3.tsx           # 지원부서 조직도
│       ├── page4-direct.tsx    # Direct 인원 집계
│       ├── page4-indirect.tsx  # Indirect+OH 인원 집계
│       └── page5.tsx           # 모델 기반 인원 산정
│
├── context/
│   └── OrgChartContext.tsx    # 전역 상태 관리 (Context API)
│
├── reference/              # 참고 자료 (제외됨)
│   ├── 조직도.png
│   └── 라인별 구성.txt
│
├── .claude/                # Claude Code 설정 (제외됨)
├── .gitignore              # Git 제외 파일 설정
├── CLAUDE.md               # AI 개발 가이드
├── next.config.ts          # Next.js 설정
├── tailwind.config.ts      # Tailwind 설정
├── tsconfig.json           # TypeScript 설정
└── package.json            # 의존성 및 스크립트
```

---

## 🔍 핵심 아키텍처

### 1. 전역 상태 관리 (Context)
- **OrgChartContext.tsx**: 모든 조직도 데이터 중앙 관리
- 부서, 설정, 모델, 공정 데이터 구조
- `useOrgChart()` 훅으로 전역 접근

### 2. 페이지 기반 뷰 시스템
6가지 조직도 뷰를 드롭다운으로 전환:
- **Page 1**: Line 기반 (공정 중심)
- **Page 2**: Plant/부서 기반
- **Page 3**: 지원부서
- **Page 4 Direct**: Direct 인원 집계
- **Page 4 Indirect**: Indirect + OH 인원
- **Page 5**: 모델 기반 인원 계산

### 3. 컴포넌트 계층
```
components/
├── common/               # 공유 시각화 컴포넌트
│   ├── components.tsx    # PositionBox, CustomNode 등
│   ├── theme.ts          # 색상 체계
│   ├── layout.ts         # 레이아웃 계산
│   ├── utils.ts          # 유틸리티
│   └── reactflow/        # ReactFlow 구현
└── pages/               # 페이지별 컴포넌트
```

### 4. ReactFlow 통합
- 커스텀 노드 타입 (직책별)
- 자동 엣지 생성 (계층 연결)
- 계산된 레이아웃 포지셔닝
- 드래그, 줌, 미니맵 지원

### 5. 데이터 흐름
1. **OrgChartContext** → 부서/설정/모델 데이터 관리
2. **Page 컴포넌트** → `useOrgChart()`로 데이터 소비
3. **Common 컴포넌트** → 처리된 데이터로 시각화
4. **Theme 시스템** → 일관된 스타일 적용

---

## 🛠️ 주요 파일 및 역할

### 코어 애플리케이션
- `app/page.tsx` - 메인 진입점, 페이지 선택 라우팅
- `app/layout.tsx` - 루트 레이아웃, 폰트 설정
- `context/OrgChartContext.tsx` - 전역 상태 관리

### 시각화 엔진
- `components/common/components.tsx` - PositionBox, CustomNode 등 기본 UI
- `components/common/theme.ts` - 색상, 스타일 테마
- `components/common/layout.ts` - 간격 계산, 포지셔닝
- `components/common/classification.ts` - 직책 분류 로직
- `components/common/utils.ts` - 데이터 처리 유틸리티

### 비즈니스 로직
각 페이지 컴포넌트는 특정 조직도 뷰 담당:
- Line 차트: 공정 중심 계층
- Plant 차트: 부서 중심 구조
- Support 차트: 지원 기능
- 집계 페이지: 인원 유형별 요약
- 모델 페이지: 생산 모델 기반 계산

---

## 기술 스택

- **Next.js 15** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안정성
- **ReactFlow** - 인터랙티브 노드 기반 차트
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **TailwindCSS** - 유틸리티 우선 스타일링
- **Jest** - 테스팅 프레임워크

---

## 🚀 시작하기

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
→ http://localhost:3000

### 프로덕션 빌드
```bash
npm run build
npm start
```

### 테스트
```bash
npm test              # 단일 실행
npm run test:watch    # Watch 모드
```

---

## 📋 개발 가이드

### 스타일링
- Tailwind (레이아웃) + MUI (복잡한 컴포넌트) 조합
- `theme.ts`에서 조직도 스타일 통일
- 계층별 동적 스타일링 (CSS-in-JS)

### 타입 안정성
- 엄격한 TypeScript 설정
- Department, Config, ModelData, ProcessData 인터페이스
- 경로 별칭: `@/*` → 루트 디렉토리

### 빌드 설정
- ESLint 오류는 프로덕션 빌드 차단 안 함 (`next.config.ts`)
- Turbopack 개발 빌드 가속
- PostCSS로 Tailwind 처리

### 배포 (Vercel)
- 절대 경로 import 사용 (`@/components/...`)
- Node.js 20 명시 (`.nvmrc`, `package.json` engines)
- TypeScript 경로 해석 최적화

---

## 📝 주요 개념

### 계층 구조
```
PM (Plant Manager)
 └── LM (Line Manager) - 2개 라인당 1명
      └── GL (Group Leader) - 부서/섹션 레벨
           └── TL (Team Leader) - 팀 레벨
                └── TM (Team Member) - 개별 기여자
```

### 인원 분류
- **Direct**: 생산 라인 직접 인원
- **Indirect**: 지원 기능 (QA, MA, Warehouse 등)
- **OH (Overhead)**: 관리 및 간접 인원 (HR, Admin 등)

---

## 🤝 기여 및 문의

코드 개선, 버그 제보 등 언제든 환영합니다.
추가 문의는 프로젝트 관리자에게 연락하세요.

---

## 📄 라이선스

이 프로젝트는 내부 사용을 위한 것입니다.