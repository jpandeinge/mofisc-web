import { resolvePageDataState } from './pageDataState';

describe('resolvePageDataState', () => {
  it('keeps existing content visible during background refreshes', () => {
    expect(resolvePageDataState(true, true)).toBe('content');
  });

  it('shows the shared loader while no usable data is available', () => {
    expect(resolvePageDataState(false, true)).toBe('loading');
  });

  it('shows an empty state only after loading finishes', () => {
    expect(resolvePageDataState(false, false)).toBe('empty');
  });
});
