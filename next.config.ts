import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // 프로젝트 루트를 명시해 workspace root 감지 오류 방지
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
