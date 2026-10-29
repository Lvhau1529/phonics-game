import { describe, expect, it } from 'vitest';
import { cameraFor, walkMs } from '@/games/halloween-candy-quest/app/stageLayout';

describe('sân khấu', () => {
  it('màn ngang: phóng vừa chiều cao, căn giữa, không cắt', () => {
    const camera = cameraFor(1280, 600, 40);
    expect(camera.scale).toBeCloseTo(600 / 180);
    expect(camera.x).toBeGreaterThanOrEqual(0);
    expect(camera.y).toBe(0);
  });

  it('màn dọc: thấy ít nhất ~1,5 nhà, camera đi theo nhân vật trong giới hạn nền', () => {
    const left = cameraFor(390, 600, 0);
    const right = cameraFor(390, 600, 320);
    expect(390 / left.scale).toBeGreaterThanOrEqual(119);
    expect(left.x).toBe(0);
    expect(right.x).toBe(Math.round(390 - 320 * right.scale));
  });

  it('thời gian đi 0.9–2.6 giây', () => {
    expect(walkMs(10, 12)).toBe(900);
    expect(walkMs(-24, 300)).toBe(2600);
  });
});
