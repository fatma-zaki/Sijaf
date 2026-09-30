import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// الواجهة RTL: لازم logical properties (ms/me/ps/pe/start/end) بدل left/right
const physicalDirectionClass =
  "/(^|[\\s:])-?(ml|mr|pl|pr|left|right|rounded-l|rounded-r|border-l|border-r|text-left|text-right|float-left|float-right)(-|\\s|$)/";
const physicalDirectionMessage = "استخدم logical properties (ms-/me-/ps-/pe-/start-/end-/text-start) بدل left/right.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-syntax": [
        "error",
        { selector: `JSXAttribute[name.name='className'] Literal[value=${physicalDirectionClass}]`, message: physicalDirectionMessage },
        { selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=${physicalDirectionClass}]`, message: physicalDirectionMessage },
        { selector: `CallExpression[callee.name='cn'] Literal[value=${physicalDirectionClass}]`, message: physicalDirectionMessage },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "design/**"]),
]);

export default eslintConfig;
