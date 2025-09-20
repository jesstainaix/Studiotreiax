/**
 * Jest Configuration for PPTX Studio Testing
 * Configuração específica para testes do módulo PPTX com suporte a TypeScript,
 * mocks, coverage e performance testing
 */

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Ambiente de teste
  testEnvironment: 'jsdom',
  
  // Detectar testes automaticamente
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx,js,jsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx,js,jsx}'
  ],

  // Transformações TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        compilerOptions: {
          module: 'ES2022',
          target: 'ES2022',
          lib: ['ES2022', 'DOM'],
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true,
          strict: true
        }
      }
    }]
  },

  // Extensões de arquivo suportadas
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Resolução de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js'
  },

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/setup.ts'
  ],

  // Configuração de coverage
  collectCoverage: true,
  collectCoverageFrom: [
    'src/lib/pptx/**/*.{ts,tsx}',
    'src/services/**/pptx*.{ts,tsx}',
    'src/components/**/pptx*.{tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**'
  ],

  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'clover',
    'json'
  ],

  coverageDirectory: '<rootDir>/coverage',

  // Limites de coverage
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/lib/pptx/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },

  // Timeouts
  testTimeout: 30000, // 30 segundos para testes de performance
  
  // Configurações globais
  globals: {
    'ts-jest': {
      useESM: true
    }
  },

  // Verbose output para debugging
  verbose: true,

  // Mostrar apenas testes que falharam
  passWithNoTests: true,

  // Cache para melhor performance
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  // Configurações específicas para Workers
  workerIdleMemoryLimit: '1GB',
  maxWorkers: '50%',

  // Reporters personalizados
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage/html-report',
      filename: 'report.html',
      openReport: false,
      expand: true
    }],
    ['jest-junit', {
      outputDirectory: './coverage',
      outputName: 'junit.xml',
      suiteName: 'PPTX Studio Tests'
    }]
  ],

  // Configurações de performance
  errorOnDeprecated: true,
  detectOpenHandles: true,
  detectLeaks: true,

  // Mocks globais
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,

  // Configurações específicas do projeto
  displayName: {
    name: 'PPTX Studio',
    color: 'blue'
  },

  // Suites de teste específicas
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/src/**/*.integration.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      testTimeout: 60000 // 60 segundos para testes de integração
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/src/**/*.performance.test.{ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
      testTimeout: 120000, // 2 minutos para testes de performance
      slowTestThreshold: 10
    }
  ]
};

export default config;