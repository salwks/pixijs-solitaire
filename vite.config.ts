import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  server: {
    port: 3000,
    open: true, // 자동으로 브라우저 열기
    host: true, // 네트워크에서 접근 가능
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
});
