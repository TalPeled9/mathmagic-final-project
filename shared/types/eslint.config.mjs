import { ignores, tsBase, prettier } from '@mathmagic/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  ignores,
  {
    files: ['**/*.ts'],
    extends: tsBase,
  },
  prettier,
]);
