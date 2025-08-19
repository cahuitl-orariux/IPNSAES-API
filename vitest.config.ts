import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Directorio de tests
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    
    // Configuración del entorno
    environment: 'node',
    
    // Configuración de cobertura
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        'workspace/test/',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    },
    
    // Configuración de reportes
    reporters: ['verbose'],
    
    // Timeout para tests
    testTimeout: 10000,
    
    // Configuración de archivos de setup
    setupFiles: [],
    
    // Configuración de globals
    globals: false
  },
  
  // Configuración de resolución de módulos
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
