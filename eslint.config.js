import js from '@eslint/js';

export default [
  {
    // client.template.js carries placeholders and is not a standalone module;
    // the generated artifact client.js is what gets linted.
    ignores: ['node_modules/**', '.npm-cache/**', 'lib/client.template.js'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        window: 'readonly',
        Date: 'readonly',
        Intl: 'readonly',
        Map: 'readonly',
        URL: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
];
