import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { markdownPlugin } from "./markdown-plugin";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), markdownPlugin],
});
