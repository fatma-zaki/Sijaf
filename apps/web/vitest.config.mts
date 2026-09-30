import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    // forks بياخد timeout على Windows، فبنستخدم threads
    pool: "threads",
    // الـ jsdom workers تقيلة؛ عدد قليل بيمنع timeout وقت البدء على الأجهزة البطيئة
    maxWorkers: 2,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
