import { describe, expect, it, vi } from 'vitest';
import { parseAccountEnv } from '@/platform/account/config';

describe('parseAccountEnv', () => {
  it('mặc định offline (không có biến nào, hoặc chỉ có VITE_API_URL)', () => {
    expect(parseAccountEnv({}).VITE_OFFLINE_MODE).toBe(true);
    const withApi = parseAccountEnv({ VITE_API_URL: 'http://localhost:3000/' });
    expect(withApi.VITE_OFFLINE_MODE).toBe(true);
    expect(withApi.VITE_API_URL).toBe('http://localhost:3000');
  });

  it('VITE_OFFLINE_MODE=false / 0 / off (không phân biệt hoa thường) mới tắt offline', () => {
    for (const value of ['false', 'FALSE', '0', 'off', ' no ']) {
      expect(parseAccountEnv({ VITE_OFFLINE_MODE: value }).VITE_OFFLINE_MODE).toBe(false);
    }
    for (const value of ['true', '1', 'yes', '']) {
      expect(parseAccountEnv({ VITE_OFFLINE_MODE: value }).VITE_OFFLINE_MODE).toBe(true);
    }
  });

  it('URL sai → coi như offline, không ném lỗi', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const env = parseAccountEnv({ VITE_OFFLINE_MODE: 'false', VITE_API_URL: 'localhost:3000' });
    expect(env).toEqual({ VITE_OFFLINE_MODE: true, VITE_API_URL: '', VITE_GOOGLE_CLIENT_ID: '' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
