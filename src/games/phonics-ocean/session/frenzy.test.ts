import { describe, expect, it } from 'vitest';
import { canEat, FRENZY, FrenzyMeter } from '@/games/phonics-ocean/session/frenzy';

describe('canEat', () => {
  it('chỉ ăn được cá nhỏ hơn mình', () => {
    expect(canEat(1, 'tiny')).toBe(true);
    expect(canEat(1, 'medium')).toBe(false);
    expect(canEat(2, 'medium')).toBe(true);
    expect(canEat(2, 'big')).toBe(false);
    expect(canEat(3, 'big')).toBe(true);
  });
});

describe('FrenzyMeter', () => {
  it('đầy thanh -> FRENZY! nhân đôi điểm rồi hết sau durationMs', () => {
    const meter = new FrenzyMeter();
    let started = false;
    for (let i = 0; i < 10 && !started; i += 1) started = meter.eat('tiny').started;
    expect(started).toBe(true);
    expect(meter.active).toBe(true);
    expect(meter.eat('tiny').points).toBe(FRENZY.points.tiny * FRENZY.multiplier);
    meter.tick(FRENZY.durationMs);
    expect(meter.active).toBe(false);
    expect(meter.eat('medium').points).toBe(FRENZY.points.medium);
  });

  it('không ăn thì thanh vơi dần (sau thời gian ân hạn); va cá to mất một nửa', () => {
    const meter = new FrenzyMeter();
    meter.eat('big');
    meter.eat('big');
    const full = meter.level;
    meter.tick(FRENZY.graceMs);
    expect(meter.level).toBe(full);
    meter.tick(1000);
    expect(meter.level).toBeCloseTo(full - FRENZY.decayPerSec);
    meter.bump();
    expect(meter.level).toBeCloseTo(Math.max(0, full - FRENZY.decayPerSec - FRENZY.bumpLoss));
  });

  it('ăn đúng cá mang chữ cũng làm đầy thanh', () => {
    const meter = new FrenzyMeter();
    meter.word();
    expect(meter.level).toBe(FRENZY.wordFill);
  });
});
