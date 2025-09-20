import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer plugin - only in production build
    ...(mode === 'production' ? [visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    })] : []),
    // Compression plugins only in production
    ...(mode === 'production' ? [
      viteCompression.default({
        algorithm: 'gzip',
        ext: '.gz',
        deleteOriginFile: false,
        threshold: 1024,
      }),
      viteCompression.default({
        algorithm: 'brotliCompress',
        ext: '.br',
        deleteOriginFile: false,
        threshold: 1024,
      })
    ] : []),
  ],
  // Desabilitar verificação de tipos durante desenvolvimento para melhor performance
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@pages': resolve(__dirname, './src/pages'),
      '@types': resolve(__dirname, './src/types'),
      react: resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom/client',
      'scheduler',
      'use-sync-external-store'
    ]
  },
  build: {
    // Performance optimizations
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: mode === 'development',
    // Usar esbuild para dropar logs em prod
    esbuild: mode === 'production' ? { drop: ['console', 'debugger'], legalComments: 'none' } : undefined,
    
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['lucide-react', 'recharts'],
          // Pesadas e raras
          'media-ffmpeg': ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
          'ml-tfjs': ['@tensorflow/tfjs', '@tensorflow/tfjs-backend-webgl'],
          'three-core': ['three', 'three-stdlib', '@pixiv/three-vrm'],
          'utils-vendor': ['zustand', 'clsx', 'class-variance-authority', 'tailwind-merge'],
          
          // Performance chunks
          'performance-core': [
            './src/hooks/usePerformanceOptimization.ts',
            './src/utils/performanceMonitor.ts',
            './src/utils/webVitalsTracker.ts'
          ],
          'performance-analysis': [
            './src/hooks/useBundleAnalysis.ts',
            './src/utils/bundleAnalyzer.ts',
            './src/hooks/useLazyLoading.ts'
          ],
          'performance-cache': [
            './src/utils/cacheManager.ts',
            './src/hooks/usePerformanceBudgets.ts',
            './src/utils/performanceBudgets.ts'
          ],
        },
        
        // Chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const name = facadeModuleId.split('/').pop()?.replace('.ts', '').replace('.tsx', '')
            return `chunks/${name}-[hash].js`
          }
          return 'chunks/[name]-[hash].js'
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          const ext = info[info.length - 1]
          
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name || '')) {
            return `images/[name]-[hash].${ext}`
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return `fonts/[name]-[hash].${ext}`
          }
          if (/\.(css)$/i.test(assetInfo.name || '')) {
            return `styles/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
      },
      
      // External dependencies (if needed)
      external: [],
    },
    
    // Performance budgets
    chunkSizeWarningLimit: 1000, // 1MB warning
    assetsInlineLimit: 4096, // 4KB inline limit
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Report compressed size
    reportCompressedSize: true,
  },
  
  // Development server configuration otimizado
  server: {
    port: 5000,
    host: '0.0.0.0',
    strictPort: true,
    cors: true,
    // Allow all hosts for Replit compatibility
    allowedHosts: 'all',
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    },
    // Otimizações para reduzir TTFB
    hmr: {
      overlay: false // Reduz overhead em desenvolvimento
    },
    fs: {
      cachedChecks: false // Desabilita verificações de cache desnecessárias
    }
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    open: true,
  },
  
  // Optimization configuration melhorado
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-dom/client',
      'react-router-dom',
      'zustand',
      'lucide-react',
      // Ensure these are pre-bundled to avoid ESM/CJS interop issues
      'recharts',
      'lodash'
    ],
    exclude: [
      'ffmpeg.wasm',
      'ffmpeg.wasm/core',
      '@ffmpeg/ffmpeg',
      '@ffmpeg/util',
      // Removed 'recharts' from exclude to allow proper pre-bundling
      'web-vitals' // Carregado dinamicamente
    ],
    force: false, // Permite cache de dependências
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  
  // Worker configuration
  worker: {
    format: 'es',
    plugins: () => [],
    rollupOptions: {
      output: {
        entryFileNames: 'workers/[name]-[hash].js',
        chunkFileNames: 'workers/[name]-[hash].js',
        assetFileNames: 'workers/[name]-[hash].[ext]'
      }
    }
  },
  
  // Test configuration
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
    },
  },
  
  // Experimental features
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { js: `/${filename}` }
      } else {
        return { relative: true }
      }
    },
  },
}))