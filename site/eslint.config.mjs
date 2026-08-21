import next from "eslint-config-next";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".next/**",
      // Isolated verification build output (npm run build:check) — generated,
      // never hand-edited; without this, lint after a build:check scans it.
      ".next-verify/**",
      "node_modules/**",
      "public/**",
      "next-env.d.ts",
      // Stray generated types from a prior react-router install — not used at runtime
      ".react-router/**",
    ],
  },
  {
    rules: {
      "@next/next/no-img-element": "error",
    },
  },
];

export default config;
