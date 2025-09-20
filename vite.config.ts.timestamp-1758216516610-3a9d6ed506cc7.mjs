// vite.config.ts
import { defineConfig } from "file:///C:/xampp/htdocs/Studiotreiax_1/node_modules/vite/dist/node/index.js";
import react from "file:///C:/xampp/htdocs/Studiotreiax_1/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
import { visualizer } from "file:///C:/xampp/htdocs/Studiotreiax_1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "C:\\xampp\\htdocs\\Studiotreiax_1";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    // Bundle analyzer plugin - only in build
    ...process.env.NODE_ENV === "production" ? [visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })] : []
  ],
  // Desabilitar verificação de tipos durante desenvolvimento para melhor performance
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" }
  },
  resolve: {
    alias: {
      "@": resolve(__vite_injected_original_dirname, "./src"),
      "@components": resolve(__vite_injected_original_dirname, "./src/components"),
      "@hooks": resolve(__vite_injected_original_dirname, "./src/hooks"),
      "@utils": resolve(__vite_injected_original_dirname, "./src/utils"),
      "@pages": resolve(__vite_injected_original_dirname, "./src/pages"),
      "@types": resolve(__vite_injected_original_dirname, "./src/types"),
      react: resolve(__vite_injected_original_dirname, "./node_modules/react"),
      "react-dom": resolve(__vite_injected_original_dirname, "./node_modules/react-dom")
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom/client",
      "scheduler",
      "use-sync-external-store"
    ]
  },
  build: {
    // Performance optimizations
    target: "esnext",
    minify: "esbuild",
    sourcemap: true,
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["react-router-dom"],
          "ui-vendor": ["lucide-react", "recharts"],
          "utils-vendor": ["zustand", "clsx", "class-variance-authority", "tailwind-merge"],
          // Performance chunks
          "performance-core": [
            "./src/hooks/usePerformanceOptimization.ts",
            "./src/utils/performanceMonitor.ts",
            "./src/utils/webVitalsTracker.ts"
          ],
          "performance-analysis": [
            "./src/hooks/useBundleAnalysis.ts",
            "./src/utils/bundleAnalyzer.ts",
            "./src/hooks/useLazyLoading.ts"
          ],
          "performance-cache": [
            "./src/utils/cacheManager.ts",
            "./src/hooks/usePerformanceBudgets.ts",
            "./src/utils/performanceBudgets.ts"
          ]
        },
        // Chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId;
          if (facadeModuleId) {
            const name = facadeModuleId.split("/").pop()?.replace(".ts", "").replace(".tsx", "");
            return `chunks/${name}-[hash].js`;
          }
          return "chunks/[name]-[hash].js";
        },
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || "")) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || "")) {
            return `fonts/[name]-[hash].${ext}`;
          }
          if (/\.(css)$/i.test(assetInfo.name || "")) {
            return `styles/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      },
      // External dependencies (if needed)
      external: []
    },
    // Performance budgets
    chunkSizeWarningLimit: 1e3,
    // 1MB warning
    assetsInlineLimit: 4096,
    // 4KB inline limit
    // CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true
  },
  // Development server configuration
  server: {
    port: 5001,
    host: "0.0.0.0",
    strictPort: true,
    cors: true,
    allowedHosts: true
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  // Optimization configuration
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react-dom/client",
      "react-router-dom",
      "zustand",
      "lucide-react",
      "recharts",
      "web-vitals"
    ],
    exclude: [
      "ffmpeg.wasm",
      "ffmpeg.wasm/core",
      "@ffmpeg/ffmpeg",
      "@ffmpeg/util"
    ],
    force: true
  },
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify((/* @__PURE__ */ new Date()).toISOString())
  },
  // Worker configuration
  worker: {
    format: "es",
    plugins: () => [],
    rollupOptions: {
      output: {
        entryFileNames: "workers/[name]-[hash].js",
        chunkFileNames: "workers/[name]-[hash].js",
        assetFileNames: "workers/[name]-[hash].[ext]"
      }
    }
  },
  // Test configuration
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "dist/"
      ]
    }
  },
  // Experimental features
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === "js") {
        return { js: `/${filename}` };
      } else {
        return { relative: true };
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcU3R1ZGlvdHJlaWF4XzFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHhhbXBwXFxcXGh0ZG9jc1xcXFxTdHVkaW90cmVpYXhfMVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzoveGFtcHAvaHRkb2NzL1N0dWRpb3RyZWlheF8xL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcidcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIC8vIEJ1bmRsZSBhbmFseXplciBwbHVnaW4gLSBvbmx5IGluIGJ1aWxkXG4gICAgLi4uKHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgPyBbdmlzdWFsaXplcih7XG4gICAgICBmaWxlbmFtZTogJ2Rpc3Qvc3RhdHMuaHRtbCcsXG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgICAgYnJvdGxpU2l6ZTogdHJ1ZSxcbiAgICB9KV0gOiBbXSksXG4gIF0sXG4gIC8vIERlc2FiaWxpdGFyIHZlcmlmaWNhXHUwMEU3XHUwMEUzbyBkZSB0aXBvcyBkdXJhbnRlIGRlc2Vudm9sdmltZW50byBwYXJhIG1lbGhvciBwZXJmb3JtYW5jZVxuICBlc2J1aWxkOiB7XG4gICAgbG9nT3ZlcnJpZGU6IHsgJ3RoaXMtaXMtdW5kZWZpbmVkLWluLWVzbSc6ICdzaWxlbnQnIH1cbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICAgICdAY29tcG9uZW50cyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29tcG9uZW50cycpLFxuICAgICAgJ0Bob29rcyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvaG9va3MnKSxcbiAgICAgICdAdXRpbHMnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL3V0aWxzJyksXG4gICAgICAnQHBhZ2VzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9wYWdlcycpLFxuICAgICAgJ0B0eXBlcyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvdHlwZXMnKSxcbiAgICAgIHJlYWN0OiByZXNvbHZlKF9fZGlybmFtZSwgJy4vbm9kZV9tb2R1bGVzL3JlYWN0JyksXG4gICAgICAncmVhY3QtZG9tJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdC1kb20nKSxcbiAgICB9LFxuICAgIGRlZHVwZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0L2pzeC1ydW50aW1lJyxcbiAgICAgICdyZWFjdC9qc3gtZGV2LXJ1bnRpbWUnLFxuICAgICAgJ3JlYWN0LWRvbS9jbGllbnQnLFxuICAgICAgJ3NjaGVkdWxlcicsXG4gICAgICAndXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUnXG4gICAgXVxuICB9LFxuICBidWlsZDoge1xuICAgIC8vIFBlcmZvcm1hbmNlIG9wdGltaXphdGlvbnNcbiAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBcbiAgICAvLyBDb2RlIHNwbGl0dGluZyBjb25maWd1cmF0aW9uXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFZlbmRvciBjaHVua3NcbiAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICAncm91dGVyLXZlbmRvcic6IFsncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgICd1aS12ZW5kb3InOiBbJ2x1Y2lkZS1yZWFjdCcsICdyZWNoYXJ0cyddLFxuICAgICAgICAgICd1dGlscy12ZW5kb3InOiBbJ3p1c3RhbmQnLCAnY2xzeCcsICdjbGFzcy12YXJpYW5jZS1hdXRob3JpdHknLCAndGFpbHdpbmQtbWVyZ2UnXSxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBQZXJmb3JtYW5jZSBjaHVua3NcbiAgICAgICAgICAncGVyZm9ybWFuY2UtY29yZSc6IFtcbiAgICAgICAgICAgICcuL3NyYy9ob29rcy91c2VQZXJmb3JtYW5jZU9wdGltaXphdGlvbi50cycsXG4gICAgICAgICAgICAnLi9zcmMvdXRpbHMvcGVyZm9ybWFuY2VNb25pdG9yLnRzJyxcbiAgICAgICAgICAgICcuL3NyYy91dGlscy93ZWJWaXRhbHNUcmFja2VyLnRzJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgJ3BlcmZvcm1hbmNlLWFuYWx5c2lzJzogW1xuICAgICAgICAgICAgJy4vc3JjL2hvb2tzL3VzZUJ1bmRsZUFuYWx5c2lzLnRzJyxcbiAgICAgICAgICAgICcuL3NyYy91dGlscy9idW5kbGVBbmFseXplci50cycsXG4gICAgICAgICAgICAnLi9zcmMvaG9va3MvdXNlTGF6eUxvYWRpbmcudHMnXG4gICAgICAgICAgXSxcbiAgICAgICAgICAncGVyZm9ybWFuY2UtY2FjaGUnOiBbXG4gICAgICAgICAgICAnLi9zcmMvdXRpbHMvY2FjaGVNYW5hZ2VyLnRzJyxcbiAgICAgICAgICAgICcuL3NyYy9ob29rcy91c2VQZXJmb3JtYW5jZUJ1ZGdldHMudHMnLFxuICAgICAgICAgICAgJy4vc3JjL3V0aWxzL3BlcmZvcm1hbmNlQnVkZ2V0cy50cydcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgLy8gQ2h1bmsgbmFtaW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgICBjaHVua0ZpbGVOYW1lczogKGNodW5rSW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGZhY2FkZU1vZHVsZUlkID0gY2h1bmtJbmZvLmZhY2FkZU1vZHVsZUlkXG4gICAgICAgICAgaWYgKGZhY2FkZU1vZHVsZUlkKSB7XG4gICAgICAgICAgICBjb25zdCBuYW1lID0gZmFjYWRlTW9kdWxlSWQuc3BsaXQoJy8nKS5wb3AoKT8ucmVwbGFjZSgnLnRzJywgJycpLnJlcGxhY2UoJy50c3gnLCAnJylcbiAgICAgICAgICAgIHJldHVybiBgY2h1bmtzLyR7bmFtZX0tW2hhc2hdLmpzYFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJ2NodW5rcy9bbmFtZV0tW2hhc2hdLmpzJ1xuICAgICAgICB9LFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcbiAgICAgICAgICBjb25zdCBpbmZvID0gYXNzZXRJbmZvLm5hbWU/LnNwbGl0KCcuJykgfHwgW11cbiAgICAgICAgICBjb25zdCBleHQgPSBpbmZvW2luZm8ubGVuZ3RoIC0gMV1cbiAgICAgICAgICBcbiAgICAgICAgICBpZiAoL1xcLihwbmd8anBlP2d8c3ZnfGdpZnx0aWZmfGJtcHxpY28pJC9pLnRlc3QoYXNzZXRJbmZvLm5hbWUgfHwgJycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYGltYWdlcy9bbmFtZV0tW2hhc2hdLiR7ZXh0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKC9cXC4od29mZjI/fGVvdHx0dGZ8b3RmKSQvaS50ZXN0KGFzc2V0SW5mby5uYW1lIHx8ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBmb250cy9bbmFtZV0tW2hhc2hdLiR7ZXh0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKC9cXC4oY3NzKSQvaS50ZXN0KGFzc2V0SW5mby5uYW1lIHx8ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBzdHlsZXMvW25hbWVdLVtoYXNoXS4ke2V4dH1gXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBgYXNzZXRzL1tuYW1lXS1baGFzaF0uJHtleHR9YFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gRXh0ZXJuYWwgZGVwZW5kZW5jaWVzIChpZiBuZWVkZWQpXG4gICAgICBleHRlcm5hbDogW10sXG4gICAgfSxcbiAgICBcbiAgICAvLyBQZXJmb3JtYW5jZSBidWRnZXRzXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLCAvLyAxTUIgd2FybmluZ1xuICAgIGFzc2V0c0lubGluZUxpbWl0OiA0MDk2LCAvLyA0S0IgaW5saW5lIGxpbWl0XG4gICAgXG4gICAgLy8gQ1NTIGNvZGUgc3BsaXR0aW5nXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgIFxuICAgIC8vIFJlcG9ydCBjb21wcmVzc2VkIHNpemVcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogdHJ1ZSxcbiAgfSxcbiAgXG4gIC8vIERldmVsb3BtZW50IHNlcnZlciBjb25maWd1cmF0aW9uXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUwMDEsXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgY29yczogdHJ1ZSxcbiAgICBhbGxvd2VkSG9zdHM6IHRydWVcbiAgfSxcbiAgXG4gIC8vIFByZXZpZXcgc2VydmVyIGNvbmZpZ3VyYXRpb25cbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBvcGVuOiB0cnVlLFxuICB9LFxuICBcbiAgLy8gT3B0aW1pemF0aW9uIGNvbmZpZ3VyYXRpb25cbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0L2pzeC1ydW50aW1lJyxcbiAgICAgICdyZWFjdC1kb20vY2xpZW50JyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICd6dXN0YW5kJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgJ3JlY2hhcnRzJyxcbiAgICAgICd3ZWItdml0YWxzJyxcbiAgICBdLFxuICAgIGV4Y2x1ZGU6IFtcbiAgICAgICdmZm1wZWcud2FzbScsXG4gICAgICAnZmZtcGVnLndhc20vY29yZScsXG4gICAgICAnQGZmbXBlZy9mZm1wZWcnLFxuICAgICAgJ0BmZm1wZWcvdXRpbCdcbiAgICBdLFxuICAgIGZvcmNlOiB0cnVlLFxuICB9LFxuICBcbiAgLy8gQ1NTIGNvbmZpZ3VyYXRpb25cbiAgY3NzOiB7XG4gICAgZGV2U291cmNlbWFwOiB0cnVlLFxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgYWRkaXRpb25hbERhdGE6IGBAaW1wb3J0IFwiQC9zdHlsZXMvdmFyaWFibGVzLnNjc3NcIjtgLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBcbiAgLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG4gIGRlZmluZToge1xuICAgIF9fQVBQX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiksXG4gICAgX19CVUlMRF9USU1FX186IEpTT04uc3RyaW5naWZ5KG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSksXG4gIH0sXG4gIFxuICAvLyBXb3JrZXIgY29uZmlndXJhdGlvblxuICB3b3JrZXI6IHtcbiAgICBmb3JtYXQ6ICdlcycsXG4gICAgcGx1Z2luczogKCkgPT4gW10sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnd29ya2Vycy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICd3b3JrZXJzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ3dvcmtlcnMvW25hbWVdLVtoYXNoXS5bZXh0XSdcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIFxuICAvLyBUZXN0IGNvbmZpZ3VyYXRpb25cbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgc2V0dXBGaWxlczogWycuL3NyYy90ZXN0L3NldHVwLnRzJ10sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgJ25vZGVfbW9kdWxlcy8nLFxuICAgICAgICAnc3JjL3Rlc3QvJyxcbiAgICAgICAgJyoqLyouZC50cycsXG4gICAgICAgICcqKi8qLmNvbmZpZy4qJyxcbiAgICAgICAgJ2Rpc3QvJyxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbiAgXG4gIC8vIEV4cGVyaW1lbnRhbCBmZWF0dXJlc1xuICBleHBlcmltZW50YWw6IHtcbiAgICByZW5kZXJCdWlsdFVybChmaWxlbmFtZSwgeyBob3N0VHlwZSB9KSB7XG4gICAgICBpZiAoaG9zdFR5cGUgPT09ICdqcycpIHtcbiAgICAgICAgcmV0dXJuIHsganM6IGAvJHtmaWxlbmFtZX1gIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7IHJlbGF0aXZlOiB0cnVlIH1cbiAgICAgIH1cbiAgICB9LFxuICB9LFxufSkiXSwKICAibWFw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
