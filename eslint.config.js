import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // ── Backend (Node.js) files ──────────────────────────
  {
    files: ['src/backend/**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]|^motion$', argsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },

  // ── Frontend (Browser) files ─────────────────────────
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/backend/**'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Allow unused vars starting with uppercase, underscore, or 'motion' (used as motion.div in JSX)
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|^motion$', argsIgnorePattern: '^_' }],
      // Allow empty catch blocks (intentional swallows)
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Suppress react-refresh for context/provider files
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
