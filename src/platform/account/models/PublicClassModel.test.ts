import { describe, expect, it } from 'vitest';
import { PublicClassModel } from '@/platform/account/models/PublicClassModel';

describe('PublicClassModel', () => {
  it('subtitle = khối · năm học', () => {
    const item = new PublicClassModel({
      id: '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
      name: 'K2A',
      grade: 'Grade 2',
      schoolYear: '2026-2027',
    });
    expect(item.subtitle).toBe('Grade 2 · 2026-2027');
  });
});
