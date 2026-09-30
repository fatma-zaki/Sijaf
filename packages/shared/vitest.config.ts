import { defineConfig } from "vitest/config";

// forks بياخد timeout على Windows، فبنستخدم threads
export default defineConfig({ test: { pool: "threads", include: ["src/**/*.test.ts"] } });
