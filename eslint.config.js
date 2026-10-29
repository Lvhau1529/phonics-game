// ESLint flat config. Không bật rule cần type-info (projectService): TypeScript 7 chưa có compiler API cho
// typescript-eslint, nên ESLint parse bằng `typescript` 6 (typecheck dùng TS 7 qua alias `typescript-7`).
import { readdirSync } from 'node:fs';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Ranh giới kiến trúc (ADR 0023): main → app → games → modules → ui / core.
 * Mỗi vùng một khối `no-restricted-imports` đầy đủ (khối sau GHI ĐÈ khối trước, không gộp) nên các vùng phải rời nhau.
 */
const MODULES = readdirSync(new URL('./src/modules', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);
const RELATIVE = { group: ['../*'], message: 'Dùng alias `@/` thay cho đường dẫn `../`.' };
const layer = (names, message) => ({ regex: `^@/(${names})(/|$)`, message });
/** Import sâu vào module khác: chỉ qua `@/modules/<tên>` (index.ts); riêng screen (điểm vào route) được import thẳng */
const deepInto = (except) => ({
  regex: `^@/modules/${except ? `(?!${except}/)` : ''}[^/]+/(?!screens/)`,
  message:
    'Import module khác qua `@/modules/<tên>` (index.ts). Chỉ screen được import theo đường `screens/`.',
});
const NO_REPOSITORY = {
  regex: '^@/modules/[^/]+/repositories/',
  message: 'Repository chỉ được gọi từ services/ của chính module.',
};
const NO_SERVICE = {
  regex: '^@/modules/[^/]+/services/',
  message: 'UI không gọi service: dùng hook (hooks/) hoặc action của store (stores/).',
};
const NO_CONTRACTS = {
  group: ['@phonics/contracts'],
  message: 'UI không dùng DTO của BE: import kiểu / validator mà module export (models/, utils/).',
};
const ONLY_REPOSITORY_REQUESTS = {
  name: '@/core/api/client',
  importNames: ['request'],
  message: '`request()` chỉ dùng trong repositories/.',
};
const restrict = (patterns, paths = [ONLY_REPOSITORY_REQUESTS]) => ({
  'no-restricted-imports': ['error', { paths, patterns: [RELATIVE, ...patterns] }],
});
const UI_DIRS = ['components', 'screens', 'renderers', 'guide'];
const moduleZones = MODULES.flatMap((m) => {
  const base = [deepInto(m), layer('app|games', 'modules không import app / games.')];
  const dir = `src/modules/${m}`;
  return [
    { files: [`${dir}/repositories/**`], rules: restrict(base, []) },
    { files: [`${dir}/services/**`], rules: restrict(base) },
    {
      files: UI_DIRS.map((d) => `${dir}/${d}/**`),
      rules: restrict([...base, NO_REPOSITORY, NO_SERVICE, NO_CONTRACTS]),
    },
    {
      files: [`${dir}/**`],
      ignores: ['repositories', 'services', ...UI_DIRS].map((d) => `${dir}/${d}/**`),
      rules: restrict([...base, NO_REPOSITORY]),
    },
  ];
});

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'node_modules/**',
      'coverage/**',
      'public/**',
      '_source/**',
      'tools/**',
      // venv Python của tools/ (gitignored)
      '.venv/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['../*'], message: 'Dùng alias `@/` thay cho đường dẫn `../`.' }] },
      ],
    },
  },
  // ── ranh giới kiến trúc (vùng rời nhau, xem đầu file)
  {
    files: ['src/core/**', 'src/ui/**'],
    ignores: ['src/core/api/**'],
    rules: restrict([
      layer('modules|games|app', 'core / ui là tầng dưới: không import modules / games / app.'),
    ]),
  },
  {
    files: ['src/core/api/**'],
    rules: restrict(
      [layer('modules|games|app', 'core / ui là tầng dưới: không import modules / games / app.')],
      [],
    ),
  },
  { files: ['src/app/**', 'src/main.tsx'], rules: restrict([deepInto()]) },
  {
    files: ['src/games/**'],
    rules: restrict([deepInto(), layer('app', 'games không import app.')]),
  },
  ...moduleZones,
  {
    files: ['**/*.{ts,tsx}'],
    ...reactHooks.configs.flat['recommended-latest'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Rule mới của react-hooks v7 (theo React Compiler): code cũ chưa theo, để warning cho code mới tự sửa dần
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  {
    // Script / config chạy bằng Node
    files: ['*.config.{js,ts,mjs}', 'scripts/**/*.{js,mjs,ts}'],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
