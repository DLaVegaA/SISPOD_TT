import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import eslintParserTs from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.Config} */
export default {
  files: ['src/**/*.{ts,js}'],
  languageOptions: {
    parser: eslintParserTs,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
  plugins: {
    '@typescript-eslint': eslintPluginTs,
  },
  rules: {
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
  },
  ignores: ['dist/', 'node_modules/'],
};
