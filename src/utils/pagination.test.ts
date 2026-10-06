import { paginateItems } from './pagination';

describe('paginateItems', () => {
  const items = Array.from({ length: 14 }, (_, index) => index + 1);

  it('returns a bounded page window', () => {
    expect(paginateItems(items, 2, 6)).toEqual({
      items: [7, 8, 9, 10, 11, 12],
      page: 2,
      pageSize: 6,
      totalItems: 14,
      totalPages: 3,
      startIndex: 6,
      endIndex: 12,
    });
  });

  it('clamps invalid and out-of-range page values', () => {
    expect(paginateItems(items, 99, 6).page).toBe(3);
    expect(paginateItems(items, Number.NaN, 6).page).toBe(1);
    expect(paginateItems(items, -4, 6).page).toBe(1);
  });

  it('keeps empty collections on a stable first page', () => {
    expect(paginateItems([], 4, 6)).toEqual({
      items: [],
      page: 1,
      pageSize: 6,
      totalItems: 0,
      totalPages: 1,
      startIndex: 0,
      endIndex: 0,
    });
  });
});
