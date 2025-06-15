import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 프로덕션 빌드(Vercel)에서 ESLint 에러가 나와도 빌드를 멈추지 않음
    ignoreDuringBuilds: true,
  },
  // (선택) 타입 오류도 임시 무시하고 싶다면 ↓
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
