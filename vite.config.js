import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import rollupReplace from "@rollup/plugin-replace";

export default defineConfig({
  server: {
    host: "0.0.0.0", // Cho phép truy cập từ mạng LAN (có thể bỏ nếu không cần)
    port: 5100,
    strictPort: true, // Nếu 5100 bị chiếm sẽ báo lỗi, không tự chuyển sang 5101
  },

  resolve: {
    alias: [
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },

  plugins: [
    rollupReplace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(true),
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
    }),
    react(),
  ],
});
