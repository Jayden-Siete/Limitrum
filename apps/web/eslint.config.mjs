import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const requireFromNext = createRequire(require.resolve("eslint-config-next/package.json"));

const nextPlugin = requireFromNext("@next/eslint-plugin-next");
const tsParser = requireFromNext("@typescript-eslint/parser");
const tsPlugin = requireFromNext("@typescript-eslint/eslint-plugin");
const reactHooksPlugin = requireFromNext("eslint-plugin-react-hooks");

export default [
  {
    ignores: [".next/**", "out/**", "build/**", "tmp-next-dev/**", "next-env.d.ts"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...tsPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
];
