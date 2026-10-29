import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LIBRARY, normalizeText } from '@/games/halloween-candy-quest/content/words';
import { CHARACTERS, ZONES } from '@/games/halloween-candy-quest/content/world';

const asset = (path: string) => resolve(process.cwd(), 'public/assets/halloween-candy-quest', path);

describe('nội dung Halloween Candy Quest', () => {
  it('24 từ thư viện, id / chữ không trùng, có ảnh', () => {
    expect(LIBRARY).toHaveLength(24);
    expect(new Set(LIBRARY.map((word) => word.id)).size).toBe(24);
    expect(new Set(LIBRARY.map((word) => normalizeText(word.text))).size).toBe(24);
    for (const word of LIBRARY) expect(existsSync(asset(`words/${word.id}.png`)), word.id).toBe(true);
  });

  it('3 khu vực × 4 nhà, 6 nhân vật — mọi sprite đều có', () => {
    expect(ZONES).toHaveLength(3);
    for (const zone of ZONES) {
      expect(existsSync(asset(`bg/${zone.id}.png`))).toBe(true);
      for (const house of zone.houses) {
        expect(existsSync(asset(`buildings/${house.building}.png`)), house.building).toBe(true);
        expect(existsSync(asset(`doors/${house.door}.png`)), house.door).toBe(true);
        expect(existsSync(asset(`npcs/${house.npc}.png`)), house.npc).toBe(true);
      }
      for (const prop of zone.props) {
        for (const image of [prop.image, prop.toggled].filter(Boolean)) {
          expect(existsSync(asset(`props/${image}.png`)), image).toBe(true);
        }
      }
    }
    expect(CHARACTERS).toHaveLength(6);
    for (const character of CHARACTERS) {
      expect(existsSync(asset(`chars/${character.id}.png`))).toBe(true);
      expect(existsSync(asset(`chars/${character.id}_portrait.png`))).toBe(true);
    }
  });
});
