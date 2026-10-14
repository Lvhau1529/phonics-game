import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDraft,
  draftKey,
  mergeDraft,
  readDraft,
  writeDraft,
} from '@/platform/homework/answers/draftStorage';

const answer = { type: 'MULTIPLE_CHOICE', optionId: 'o1' } as const;

describe('draftStorage', () => {
  beforeEach(() => localStorage.clear());

  it('ghi / đọc / xoá theo submissionId, chỉ trả bản của đúng user', () => {
    writeDraft('s1', {
      userId: 'u1',
      assignmentId: 'a1',
      answers: { i1: answer },
      updatedAt: '2026-10-09T01:00:00.000Z',
    });
    expect(readDraft('s1', 'u1')?.answers.i1).toEqual(answer);
    expect(readDraft('s1', 'u2')).toBeNull();
    clearDraft('s1');
    expect(localStorage.getItem(draftKey('s1'))).toBeNull();
  });

  it('bỏ qua bản nháp hỏng', () => {
    localStorage.setItem(draftKey('s2'), '{"userId":"u1","answers":{"i1":{"type":"NOPE"}}}');
    expect(readDraft('s2', 'u1')).toBeNull();
  });

  it('mergeDraft: nháp mới hơn server thì nháp thắng, cũ hơn thì giữ server', () => {
    const server = { i1: { type: 'MULTIPLE_CHOICE', optionId: 'o2' } as const };
    const draft = {
      userId: 'u1',
      assignmentId: 'a1',
      answers: { i1: answer },
      updatedAt: '2026-10-09T02:00:00.000Z',
    };
    expect(mergeDraft(server, '2026-10-09T01:00:00.000Z', draft).i1).toEqual(answer);
    expect(mergeDraft(server, '2026-10-09T03:00:00.000Z', draft).i1).toEqual(server.i1);
    expect(mergeDraft(server, '2026-10-09T03:00:00.000Z', null)).toBe(server);
  });
});
