import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { globalIgnores } from 'eslint/config';

export const ignores = globalIgnores(['dist']);
export const tsBase = [js.configs.recommended, ...tseslint.configs.recommended];
export const prettier = eslintConfigPrettier;
