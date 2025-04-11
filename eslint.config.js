import globals from 'globals';
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        THREE: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
      },
    },
    rules: {
      // Error Prevention
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Performance Related
      'no-extra-bind': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',

      // Animation & Visualization Specific
      'no-constant-condition': [
        'error',
        {
          checkLoops: false,
        },
      ],

      // Style & Readability
      indent: ['error', 4],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],

      // Math & Number Handling
      'no-loss-of-precision': 'error',

      // Modern JavaScript Features
      'arrow-body-style': ['error', 'as-needed'],
      'arrow-parens': ['error', 'as-needed'],

      // Async Handling
      'no-async-promise-executor': 'error',
      'require-atomic-updates': 'error',
    },
  },
];
