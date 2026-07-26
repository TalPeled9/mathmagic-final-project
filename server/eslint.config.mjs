import { ignores, tsBase, prettier } from '@mathmagic/eslint-config';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ignores,
  {
    files: ['**/*.{ts,tsx}'],
    extends: tsBase,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  prettier,
]);
