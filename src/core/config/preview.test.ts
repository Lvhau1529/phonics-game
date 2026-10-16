import { describe, expect, it } from 'vitest';
import { parseAdminOrigins } from '@/core/config/preview';

describe('parseAdminOrigins', () => {
  it('không khai báo -> admin dev', () => {
    expect(parseAdminOrigins(undefined)).toEqual(['http://localhost:5174']);
    expect(parseAdminOrigins('  ')).toEqual(['http://localhost:5174']);
  });

  it('nhiều URL -> origin, bỏ trùng / URL sai', () => {
    expect(
      parseAdminOrigins(
        'https://admin.example.com/, https://admin.example.com/x,not a url,http://localhost:5174',
      ),
    ).toEqual(['https://admin.example.com', 'http://localhost:5174']);
  });
});
