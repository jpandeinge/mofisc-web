export type PageDataState = 'loading' | 'empty' | 'content';

/**
 * Keep top-level page states consistent:
 * - never replace usable data with a blocking loader during a refresh;
 * - never show an empty state while a data source is still loading.
 */
export const resolvePageDataState = (
  hasUsableData: boolean,
  isLoading: boolean
): PageDataState => {
  if (hasUsableData) return 'content';
  return isLoading ? 'loading' : 'empty';
};
