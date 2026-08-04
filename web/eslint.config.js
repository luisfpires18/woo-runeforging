import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },

  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // The adapter boundary, enforced at lint time rather than by a test that
  // greps source. Components and features consume `SettlementState` through the
  // provider; they must never reach for a fixture or the fake clock, because
  // the whole point of the seam is that swapping in real endpoints touches one
  // file. A violation fails in the editor, not three steps later in CI.
  {
    files: ['src/features/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/api/fake/**', '**/fake/**'],
              message:
                'Features and shared components must not import fake fixtures or the fake clock. ' +
                'Consume SettlementState through the provider (src/api/SettlementStateProvider.tsx) ' +
                'so that replacing fake state with real endpoints stays a change in one file.',
            },
          ],
        },
      ],
    },
  },

  // This config file itself is plain JavaScript and is not part of the
  // TypeScript program, so type-aware rules cannot run against it.
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
);
