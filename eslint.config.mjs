import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable strict rules for a hobby project
      "@typescript-eslint/no-unused-vars": "warn", // Change from error to warning
      "react/no-unescaped-entities": "off", // Allow unescaped quotes/apostrophes
      "@next/next/no-html-link-for-pages": "off", // Allow <a> tags for external links
      "@next/next/no-img-element": "off", // Allow <img> tags
      "react-hooks/exhaustive-deps": "warn", // Change from error to warning
      "@typescript-eslint/no-explicit-any": "off", // Allow 'any' type
    },
  },
];

export default eslintConfig;
