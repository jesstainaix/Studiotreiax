module.exports = {
  // Ambiente de teste
  testEnvironment: 'jsdom',
  
  // Arquivos de setup
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Padrões de teste específicos para PPTX
  testMatch: [
    '<rootDir>/src/__tests__/pptx-basic.test.ts'
  ],
  
  // Transformações TypeScript
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        lib: ['es2020', 'dom'],
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true
      }
    }]
  },
  
  // Extensões de arquivo
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Mapeamento de módulos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1'
  },
  
  // Cobertura
  collectCoverage: false,
  collectCoverageFrom: [
    'src/services/pptx-*.ts',
    '!src/services/**/*.test.ts'
  ],
  
  // Timeout
  testTimeout: 30000,
  
  // Verbose
  verbose: true,
  
  // Limpar mocks
  clearMocks: true,
  restoreMocks: true,
  
  // Ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
};