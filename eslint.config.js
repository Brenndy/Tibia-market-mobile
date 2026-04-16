// ESLint flat config. eslint-config-expo already bundles typescript-eslint,
// react, react-hooks, react-native and import plugins — we only layer rule
// overrides + prettier on top.
// Docs: https://docs.expo.dev/guides/using-eslint/

const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // TypeScript — lenient but safe
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React Hooks — non-negotiable
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    // Tests — relax rules that add noise in e2e specs
    files: ['tests/**/*.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
  {
    // Node / build scripts + Vercel serverless functions — Node globals
    files: ['*.config.{js,cjs}', '*.config.*.{js,cjs}', 'api/**/*.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'ios/**',
      'android/**',
      'web-build/**',
      'playwright-report/**',
      'test-results/**',
      'tests/screenshots/**',
      'tests/fixtures/**',
    ],
  },
  prettierConfig,
];
