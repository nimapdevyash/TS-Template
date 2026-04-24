import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'temp/**'],
  },

  // Base Configuration
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierPluginRecommended, // Must be last to override other formatting rules

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: ['./tsconfig.json'], // Helps with advanced TS rules
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Custom Rules
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn', // Recommended for production
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // Clean logs
    },
  },

  // Specific overrides for scripts (like your model generator)
  {
    files: ['src/utils/generateModelNames.ts'],
    rules: {
      'no-console': 'off', // Allow console.log for CLI tools
    },
  },
);
