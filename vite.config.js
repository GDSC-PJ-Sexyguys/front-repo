import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://13.125.239.73:8080", // API 서버 주소
        changeOrigin: true,
      },
    },
  },
});
