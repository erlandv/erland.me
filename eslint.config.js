import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import astroPlugin from 'eslint-plugin-astro';

export default [
  // Global ignores
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'public/**',
      '*.config.{js,cjs,mjs,ts}',
      'scripts/**/*.mjs',
      // Files with minified inline scripts
      'src/components/CriticalInit.astro',
      'src/components/ThemeToggle/ThemeToggle.astro',
      'src/pages/blog/category/index.astro',
    ],
  },

  // Base JavaScript/TypeScript config
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        HTMLElement: 'readonly',
        Node: 'readonly',
        Element: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        MutationObserver: 'readonly',
        IntersectionObserver: 'readonly',
        NodeListOf: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',

      // General code quality rules
      'no-console': 'off', // We have logger.ts for structured logging
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'off', // Allow traditional function expressions
      'prefer-template': 'warn',
      'no-nested-ternary': 'warn',
      'no-param-reassign': 'off', // Common pattern in DOM manipulation
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['warn', 'multi-line', 'consistent'], // More flexible than 'all'
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Best practices
      'no-unused-expressions': 'off', // Let TypeScript handle this
      '@typescript-eslint/no-unused-expressions': 'warn',
      'no-return-await': 'error',
      'require-await': 'off', // Too strict for event handlers
      'no-async-promise-executor': 'error',

      // Style consistency (Prettier handles formatting, these are logic)
      'max-depth': ['warn', 4],
      'max-lines-per-function': 'off', // Can be addressed incrementally
      complexity: 'off', // Can be addressed incrementally
    },
  },

  // Astro files config
  ...astroPlugin.configs.recommended,
  {
    files: ['**/*.astro'],
    languageOptions: {
      parser: astroPlugin.parser,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.astro'],
      },
    },
    rules: {
      // Astro-specific rules
      'astro/no-conflict-set-directives': 'error',
      'astro/no-unused-define-vars-in-style': 'warn',
      'astro/no-deprecated-astro-canonicalurl': 'error',
      'astro/no-deprecated-astro-fetchcontent': 'error',
      'astro/no-deprecated-astro-resolve': 'error',
      'astro/no-deprecated-getentrybyslug': 'error',
      'astro/valid-compile': 'error',

      // Relax rules for inline scripts (often minified/generated)
      'prefer-const': 'off',
      'no-var': 'off',
    },
  },

  // Client-side scripts in src/lib
  {
    files: ['src/lib/**/*.{js,ts}'],
    rules: {
      // These files run in browser, allow browser APIs
      'no-undef': 'off', // TypeScript handles this better
    },
  },

  // Build scripts
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Scripts need console output
    },
  },
];
