import eslintPluginAstro from 'eslint-plugin-astro';
import eslintPluginVue from 'eslint-plugin-vue';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  // Global ignores
  {
    ignores: ['dist', 'node_modules', '.astro', '.output', 'public', '*.d.ts'],
  },

  // TypeScript Configuration
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        extraFileExtensions: ['.vue', '.astro'],
      },
      globals: {
        // defined browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        // Node globals
        process: 'readonly',
        module: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      // Enforce strict typing - NO ANY
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Vue Configuration
  ...eslintPluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: typescriptParser,
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off', // Using single word names in islands is fine
      'vue/require-default-prop': 'off',
      // Enforce no ANY in Vue templates too
      'vue/no-v-html': 'warn',
    },
  },

  // Astro Configuration
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['**/*.astro'],
    rules: {
      'astro/no-set-html-directive': 'error',
    },
  },

  // Prettier Integration
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      ...eslintConfigPrettier.rules,
    },
  },
];
