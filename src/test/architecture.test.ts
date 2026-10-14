/// <reference types="node" />
/**
 * Giữ bố cục module (ADR 0023): mỗi `src/modules/<tên>/` chỉ có các thư mục chức năng cố định + `index.ts` /
 * `constants.ts`; mỗi component / screen một thư mục riêng cùng tên; repository / service đặt tên theo vai trò.
 * Ranh giới import (ai được import ai) do ESLint `no-restricted-imports` kiểm tra — xem eslint.config.js.
 */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const MODULES_DIR = join(process.cwd(), 'src/modules');
const FOLDERS = new Set([
  'repositories', // khai báo endpoint, trả DTO — chỉ services/ gọi
  'services', // repository → Model
  'models',
  'stores',
  'hooks',
  'components',
  'screens',
  'utils',
  // riêng của bài tập
  'answers',
  'renderers',
  'guide',
  'styles',
]);
const ROOT_FILES = new Set(['index.ts', 'constants.ts']);
/** Thư mục mà mỗi phần tử con là một thư mục `<Tên>/` chứa `<Tên>.tsx` (+ .module.scss, .test.tsx) */
const PER_COMPONENT = ['components', 'screens'];

const modules = readdirSync(MODULES_DIR).filter((name) => statSync(join(MODULES_DIR, name)).isDirectory());
const entries = (dir: string) =>
  readdirSync(dir).map((name) => ({ name, isDir: statSync(join(dir, name)).isDirectory() }));

describe.each(modules)('modules/%s', (module) => {
  const dir = join(MODULES_DIR, module);

  it('chỉ có thư mục chức năng + index.ts / constants.ts', () => {
    const stray = entries(dir).filter((e) => (e.isDir ? !FOLDERS.has(e.name) : !ROOT_FILES.has(e.name)));
    expect(stray.map((e) => e.name)).toEqual([]);
  });

  it.each(PER_COMPONENT)('%s/: mỗi component một thư mục cùng tên', (folder) => {
    const path = join(dir, folder);
    if (!readdirSync(dir).includes(folder)) return;
    for (const child of entries(path)) {
      expect(child.isDir, `${folder}/${child.name} phải là thư mục`).toBe(true);
      const files = readdirSync(join(path, child.name)).filter(
        (f) => !statSync(join(path, child.name, f)).isDirectory(),
      );
      const wrong = files.filter((f) => !f.startsWith(`${child.name}.`));
      expect(wrong, `${folder}/${child.name}/`).toEqual([]);
    }
  });

  it('tên file repository / service đúng vai trò', () => {
    const named = (folder: string, suffix: string) =>
      readdirSync(dir).includes(folder)
        ? readdirSync(join(dir, folder)).filter((f) => !f.endsWith(`${suffix}.ts`))
        : [];
    expect(named('repositories', 'Repository')).toEqual([]);
    expect(named('services', 'Service')).toEqual([]);
  });
});
