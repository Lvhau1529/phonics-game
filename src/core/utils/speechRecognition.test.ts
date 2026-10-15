import { describe, expect, it } from 'vitest';
import { matchWords, toWords } from '@/core/utils/speechRecognition';

describe('toWords', () => {
  it('bỏ hoa / thường, dấu câu, nháy đơn', () => {
    expect(toWords("I've got a T-shirt!")).toEqual(['ive', 'got', 'a', 't', 'shirt']);
    expect(toWords('  ')).toEqual([]);
  });
});

describe('matchWords', () => {
  it('đủ từ của câu mẫu -> 1, không tính mạo từ', () => {
    expect(matchWords('fish lives in ocean', 'The fish lives in the ocean.')).toBe(1);
  });

  it('thiếu từ -> tỉ lệ', () => {
    expect(matchWords('the fish ocean', 'The fish lives in the ocean.')).toBe(0.5);
  });

  it('chấp nhận số nhiều / số ít ("ears" ~ "ear")', () => {
    expect(matchWords('rabbit has two long ear', 'The rabbit has two long ears.')).toBe(1);
  });

  it('câu mẫu rỗng -> 0', () => {
    expect(matchWords('hello', 'the')).toBe(0);
  });
});
