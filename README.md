# 조직도 생성기 (Organization Chart Generator)

> **빌드 상태**: TypeScript 타입 에러 수정 완료 (2024-01-XX)

이 프로젝트는 **제조/생산 조직의 인원 구조를 시각화하고, 다양한 기준(라인, 플랜트, 지원부서 등)으로 인원 배분을 분석**하는 웹 애플리케이션입니다. Next.js(React) 기반으로 개발되었으며, ReactFlow를 활용해 조직도를 직관적으로 표현합니다.

---

## 주요 기능

- **조직도 시각화**  
  생산 라인, 플랜트, 지원부서 등 다양한 관점에서 조직도를 그래픽으로 확인할 수 있습니다.
- **인원 배분/집계**  
  Direct/Indirect/OH(Overhead) 구분에 따라 인원 집계가 가능합니다.
- **모델 기반 인원 산정**  
  CSV 등 외부 데이터 기반으로 모델별 공정/인원 정보를 불러와 분석할 수 있습니다.
- **다양한 뷰 제공**  
  Line, Plant, Support Department, Aggregation(Direct/Indirect+OH), Model-based 등 여러 페이지로 조직도를 탐색할 수 있습니다.

---

## 📁 폴더 구조 및 주요 파일 설명

```
generator_v4.0/
├── app/                # Next.js 엔트리, 전체 레이아웃 및 글로벌 스타일
│   ├── layout.tsx      # 전체 앱 레이아웃(폰트, 글로벌 CSS 등)
│   ├── page.tsx        # 메인 페이지(조직도 뷰 선택 및 렌더링)
│   └── globals.css     # Tailwind 기반 글로벌 스타일
│
├── components/
│   ├── common/         # 조직도/공정 시각화 공통 컴포넌트
│   │   ├── OrganizationTree.tsx      # 조직도 트리 구조, 박스, 연결선 등 시각화 핵심
│   │   ├── ReactFlowOrgChart.tsx     # ReactFlow 기반 조직도(라인별 계층 구조)
│   │   ├── ReactFlowPage1/2/3.tsx    # 각 페이지별 조직도(공정별, 부서별 등) 시각화
│   │   ├── InteractivePositionBox.tsx# 상호작용 가능한 직책 박스(선택, 드래그, 편집 등)
│   │   ├── spacingConfig.ts          # 조직도 간격/레이아웃 설정
│   │   └── styles.ts                 # 공통 스타일 상수
│   │
│   └── pages/         # 각 조직도 뷰(페이지)별 컴포넌트
│       ├── page1.tsx  # 라인별 조직도(공정 중심)
│       ├── page2.tsx  # 플랜트/부서별 조직도
│       ├── page3.tsx  # 지원부서 조직도
│       ├── page4-direct.tsx   # Direct 인원 집계
│       ├── page4-indirect.tsx # Indirect+OH 인원 집계
│       └── page5.tsx  # 모델 기반 인원 산정
│
├── context/
│   └── OrgChartContext.tsx    # 조직도/인원 데이터 전역 상태 관리(Context API)
│
├── reference/      # 참고용 데이터/이미지
│   ├── direct 인원분석.csv   # 인원 분석 예시 데이터
│   ├── 조직도.png           # 조직도 예시 이미지
│   └── 조직도_박스.png      # 박스 스타일 예시 이미지
│
├── tailwind.config.js/ts     # TailwindCSS 설정
├── package.json              # 의존성 및 스크립트
└── ... (기타 설정/빌드 파일)
```

---

## 🔍 주요 컴포넌트/함수 역할

### 1. `app/`
- **layout.tsx**: 전체 앱의 레이아웃, 폰트, 글로벌 스타일 적용.
- **page.tsx**: 드롭다운으로 조직도 뷰(Page1~5) 선택, 각 페이지 컴포넌트 렌더링.

### 2. `components/common/`
- **OrganizationTree.tsx**
  - 조직도 트리 구조, 직책 박스(`PositionBox`), 연결선, 계층별 배치 등 시각화의 핵심.
  - `OrganizationTree` 컴포넌트: 페이지별 조직도 트리 렌더링.
  - `PositionBox`: 직책(예: GL, TL, TM 등) 박스 UI.
  - `LMGroup`, `MultiColumnDepartmentSection`: 라인/부서별 그룹화 및 배치.
  - `getProcessGroups`, `calculatePositionCount` 등: 공정/직책별 데이터 가공.

- **ReactFlowOrgChart.tsx**
  - ReactFlow 기반 조직도(라인별 계층 구조) 시각화.
  - `generateNodes`, `generateEdges`: 계층별 노드/엣지 자동 생성.

- **ReactFlowPage1/2/3.tsx**
  - 각 페이지별(공정별, 부서별 등) 조직도 시각화.
  - `getProcessGroups`: 모델/공정 데이터 기반 계층 구조 생성.

- **InteractivePositionBox.tsx**
  - 상호작용 가능한 직책 박스(선택, 드래그, 더블클릭 편집 등).
  - `useInteractivePositionBox`: 박스 선택/하이라이트/편집 등 상태 관리 훅.
  - `PositionData` 인터페이스: 박스별 상세 정보 구조.

- **spacingConfig.ts, styles.ts**
  - 조직도 간격, 색상, 레이아웃 등 공통 스타일/설정.

### 3. `components/pages/`
- **page1.tsx**: 라인별 조직도(공정 중심, 모델별 시뮬레이션).
- **page2.tsx**: 플랜트/부서별 조직도.
- **page3.tsx**: 지원부서 조직도.
- **page4-direct.tsx**: Direct 인원 집계/분석.
- **page4-indirect.tsx**: Indirect+OH 인원 집계/분석.
- **page5.tsx**: 모델 기반 인원 산정(외부 데이터 활용).

### 4. `context/OrgChartContext.tsx`
- 조직도/인원 데이터 전역 상태 관리(Context API).
- `OrgChartProvider`: 전체 앱에 데이터/상태 제공.
- `useOrgChart`: 조직도 데이터, 부서/공정/모델 정보, 인원 집계 등 제공.
- 부서/공정/모델별 데이터 구조, 인원 계산 함수 등 포함.
- **주요 직책 구조**: PM(Project Manager), LM(Line Manager), GL(Group Leader), TL(Team Leader), TM(Team Member) 등의 계층 구조로 조직.

### 5. `reference/`
- 실제 조직도, 인원 분석 예시 데이터(CSV, 이미지 등).

---

## 🛠️ 주요 함수/로직 예시

- **getProcessGroups(config, selectedModel?)**  
  공정/모델 데이터 기반으로 GL, TL, TM 등 계층별 그룹을 생성.
- **calculatePositionCount(position)**  
  각 직책(PM, LM, GL, TL, TM)별 인원 수 계산.
- **useInteractivePositionBox()**  
  박스 선택/하이라이트/편집 등 상호작용 상태 관리.
- **generateNodes(), generateEdges()**  
  조직도 계층별 노드/엣지 자동 생성(ReactFlow 기반).
- **updateDepartment, updateConfig, updateModel**  
  부서/공정/모델 데이터 동적 업데이트.

---

## 설치 및 실행 방법

1. **의존성 설치**
   ```bash
   npm install
   # 또는
   yarn install
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   # 또는
   yarn dev
   ```

3. **브라우저에서 접속**
   ```
   http://localhost:3000
   ```

---

## 주요 기술 스택

- **Next.js** (React 기반 프레임워크)
- **TypeScript**
- **ReactFlow** (조직도/그래프 시각화)
- **MUI(Material UI)** (UI 컴포넌트)
- **TailwindCSS** (스타일링)

---

## 참고/확장

- `reference/` 폴더의 CSV, PNG 파일은 실제 조직도/인원 데이터 예시입니다.
- 각 페이지별 상세 로직은 `components/pages/` 및 `components/common/` 폴더를 참고하세요.

---

## 기여 및 문의

- 코드/기능 개선, 버그 제보 등은 언제든 환영합니다.
- 추가 문의는 프로젝트 관리자에게 연락 바랍니다.
