import eslint from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const sourceFiles = ['**/*.{ts,tsx}'];
const typedRecommended = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: sourceFiles,
}));

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.vite/**',
      'supabase/.temp/**',
    ],
  },
  eslint.configs.recommended,
  ...typedRecommended,
  {
    files: sourceFiles,
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Regras que evitam defeitos comuns sem impor formatação automática.
      'no-console': 'warn',
      'no-constant-binary-expression': 'error',
      'no-template-curly-in-string': 'error',
      'no-unreachable-loop': 'error',
      'no-use-before-define': 'off',
      'prefer-const': 'error',
      // A base existente ainda contém código legado em transição; o lint
      // deve evidenciar esses pontos sem bloquear toda a validação do repo.
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-duplicate-imports': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/no-autofocus': 'warn',
    },
  },
  {
    files: ['**/*.{mjs,cjs,js}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'no-constant-binary-expression': 'error',
      'no-duplicate-imports': 'error',
      'no-template-curly-in-string': 'error',
      'no-unreachable-loop': 'error',
      'prefer-const': 'error',
    },
  },
];
