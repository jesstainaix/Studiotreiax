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
      "lucide-react"
    ],
    exclude: [
      "ffmpeg.wasm",
      "ffmpeg.wasm/core",
      "@ffmpeg/ffmpeg",
      "@ffmpeg/util",
      "recharts",
      // Lazy load apenas quando necessário
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcU3R1ZGlvdHJlaWF4XzFcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHhhbXBwXFxcXGh0ZG9jc1xcXFxTdHVkaW90cmVpYXhfMVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzoveGFtcHAvaHRkb2NzL1N0dWRpb3RyZWlheF8xL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcidcbmltcG9ydCB2aXRlQ29tcHJlc3Npb24gZnJvbSAndml0ZS1wbHVnaW4tY29tcHJlc3Npb24nXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICAvLyBCdW5kbGUgYW5hbHl6ZXIgcGx1Z2luIC0gb25seSBpbiBwcm9kdWN0aW9uIGJ1aWxkXG4gICAgLi4uKG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/IFt2aXN1YWxpemVyKHtcbiAgICAgIGZpbGVuYW1lOiAnZGlzdC9zdGF0cy5odG1sJyxcbiAgICAgIG9wZW46IGZhbHNlLFxuICAgICAgZ3ppcFNpemU6IHRydWUsXG4gICAgICBicm90bGlTaXplOiB0cnVlLFxuICAgIH0pXSA6IFtdKSxcbiAgICAvLyBDb21wcmVzc2lvbiBwbHVnaW5zIG9ubHkgaW4gcHJvZHVjdGlvblxuICAgIC4uLihtb2RlID09PSAncHJvZHVjdGlvbicgPyBbXG4gICAgICB2aXRlQ29tcHJlc3Npb24oe1xuICAgICAgICBhbGdvcml0aG06ICdnemlwJyxcbiAgICAgICAgZXh0OiAnLmd6JyxcbiAgICAgICAgZGVsZXRlT3JpZ2luRmlsZTogZmFsc2UsXG4gICAgICAgIHRocmVzaG9sZDogMTAyNCxcbiAgICAgIH0pLFxuICAgICAgdml0ZUNvbXByZXNzaW9uKHtcbiAgICAgICAgYWxnb3JpdGhtOiAnYnJvdGxpQ29tcHJlc3MnLFxuICAgICAgICBleHQ6ICcuYnInLFxuICAgICAgICBkZWxldGVPcmlnaW5GaWxlOiBmYWxzZSxcbiAgICAgICAgdGhyZXNob2xkOiAxMDI0LFxuICAgICAgfSlcbiAgICBdIDogW10pLFxuICBdLFxuICAvLyBEZXNhYmlsaXRhciB2ZXJpZmljYVx1MDBFN1x1MDBFM28gZGUgdGlwb3MgZHVyYW50ZSBkZXNlbnZvbHZpbWVudG8gcGFyYSBtZWxob3IgcGVyZm9ybWFuY2VcbiAgZXNidWlsZDoge1xuICAgIGxvZ092ZXJyaWRlOiB7ICd0aGlzLWlzLXVuZGVmaW5lZC1pbi1lc20nOiAnc2lsZW50JyB9XG4gIH0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgICAnQGNvbXBvbmVudHMnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2NvbXBvbmVudHMnKSxcbiAgICAgICdAaG9va3MnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL2hvb2tzJyksXG4gICAgICAnQHV0aWxzJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy91dGlscycpLFxuICAgICAgJ0BwYWdlcyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMvcGFnZXMnKSxcbiAgICAgICdAdHlwZXMnOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjL3R5cGVzJyksXG4gICAgICByZWFjdDogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL25vZGVfbW9kdWxlcy9yZWFjdCcpLFxuICAgICAgJ3JlYWN0LWRvbSc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9ub2RlX21vZHVsZXMvcmVhY3QtZG9tJyksXG4gICAgfSxcbiAgICBkZWR1cGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC9qc3gtcnVudGltZScsXG4gICAgICAncmVhY3QvanN4LWRldi1ydW50aW1lJyxcbiAgICAgICdyZWFjdC1kb20vY2xpZW50JyxcbiAgICAgICdzY2hlZHVsZXInLFxuICAgICAgJ3VzZS1zeW5jLWV4dGVybmFsLXN0b3JlJ1xuICAgIF1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICAvLyBQZXJmb3JtYW5jZSBvcHRpbWl6YXRpb25zXG4gICAgdGFyZ2V0OiAnZXNuZXh0JyxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICBzb3VyY2VtYXA6IG1vZGUgPT09ICdkZXZlbG9wbWVudCcsXG4gICAgLy8gVXNhciBlc2J1aWxkIHBhcmEgZHJvcGFyIGxvZ3MgZW0gcHJvZFxuICAgIGVzYnVpbGQ6IG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/IHsgZHJvcDogWydjb25zb2xlJywgJ2RlYnVnZ2VyJ10sIGxlZ2FsQ29tbWVudHM6ICdub25lJyB9IDogdW5kZWZpbmVkLFxuICAgIFxuICAgIC8vIENvZGUgc3BsaXR0aW5nIGNvbmZpZ3VyYXRpb25cbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgICdyb3V0ZXItdmVuZG9yJzogWydyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgJ3VpLXZlbmRvcic6IFsnbHVjaWRlLXJlYWN0JywgJ3JlY2hhcnRzJ10sXG4gICAgICAgICAgLy8gUGVzYWRhcyBlIHJhcmFzXG4gICAgICAgICAgJ21lZGlhLWZmbXBlZyc6IFsnQGZmbXBlZy9mZm1wZWcnLCAnQGZmbXBlZy91dGlsJ10sXG4gICAgICAgICAgJ21sLXRmanMnOiBbJ0B0ZW5zb3JmbG93L3RmanMnLCAnQHRlbnNvcmZsb3cvdGZqcy1iYWNrZW5kLXdlYmdsJ10sXG4gICAgICAgICAgJ3RocmVlLWNvcmUnOiBbJ3RocmVlJywgJ3RocmVlLXN0ZGxpYicsICdAcGl4aXYvdGhyZWUtdnJtJ10sXG4gICAgICAgICAgJ3V0aWxzLXZlbmRvcic6IFsnenVzdGFuZCcsICdjbHN4JywgJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eScsICd0YWlsd2luZC1tZXJnZSddLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFBlcmZvcm1hbmNlIGNodW5rc1xuICAgICAgICAgICdwZXJmb3JtYW5jZS1jb3JlJzogW1xuICAgICAgICAgICAgJy4vc3JjL2hvb2tzL3VzZVBlcmZvcm1hbmNlT3B0aW1pemF0aW9uLnRzJyxcbiAgICAgICAgICAgICcuL3NyYy91dGlscy9wZXJmb3JtYW5jZU1vbml0b3IudHMnLFxuICAgICAgICAgICAgJy4vc3JjL3V0aWxzL3dlYlZpdGFsc1RyYWNrZXIudHMnXG4gICAgICAgICAgXSxcbiAgICAgICAgICAncGVyZm9ybWFuY2UtYW5hbHlzaXMnOiBbXG4gICAgICAgICAgICAnLi9zcmMvaG9va3MvdXNlQnVuZGxlQW5hbHlzaXMudHMnLFxuICAgICAgICAgICAgJy4vc3JjL3V0aWxzL2J1bmRsZUFuYWx5emVyLnRzJyxcbiAgICAgICAgICAgICcuL3NyYy9ob29rcy91c2VMYXp5TG9hZGluZy50cydcbiAgICAgICAgICBdLFxuICAgICAgICAgICdwZXJmb3JtYW5jZS1jYWNoZSc6IFtcbiAgICAgICAgICAgICcuL3NyYy91dGlscy9jYWNoZU1hbmFnZXIudHMnLFxuICAgICAgICAgICAgJy4vc3JjL2hvb2tzL3VzZVBlcmZvcm1hbmNlQnVkZ2V0cy50cycsXG4gICAgICAgICAgICAnLi9zcmMvdXRpbHMvcGVyZm9ybWFuY2VCdWRnZXRzLnRzJ1xuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICAvLyBDaHVuayBuYW1pbmcgZm9yIGJldHRlciBjYWNoaW5nXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XG4gICAgICAgICAgY29uc3QgZmFjYWRlTW9kdWxlSWQgPSBjaHVua0luZm8uZmFjYWRlTW9kdWxlSWRcbiAgICAgICAgICBpZiAoZmFjYWRlTW9kdWxlSWQpIHtcbiAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBmYWNhZGVNb2R1bGVJZC5zcGxpdCgnLycpLnBvcCgpPy5yZXBsYWNlKCcudHMnLCAnJykucmVwbGFjZSgnLnRzeCcsICcnKVxuICAgICAgICAgICAgcmV0dXJuIGBjaHVua3MvJHtuYW1lfS1baGFzaF0uanNgXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnY2h1bmtzL1tuYW1lXS1baGFzaF0uanMnXG4gICAgICAgIH0sXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldEluZm8ubmFtZT8uc3BsaXQoJy4nKSB8fCBbXVxuICAgICAgICAgIGNvbnN0IGV4dCA9IGluZm9baW5mby5sZW5ndGggLSAxXVxuICAgICAgICAgIFxuICAgICAgICAgIGlmICgvXFwuKHBuZ3xqcGU/Z3xzdmd8Z2lmfHRpZmZ8Ym1wfGljbykkL2kudGVzdChhc3NldEluZm8ubmFtZSB8fCAnJykpIHtcbiAgICAgICAgICAgIHJldHVybiBgaW1hZ2VzL1tuYW1lXS1baGFzaF0uJHtleHR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoL1xcLih3b2ZmMj98ZW90fHR0ZnxvdGYpJC9pLnRlc3QoYXNzZXRJbmZvLm5hbWUgfHwgJycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYGZvbnRzL1tuYW1lXS1baGFzaF0uJHtleHR9YFxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoL1xcLihjc3MpJC9pLnRlc3QoYXNzZXRJbmZvLm5hbWUgfHwgJycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYHN0eWxlcy9bbmFtZV0tW2hhc2hdLiR7ZXh0fWBcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGBhc3NldHMvW25hbWVdLVtoYXNoXS4ke2V4dH1gXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBFeHRlcm5hbCBkZXBlbmRlbmNpZXMgKGlmIG5lZWRlZClcbiAgICAgIGV4dGVybmFsOiBbXSxcbiAgICB9LFxuICAgIFxuICAgIC8vIFBlcmZvcm1hbmNlIGJ1ZGdldHNcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsIC8vIDFNQiB3YXJuaW5nXG4gICAgYXNzZXRzSW5saW5lTGltaXQ6IDQwOTYsIC8vIDRLQiBpbmxpbmUgbGltaXRcbiAgICBcbiAgICAvLyBDU1MgY29kZSBzcGxpdHRpbmdcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgXG4gICAgLy8gUmVwb3J0IGNvbXByZXNzZWQgc2l6ZVxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxuICB9LFxuICBcbiAgLy8gRGV2ZWxvcG1lbnQgc2VydmVyIGNvbmZpZ3VyYXRpb24gb3RpbWl6YWRvXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUwMDAsXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgY29yczogdHJ1ZSxcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gICAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIHBhcmEgcmVkdXppciBUVEZCXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiBmYWxzZSAvLyBSZWR1eiBvdmVyaGVhZCBlbSBkZXNlbnZvbHZpbWVudG9cbiAgICB9LFxuICAgIGZzOiB7XG4gICAgICBjYWNoZWRDaGVja3M6IGZhbHNlIC8vIERlc2FiaWxpdGEgdmVyaWZpY2FcdTAwRTdcdTAwRjVlcyBkZSBjYWNoZSBkZXNuZWNlc3NcdTAwRTFyaWFzXG4gICAgfVxuICB9LFxuICBcbiAgLy8gUHJldmlldyBzZXJ2ZXIgY29uZmlndXJhdGlvblxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogNDE3MyxcbiAgICBob3N0OiB0cnVlLFxuICAgIG9wZW46IHRydWUsXG4gIH0sXG4gIFxuICAvLyBPcHRpbWl6YXRpb24gY29uZmlndXJhdGlvbiBtZWxob3JhZG9cbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0L2pzeC1ydW50aW1lJyxcbiAgICAgICdyZWFjdC1kb20vY2xpZW50JyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICd6dXN0YW5kJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnXG4gICAgXSxcbiAgICBleGNsdWRlOiBbXG4gICAgICAnZmZtcGVnLndhc20nLFxuICAgICAgJ2ZmbXBlZy53YXNtL2NvcmUnLFxuICAgICAgJ0BmZm1wZWcvZmZtcGVnJyxcbiAgICAgICdAZmZtcGVnL3V0aWwnLFxuICAgICAgJ3JlY2hhcnRzJywgLy8gTGF6eSBsb2FkIGFwZW5hcyBxdWFuZG8gbmVjZXNzXHUwMEUxcmlvXG4gICAgICAnd2ViLXZpdGFscycgLy8gQ2FycmVnYWRvIGRpbmFtaWNhbWVudGVcbiAgICBdLFxuICAgIGZvcmNlOiBmYWxzZSwgLy8gUGVybWl0ZSBjYWNoZSBkZSBkZXBlbmRcdTAwRUFuY2lhc1xuICB9LFxuICBcbiAgLy8gQ1NTIGNvbmZpZ3VyYXRpb25cbiAgY3NzOiB7XG4gICAgZGV2U291cmNlbWFwOiB0cnVlLFxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgYWRkaXRpb25hbERhdGE6IGBAaW1wb3J0IFwiQC9zdHlsZXMvdmFyaWFibGVzLnNjc3NcIjtgLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBcbiAgLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG4gIGRlZmluZToge1xuICAgIF9fQVBQX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiksXG4gICAgX19CVUlMRF9USU1FX186IEpTT04uc3RyaW5naWZ5KG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSksXG4gIH0sXG4gIFxuICAvLyBXb3JrZXIgY29uZmlndXJhdGlvblxuICB3b3JrZXI6IHtcbiAgICBmb3JtYXQ6ICdlcycsXG4gICAgcGx1Z2luczogKCkgPT4gW10sXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnd29ya2Vycy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICd3b3JrZXJzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogJ3dvcmtlcnMvW25hbWVdLVtoYXNoXS5bZXh0XSdcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIFxuICAvLyBUZXN0IGNvbmZpZ3VyYXRpb25cbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgc2V0dXBGaWxlczogWycuL3NyYy90ZXN0L3NldHVwLnRzJ10sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHByb3ZpZGVyOiAndjgnLFxuICAgICAgcmVwb3J0ZXI6IFsndGV4dCcsICdqc29uJywgJ2h0bWwnXSxcbiAgICAgIGV4Y2x1ZGU6IFtcbiAgICAgICAgJ25vZGVfbW9kdWxlcy8nLFxuICAgICAgICAnc3JjL3Rlc3QvJyxcbiAgICAgICAgJyoqLyouZC50cycsXG4gICAgICAgICcqKi8qLmNvbmZpZy4qJyxcbiAgICAgICAgJ2Rpc3QvJyxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbiAgXG4gIC8vIEV4cGVyaW1lbnRhbCBmZWF0dXJlc1xuICBleHBlcmltZW50YWw6IHtcbiAgICByZW5kZXJCdWlsdFVybChmaWxlbmFtZSwgeyBob3N0VHlwZSB9KSB7XG4gICAgICBpZiAoaG9zdFR5cGUgPT09ICdqcycpIHtcbiAgICAgICAgcmV0dXJuIHsganM6IGAvJHtmaWxlbmFtZX1gIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7IHJlbGF0aXZlOiB0cnVlIH1cbiAgICAgIH1cbiAgICB9LFxuICB9LFxufSkpIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvUixTQUFTLG9CQUFvQjtBQUNqVCxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsa0JBQWtCO0FBQzNCLE9BQU8scUJBQXFCO0FBSjVCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBO0FBQUEsSUFFTixHQUFJLFNBQVMsZUFBZSxDQUFDLFdBQVc7QUFBQSxNQUN0QyxVQUFVO0FBQUEsTUFDVixNQUFNO0FBQUEsTUFDTixVQUFVO0FBQUEsTUFDVixZQUFZO0FBQUEsSUFDZCxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQUE7QUFBQSxJQUVQLEdBQUksU0FBUyxlQUFlO0FBQUEsTUFDMUIsZ0JBQWdCO0FBQUEsUUFDZCxXQUFXO0FBQUEsUUFDWCxLQUFLO0FBQUEsUUFDTCxrQkFBa0I7QUFBQSxRQUNsQixXQUFXO0FBQUEsTUFDYixDQUFDO0FBQUEsTUFDRCxnQkFBZ0I7QUFBQSxRQUNkLFdBQVc7QUFBQSxRQUNYLEtBQUs7QUFBQSxRQUNMLGtCQUFrQjtBQUFBLFFBQ2xCLFdBQVc7QUFBQSxNQUNiLENBQUM7QUFBQSxJQUNILElBQUksQ0FB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
