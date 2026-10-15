import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/games/phonics-ocean/content/levels';
import {
  COMPANIONS,
  dolphinCheers,
  HAZARD,
  HazardClock,
  hazardHit,
  hazardKinds,
  MAGNET,
  magnetPull,
  MagnetState,
} from '@/games/phonics-ocean/session/sea';

describe('nam châm', () => {
  it('bật trong durationMs; nhặt thêm thì nạp lại, không cộng dồn', () => {
    const magnet = new MagnetState();
    expect(magnet.active).toBe(false);
    magnet.start();
    magnet.tick(MAGNET.durationMs - 1000);
    magnet.start();
    expect(magnet.activeMs).toBe(MAGNET.durationMs);
    magnet.tick(MAGNET.durationMs);
    expect(magnet.active).toBe(false);
  });

  it('hút cá về miệng theo pullPerSec, không vượt quá miệng', () => {
    const pull = magnetPull({ x: 100, y: 0 }, { x: 0, y: 0 }, 500);
    expect(pull.x).toBeCloseTo(-MAGNET.pullPerSec / 2);
    expect(pull.y).toBeCloseTo(0);
    const close = magnetPull({ x: 5, y: 0 }, { x: 0, y: 0 }, 1000);
    expect(close.x).toBeCloseTo(-5);
  });

  it('cá ngoài bán kính không bị hút', () => {
    expect(magnetPull({ x: MAGNET.radius + 1, y: 0 }, { x: 0, y: 0 }, 1000)).toEqual({ x: 0, y: 0 });
  });
});

describe('cá heo ăn mừng', () => {
  it('chuỗi 5, 10... / RHYME COMBO / lớn thêm một cỡ', () => {
    expect(dolphinCheers(COMPANIONS.dolphinStreak, false, false)).toBe(true);
    expect(dolphinCheers(COMPANIONS.dolphinStreak * 2, false, false)).toBe(true);
    expect(dolphinCheers(3, false, false)).toBe(false);
    expect(dolphinCheers(1, true, false)).toBe(true);
    expect(dolphinCheers(1, false, true)).toBe(true);
    expect(dolphinCheers(0, false, false)).toBe(false);
  });
});

describe('chướng ngại', () => {
  it('chỉ có ở biome sâu (từ twilight_trench)', () => {
    expect(hazardKinds('coral_reef')).toEqual([]);
    expect(hazardKinds('kelp_forest')).toEqual([]);
    expect(hazardKinds('shipwreck_bay')).toEqual([]);
    expect(hazardKinds('twilight_trench').length).toBeGreaterThan(0);
    expect(hazardKinds('volcanic_ruins')).toContain('rock');
    // Mọi cấp ở biome sâu đều có chướng ngại, cấp nông thì không
    LEVELS.forEach((level) => {
      const deep = ['twilight_trench', 'abyss_cave', 'volcanic_ruins'].includes(level.biome);
      expect(new HazardClock(level.biome).enabled).toBe(deep);
    });
  });

  it('không bao giờ mất tim: choáng nhẹ + mất nửa thanh FRENZY; bong bóng đỡ được', () => {
    expect(hazardHit(false)).toEqual({ stun: true, frenzyLoss: true, heartsLost: 0, blocked: false });
    expect(hazardHit(true)).toEqual({ stun: false, frenzyLoss: false, heartsLost: 0, blocked: true });
  });

  it('chướng ngại đầu tiên sau firstDelayMs, sau đó mỗi everyMs, không quá max', () => {
    const clock = new HazardClock('twilight_trench');
    expect(clock.tick(HAZARD.firstDelayMs - 1, { onScreen: 0, calm: false })).toBe(false);
    expect(clock.tick(1, { onScreen: 0, calm: false })).toBe(true);
    expect(clock.tick(HAZARD.everyMs, { onScreen: 1, calm: false })).toBe(false);
    expect(clock.tick(0, { onScreen: 0, calm: false })).toBe(true);
  });

  it('bé đang gặp khó -> chướng ngại ra thưa hơn', () => {
    const clock = new HazardClock('abyss_cave');
    clock.tick(HAZARD.firstDelayMs, { onScreen: 0, calm: false });
    expect(clock.tick(HAZARD.everyMs, { onScreen: 0, calm: true })).toBe(false);
    expect(clock.tick(HAZARD.everyMs, { onScreen: 0, calm: true })).toBe(true);
  });

  it('biome nông không bao giờ thả chướng ngại', () => {
    const clock = new HazardClock('coral_reef');
    expect(clock.tick(60_000, { onScreen: 0, calm: false })).toBe(false);
  });
});
