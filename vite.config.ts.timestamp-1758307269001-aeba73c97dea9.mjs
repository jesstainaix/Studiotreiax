// vite.config.ts
import { defineConfig } from "file:///C:/xampp/htdocs/Studiotreiax_1/node_modules/vite/dist/node/index.js";
import react from "file:///C:/xampp/htdocs/Studiotreiax_1/node_modules/@vitejs/plugin-react/dist/index.js";
import { resolve } from "path";
import { visualizer } from "file:///C:/xampp/htdocs/Studiotreiax_1/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import viteCompression from "file:///C:/xampp/htdocs/Studiotreiax_1/node_modules/vite-plugin-compression/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\xampp\\htdocs\\Studiotreiax_1";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer plugin - only in production build
    ...mode === "production" ? [visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })] : [],
    // Compression plugins only in production
    ...mode === "production" ? [
      viteCompression({
        algorithm: "gzip",
        ext: ".gz",
        deleteOriginFile: false,
        threshold: 1024
      }),
      viteCompression({
        algorithm: "brotliCompress",
        ext: ".br",
        deleteOriginFile: false,
        threshold: 1024
      })
    ] : []
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
    sourcemap: mode === "development",
    // Usar esbuild para dropar logs em prod
    esbuild: mode === "production" ? { drop: ["console", "debugger"], legalComments: "none" } : void 0,
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom"],
          "router-vendor": ["react-router-dom"],
          "ui-vendor": ["lucide-react", "recharts"],
          // Pesadas e raras
          "media-ffmpeg": ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
          "ml-tfjs": ["@tensorflow/tfjs", "@tensorflow/tfjs-backend-webgl"],
          "three-core": ["three", "three-stdlib", "@pixiv/three-vrm"],
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
  // Development server configuration otimizado
  server: {
    port: 5e3,
    host: "0.0.0.0",
    strictPort: true,
    cors: true,
    allowedHosts: true,
    // Otimizações para reduzir TTFB
    hmr: {
      overlay: false
      // Reduz overhead em desenvolvimento
    },
    fs: {
      cachedChecks: false
      // Desabilita verificações de cache desnecessárias
    }
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    open: true
  },
  // Optimization configuration melhorado
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react-dom/client",
      "react-router-dom",
      "zustand",
      "lucide-react",
      // Ensure these are pre-bundled to avoid ESM/CJS interop issues
      "recharts",
      "lodash"
    ],
    exclude: [
      "ffmpeg.wasm",
      "ffmpeg.wasm/core",
      "@ffmpeg/ffmpeg",
      "@ffmpeg/util",
      // Removed 'recharts' from exclude to allow proper pre-bundling
      "web-vitals"
      // Carregado dinamicamente
    ],
    force: false
    // Permite cache de dependências
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
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcU3R1ZGlvdHJlaWF4XzFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHhhbXBwXFxcXGh0ZG9jc1xcXFxTdHVkaW90cmVpYXhfMVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzoveGFtcHAvaHRkb2NzL1N0dWRpb3RyZWlheF8xL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcclxuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcidcclxuaW1wb3J0IHZpdGVDb21wcmVzc2lvbiBmcm9tICd2aXRlLXBsdWdpbi1jb21wcmVzc2lvbidcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIC8vIEJ1bmRsZSBhbmFseXplciBwbHVnaW4gLSBvbmx5IGluIHByb2R1Y3Rpb24gYnVpbGRcclxuICAgIC4uLihtb2RlID09PSAncHJvZHVjdGlvbicgPyBbdmlzdWFsaXplcih7XHJcbiAgICAgIGZpbGVuYW1lOiAnZGlzdC9zdGF0cy5odG1sJyxcclxuICAgICAgb3BlbjogZmFsc2UsXHJcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxyXG4gICAgICBicm90bGlTaXplOiB0cnVlLFxyXG4gICAgfSldIDogW10pLFxyXG4gICAgLy8gQ29tcHJlc3Npb24gcGx1Z2lucyBvbmx5IGluIHByb2R1Y3Rpb25cclxuICAgIC4uLihtb2RlID09PSAncHJvZHVjdGlvbicgPyBbXHJcbiAgICAgIHZpdGVDb21wcmVzc2lvbih7XHJcbiAgICAgICAgYWxnb3JpdGhtOiAnZ3ppcCcsXHJcbiAgICAgICAgZXh0OiAnLmd6JyxcclxuICAgICAgICBkZWxldGVPcmlnaW5GaWxlOiBmYWxzZSxcclxuICAgICAgICB0aHJlc2hvbGQ6IDEwMjQsXHJcbiAgICAgIH0pLFxyXG4gICAgICB2aXRlQ29tcHJlc3Npb24oe1xyXG4gICAgICAgIGFsZ29yaXRobTogJ2Jyb3RsaUNvbXByZXNzJyxcclxuICAgICAgICBleHQ6ICcuYnInLFxyXG4gICAgICAgIGRlbGV0ZU9yaWdpbkZpbGU6IGZhbHNlLFxyXG4gICAgICAgIHRocmVzaG9sZDogMTAyNCxcclxuICAgICAgfSlcclxuICAgIF0gOiBbXSksXHJcbiAgXSxcclxuICAvLyBEZXNhYmlsaXRhciB2ZXJpZmljYVx1MDBFN1x1MDBFM28gZGUgdGlwb3MgZHVyYW50ZSBkZXNlbnZvbHZpbWVudG8gcGFyYSBtZWxob3IgcGVyZm9ybWFuY2VcclxuICBlc2J1aWxkOiB7XHJcbiAgICBsb2dPdmVycmlkZTogeyAndGhpcy1pcy11bmRlZmluZWQtaW4tZXNtJzogJ3NpbGVudCcgfVxyXG4gIH0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXHJcbiAgICAgICdAY29tcG9uZW50cyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvY29tcG9uZW50cycpLFxyXG4gICAgICAnQGhvb2tzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9ob29rcycpLFxyXG4gICAgICAnQHV0aWxzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy91dGlscycpLFxyXG4gICAgICAnQHBhZ2VzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9wYWdlcycpLFxyXG4gICAgICAnQHR5cGVzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy90eXBlcycpLFxyXG4gICAgICByZWFjdDogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdCcpLFxyXG4gICAgICAncmVhY3QtZG9tJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdC1kb20nKSxcclxuICAgIH0sXHJcbiAgICBkZWR1cGU6IFtcclxuICAgICAgJ3JlYWN0JyxcclxuICAgICAgJ3JlYWN0LWRvbScsXHJcbiAgICAgICdyZWFjdC9qc3gtcnVudGltZScsXHJcbiAgICAgICdyZWFjdC9qc3gtZGV2LXJ1bnRpbWUnLFxyXG4gICAgICAncmVhY3QtZG9tL2NsaWVudCcsXHJcbiAgICAgICdzY2hlZHVsZXInLFxyXG4gICAgICAndXNlLXN5bmMtZXh0ZXJuYWwtc3RvcmUnXHJcbiAgICBdXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgLy8gUGVyZm9ybWFuY2Ugb3B0aW1pemF0aW9uc1xyXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcclxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxyXG4gICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxyXG4gICAgLy8gVXNhciBlc2J1aWxkIHBhcmEgZHJvcGFyIGxvZ3MgZW0gcHJvZFxyXG4gICAgZXNidWlsZDogbW9kZSA9PT0gJ3Byb2R1Y3Rpb24nID8geyBkcm9wOiBbJ2NvbnNvbGUnLCAnZGVidWdnZXInXSwgbGVnYWxDb21tZW50czogJ25vbmUnIH0gOiB1bmRlZmluZWQsXHJcbiAgICBcclxuICAgIC8vIENvZGUgc3BsaXR0aW5nIGNvbmZpZ3VyYXRpb25cclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAvLyBWZW5kb3IgY2h1bmtzXHJcbiAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcclxuICAgICAgICAgICdyb3V0ZXItdmVuZG9yJzogWydyZWFjdC1yb3V0ZXItZG9tJ10sXHJcbiAgICAgICAgICAndWktdmVuZG9yJzogWydsdWNpZGUtcmVhY3QnLCAncmVjaGFydHMnXSxcclxuICAgICAgICAgIC8vIFBlc2FkYXMgZSByYXJhc1xyXG4gICAgICAgICAgJ21lZGlhLWZmbXBlZyc6IFsnQGZmbXBlZy9mZm1wZWcnLCAnQGZmbXBlZy91dGlsJ10sXHJcbiAgICAgICAgICAnbWwtdGZqcyc6IFsnQHRlbnNvcmZsb3cvdGZqcycsICdAdGVuc29yZmxvdy90ZmpzLWJhY2tlbmQtd2ViZ2wnXSxcclxuICAgICAgICAgICd0aHJlZS1jb3JlJzogWyd0aHJlZScsICd0aHJlZS1zdGRsaWInLCAnQHBpeGl2L3RocmVlLXZybSddLFxyXG4gICAgICAgICAgJ3V0aWxzLXZlbmRvcic6IFsnenVzdGFuZCcsICdjbHN4JywgJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eScsICd0YWlsd2luZC1tZXJnZSddLFxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICAvLyBQZXJmb3JtYW5jZSBjaHVua3NcclxuICAgICAgICAgICdwZXJmb3JtYW5jZS1jb3JlJzogW1xyXG4gICAgICAgICAgICAnLi9zcmMvaG9va3MvdXNlUGVyZm9ybWFuY2VPcHRpbWl6YXRpb24udHMnLFxyXG4gICAgICAgICAgICAnLi9zcmMvdXRpbHMvcGVyZm9ybWFuY2VNb25pdG9yLnRzJyxcclxuICAgICAgICAgICAgJy4vc3JjL3V0aWxzL3dlYlZpdGFsc1RyYWNrZXIudHMnXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgJ3BlcmZvcm1hbmNlLWFuYWx5c2lzJzogW1xyXG4gICAgICAgICAgICAnLi9zcmMvaG9va3MvdXNlQnVuZGxlQW5hbHlzaXMudHMnLFxyXG4gICAgICAgICAgICAnLi9zcmMvdXRpbHMvYnVuZGxlQW5hbHl6ZXIudHMnLFxyXG4gICAgICAgICAgICAnLi9zcmMvaG9va3MvdXNlTGF6eUxvYWRpbmcudHMnXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgJ3BlcmZvcm1hbmNlLWNhY2hlJzogW1xyXG4gICAgICAgICAgICAnLi9zcmMvdXRpbHMvY2FjaGVNYW5hZ2VyLnRzJyxcclxuICAgICAgICAgICAgJy4vc3JjL2hvb2tzL3VzZVBlcmZvcm1hbmNlQnVkZ2V0cy50cycsXHJcbiAgICAgICAgICAgICcuL3NyYy91dGlscy9wZXJmb3JtYW5jZUJ1ZGdldHMudHMnXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ2h1bmsgbmFtaW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XHJcbiAgICAgICAgICBjb25zdCBmYWNhZGVNb2R1bGVJZCA9IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZFxyXG4gICAgICAgICAgaWYgKGZhY2FkZU1vZHVsZUlkKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBmYWNhZGVNb2R1bGVJZC5zcGxpdCgnLycpLnBvcCgpPy5yZXBsYWNlKCcudHMnLCAnJykucmVwbGFjZSgnLnRzeCcsICcnKVxyXG4gICAgICAgICAgICByZXR1cm4gYGNodW5rcy8ke25hbWV9LVtoYXNoXS5qc2BcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIHJldHVybiAnY2h1bmtzL1tuYW1lXS1baGFzaF0uanMnXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xyXG4gICAgICAgICAgY29uc3QgaW5mbyA9IGFzc2V0SW5mby5uYW1lPy5zcGxpdCgnLicpIHx8IFtdXHJcbiAgICAgICAgICBjb25zdCBleHQgPSBpbmZvW2luZm8ubGVuZ3RoIC0gMV1cclxuICAgICAgICAgIFxyXG4gICAgICAgICAgaWYgKC9cXC4ocG5nfGpwZT9nfHN2Z3xnaWZ8dGlmZnxibXB8aWNvKSQvaS50ZXN0KGFzc2V0SW5mby5uYW1lIHx8ICcnKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gYGltYWdlcy9bbmFtZV0tW2hhc2hdLiR7ZXh0fWBcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICgvXFwuKHdvZmYyP3xlb3R8dHRmfG90ZikkL2kudGVzdChhc3NldEluZm8ubmFtZSB8fCAnJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBmb250cy9bbmFtZV0tW2hhc2hdLiR7ZXh0fWBcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICgvXFwuKGNzcykkL2kudGVzdChhc3NldEluZm8ubmFtZSB8fCAnJykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGBzdHlsZXMvW25hbWVdLVtoYXNoXS4ke2V4dH1gXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICByZXR1cm4gYGFzc2V0cy9bbmFtZV0tW2hhc2hdLiR7ZXh0fWBcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgICBcclxuICAgICAgLy8gRXh0ZXJuYWwgZGVwZW5kZW5jaWVzIChpZiBuZWVkZWQpXHJcbiAgICAgIGV4dGVybmFsOiBbXSxcclxuICAgIH0sXHJcbiAgICBcclxuICAgIC8vIFBlcmZvcm1hbmNlIGJ1ZGdldHNcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCwgLy8gMU1CIHdhcm5pbmdcclxuICAgIGFzc2V0c0lubGluZUxpbWl0OiA0MDk2LCAvLyA0S0IgaW5saW5lIGxpbWl0XHJcbiAgICBcclxuICAgIC8vIENTUyBjb2RlIHNwbGl0dGluZ1xyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gICAgXHJcbiAgICAvLyBSZXBvcnQgY29tcHJlc3NlZCBzaXplXHJcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogdHJ1ZSxcclxuICB9LFxyXG4gIFxyXG4gIC8vIERldmVsb3BtZW50IHNlcnZlciBjb25maWd1cmF0aW9uIG90aW1pemFkb1xyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogNTAwMCxcclxuICAgIGhvc3Q6ICcwLjAuMC4wJyxcclxuICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICBjb3JzOiB0cnVlLFxyXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxyXG4gICAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIHBhcmEgcmVkdXppciBUVEZCXHJcbiAgICBobXI6IHtcclxuICAgICAgb3ZlcmxheTogZmFsc2UgLy8gUmVkdXogb3ZlcmhlYWQgZW0gZGVzZW52b2x2aW1lbnRvXHJcbiAgICB9LFxyXG4gICAgZnM6IHtcclxuICAgICAgY2FjaGVkQ2hlY2tzOiBmYWxzZSAvLyBEZXNhYmlsaXRhIHZlcmlmaWNhXHUwMEU3XHUwMEY1ZXMgZGUgY2FjaGUgZGVzbmVjZXNzXHUwMEUxcmlhc1xyXG4gICAgfVxyXG4gIH0sXHJcbiAgXHJcbiAgLy8gUHJldmlldyBzZXJ2ZXIgY29uZmlndXJhdGlvblxyXG4gIHByZXZpZXc6IHtcclxuICAgIHBvcnQ6IDQxNzMsXHJcbiAgICBob3N0OiB0cnVlLFxyXG4gICAgb3BlbjogdHJ1ZSxcclxuICB9LFxyXG4gIFxyXG4gIC8vIE9wdGltaXphdGlvbiBjb25maWd1cmF0aW9uIG1lbGhvcmFkb1xyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1xyXG4gICAgICAncmVhY3QnLFxyXG4gICAgICAncmVhY3QtZG9tJyxcclxuICAgICAgJ3JlYWN0L2pzeC1ydW50aW1lJyxcclxuICAgICAgJ3JlYWN0LWRvbS9jbGllbnQnLFxyXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXHJcbiAgICAgICd6dXN0YW5kJyxcclxuICAgICAgJ2x1Y2lkZS1yZWFjdCcsXHJcbiAgICAgIC8vIEVuc3VyZSB0aGVzZSBhcmUgcHJlLWJ1bmRsZWQgdG8gYXZvaWQgRVNNL0NKUyBpbnRlcm9wIGlzc3Vlc1xyXG4gICAgICAncmVjaGFydHMnLFxyXG4gICAgICAnbG9kYXNoJ1xyXG4gICAgXSxcclxuICAgIGV4Y2x1ZGU6IFtcclxuICAgICAgJ2ZmbXBlZy53YXNtJyxcclxuICAgICAgJ2ZmbXBlZy53YXNtL2NvcmUnLFxyXG4gICAgICAnQGZmbXBlZy9mZm1wZWcnLFxyXG4gICAgICAnQGZmbXBlZy91dGlsJyxcclxuICAgICAgLy8gUmVtb3ZlZCAncmVjaGFydHMnIGZyb20gZXhjbHVkZSB0byBhbGxvdyBwcm9wZXIgcHJlLWJ1bmRsaW5nXHJcbiAgICAgICd3ZWItdml0YWxzJyAvLyBDYXJyZWdhZG8gZGluYW1pY2FtZW50ZVxyXG4gICAgXSxcclxuICAgIGZvcmNlOiBmYWxzZSwgLy8gUGVybWl0ZSBjYWNoZSBkZSBkZXBlbmRcdTAwRUFuY2lhc1xyXG4gIH0sXHJcbiAgXHJcbiAgLy8gQ1NTIGNvbmZpZ3VyYXRpb25cclxuICBjc3M6IHtcclxuICAgIGRldlNvdXJjZW1hcDogdHJ1ZSxcclxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgc2Nzczoge1xyXG4gICAgICAgIGFkZGl0aW9uYWxEYXRhOiBgQGltcG9ydCBcIkAvc3R5bGVzL3ZhcmlhYmxlcy5zY3NzXCI7YCxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBcclxuICAvLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcclxuICBkZWZpbmU6IHtcclxuICAgIF9fQVBQX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiksXHJcbiAgICBfX0JVSUxEX1RJTUVfXzogSlNPTi5zdHJpbmdpZnkobmV3IERhdGUoKS50b0lTT1N0cmluZygpKSxcclxuICB9LFxyXG4gIFxyXG4gIC8vIFdvcmtlciBjb25maWd1cmF0aW9uXHJcbiAgd29ya2VyOiB7XHJcbiAgICBmb3JtYXQ6ICdlcycsXHJcbiAgICBwbHVnaW5zOiAoKSA9PiBbXSxcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgZW50cnlGaWxlTmFtZXM6ICd3b3JrZXJzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnd29ya2Vycy9bbmFtZV0tW2hhc2hdLmpzJyxcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ3dvcmtlcnMvW25hbWVdLVtoYXNoXS5bZXh0XSdcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgXHJcbiAgLy8gVGVzdCBjb25maWd1cmF0aW9uXHJcbiAgdGVzdDoge1xyXG4gICAgZ2xvYmFsczogdHJ1ZSxcclxuICAgIGVudmlyb25tZW50OiAnanNkb20nLFxyXG4gICAgc2V0dXBGaWxlczogWycuL3NyYy90ZXN0L3NldHVwLnRzJ10sXHJcbiAgICBjb3ZlcmFnZToge1xyXG4gICAgICBwcm92aWRlcjogJ3Y4JyxcclxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcclxuICAgICAgZXhjbHVkZTogW1xyXG4gICAgICAgICdub2RlX21vZHVsZXMvJyxcclxuICAgICAgICAnc3JjL3Rlc3QvJyxcclxuICAgICAgICAnKiovKi5kLnRzJyxcclxuICAgICAgICAnKiovKi5jb25maWcuKicsXHJcbiAgICAgICAgJ2Rpc3QvJyxcclxuICAgICAgXSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBcclxuICAvLyBFeHBlcmltZW50YWwgZmVhdHVyZXNcclxuICBleHBlcmltZW50YWw6IHtcclxuICAgIHJlbmRlckJ1aWx0VXJsKGZpbGVuYW1lLCB7IGhvc3RUeXBlIH0pIHtcclxuICAgICAgaWYgKGhvc3RUeXBlID09PSAnanMnKSB7XHJcbiAgICAgICAgcmV0dXJuIHsganM6IGAvJHtmaWxlbmFtZX1gIH1cclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4geyByZWxhdGl2ZTogdHJ1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
