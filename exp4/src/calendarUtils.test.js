import { describe, expect, it } from 'vitest';
import { getCalendarDays, movePost, postsForDate, toDateKey } from './calendarUtils';

describe('calendar data helpers', () => {
  it('creates a stable six-week Monday-first grid', () => {
    const days = getCalendarDays(new Date(2026, 8, 1));
    expect(days).toHaveLength(42);
    expect(toDateKey(days[0])).toBe('2026-08-31');
    expect(toDateKey(days[10])).toBe('2026-09-10');
  });

  it('sorts posts by time for one day', () => {
    const posts = [{ id: 'late', date: '2026-09-08', time: '15:00' }, { id: 'early', date: '2026-09-08', time: '08:00' }];
    expect(postsForDate(posts, '2026-09-08').map((post) => post.id)).toEqual(['early', 'late']);
  });

  it('moves only the selected post', () => {
    const posts = [{ id: 'a', date: '2026-09-01' }, { id: 'b', date: '2026-09-02' }];
    expect(movePost(posts, 'a', '2026-09-04')).toEqual([{ id: 'a', date: '2026-09-04' }, { id: 'b', date: '2026-09-02' }]);
  });
});
