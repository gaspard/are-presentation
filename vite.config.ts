import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { defineConfig } from "vite";
import tsconfig_paths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
      }),
    },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tsconfig_paths(),
  ],
  base: "/are-presentation",
});
