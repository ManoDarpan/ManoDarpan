import js from '@eslint/js' // Import ESLint's built-in recommended rules
import globals from 'globals' // Import predefined global variables (like 'window', 'document', etc.)
import reactHooks from 'eslint-plugin-react-hooks' // ESLint plugin for React Hooks rules
import reactRefresh from 'eslint-plugin-react-refresh' // ESLint plugin for fast refresh in development (e.g., Vite)
import { defineConfig, globalIgnores } from 'eslint/config' // Utilities from the new flat config system

// Export the configuration array using defineConfig for structure validation
export default defineConfig([
  globalIgnores(['dist']), // Globally ignore files in the 'dist' directory
  {
    files: ['**/*.{js,jsx}'], // Apply this configuration block only to .js and .jsx files
    extends: [
      js.configs.recommended, // Extend with ESLint's core recommended rules
      reactHooks.configs['recommended-latest'], // Extend with the latest recommended React Hooks rules
      reactRefresh.configs.vite, // Extend with rules for React Fast Refresh in Vite projects
    ],
    languageOptions: { // Configuration for JavaScript language options
      ecmaVersion: 2020, // Specifies the version of ECMAScript syntax to use (e.g., 2020)
      globals: globals.browser, // Defines global variables available in browser environments
      parserOptions: { // Further parser options
        ecmaVersion: 'latest', // Use the latest ECMAScript version supported by the parser
        ecmaFeatures: { jsx: true }, // Enable JSX parsing
        sourceType: 'module', // Enable ES module support (import/export)
      },
    },
    rules: { // Custom rule overrides
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }], // Treat unused variables as errors, but ignore constants/enums starting with a capital letter or underscore
    },
  },
])
