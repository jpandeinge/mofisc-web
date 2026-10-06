export interface PaginationWindow<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export const paginateItems = <T>(
  items: readonly T[],
  requestedPage: number,
  requestedPageSize: number
): PaginationWindow<T> => {
  const pageSize = Number.isSafeInteger(requestedPageSize) && requestedPageSize > 0
    ? requestedPageSize
    : 1;
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeRequestedPage = Number.isSafeInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const page = Math.min(safeRequestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  return {
    items: paginatedItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex: Math.min(startIndex + paginatedItems.length, totalItems),
  };
};
