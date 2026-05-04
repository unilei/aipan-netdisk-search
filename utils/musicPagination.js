export const normalizePageSize = (pageSize) => {
  const normalized = Number(pageSize);
  return Number.isFinite(normalized) && normalized > 0
    ? Math.floor(normalized)
    : 10;
};

export const getPaginationState = ({ totalItems, page, pageSize }) => {
  const normalizedTotal = Math.max(0, Number(totalItems) || 0);
  const normalizedPageSize = normalizePageSize(pageSize);
  const totalPages = Math.max(1, Math.ceil(normalizedTotal / normalizedPageSize));
  const normalizedPage = Math.min(
    totalPages,
    Math.max(1, Math.floor(Number(page) || 1)),
  );
  const start =
    normalizedTotal === 0
      ? 0
      : (normalizedPage - 1) * normalizedPageSize + 1;
  const end =
    normalizedTotal === 0
      ? 0
      : Math.min(normalizedPage * normalizedPageSize, normalizedTotal);

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    totalItems: normalizedTotal,
    totalPages,
    start,
    end,
    hasPrevious: normalizedPage > 1,
    hasNext: normalizedPage < totalPages,
  };
};

export const buildPageItems = (items = [], { page, pageSize }) => {
  const state = getPaginationState({
    totalItems: items.length,
    page,
    pageSize,
  });
  const startIndex = (state.page - 1) * state.pageSize;

  return items.slice(startIndex, startIndex + state.pageSize);
};
