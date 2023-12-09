/** @type import('eslint').Linter.Config */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    project: ['./tsconfig.json', './client/tsconfig.json', './client/worker/tsconfig.json'],
  },
  env: {
    browser: true,
    es6: true,
  },
  plugins: [
    'prettier',
    'import',
    'simple-import-sort',
    '@typescript-eslint', // doc: https://typescript-eslint.io/rules/
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
    'prettier',
  ],
  rules: {
    'prettier/prettier': 'warn',
    'no-console': 'warn',
    'eqeqeq': 'error',
    'no-else-return': 'error',
    'object-shorthand': 'error',
    'prefer-destructuring': 'error',
    'import/no-duplicates': 'error',
    '@typescript-eslint/prefer-enum-initializers': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      args: 'after-used',
      ignoreRestSiblings: true,
      destructuredArrayIgnorePattern: '^_',
    }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'objectLiteralProperty',
        format: null,
        leadingUnderscore: 'allow',
        trailingUnderscore: 'allow',
      },
    ],
    "@typescript-eslint/no-shadow": "warn",
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
  },
};
