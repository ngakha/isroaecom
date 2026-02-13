/**
 * Pagination helper for list endpoints
 * Provides consistent pagination across all modules
 */
function paginate(query, { page = 1, limit = 25, maxLimit = 100 }) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(limit, 10) || 25));
  const offset = (parsedPage - 1) * parsedLimit;

  return {
    query: query.limit(parsedLimit).offset(offset),
    meta: {
      page: parsedPage,
      limit: parsedLimit,
      offset,
    },
  };
}

/**
 * Build pagination response with total count
 */
function paginatedResponse(data, total, meta) {
  return {
    data,
    pagination: {
      page: meta.page,
      limit: meta.limit,
      total: parseInt(total, 10),
      totalPages: Math.ceil(total / meta.limit),
      hasMore: meta.page * meta.limit < total,
    },
  };
}

module.exports = { paginate, paginatedResponse };
