import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/convex/_generated/**',
      'e2e/**',
      '**/*.e2e.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
      include: [
        'src/lib/**/*.{ts,tsx}',
        'convex/lib/skills.ts',
        'convex/lib/tokens.ts',
        'convex/httpApi.ts',
        'packages/skills/src/**/*.ts',
        'packages/schema/src/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'convex/_generated/',
        'packages/skills/src/cli/**',
        'packages/skills/src/cli.ts',
        'packages/skills/src/config.ts',
        'packages/skills/src/types.ts',
        'packages/schema/dist/',
        'e2e/**',
      ],
    },
  },
})
