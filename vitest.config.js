import { defineConfig, configDefaults } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig((config) => ({
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    exclude: [...configDefaults.exclude, 'auto-fill/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'lcov'],
      include: ['src/**'],
      exclude: [...configDefaults.exclude, 'coverage']
    },
    setupFiles: ['.vite/setup-files.js'],
    env: loadEnv(config.mode, process.cwd(), '')
  }
}))
