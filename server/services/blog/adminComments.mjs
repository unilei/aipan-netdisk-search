const SEARCH_TYPES = new Set(["content", "author", "email"]);

const toSingleValue = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const toPositiveInteger = (value, fallback) => {
  const number = Number.parseInt(toSingleValue(value), 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

export const normalizeAdminCommentListQuery = (query = {}) => {
  const page = toPositiveInteger(query.page, 1);
  const rawPageSize = toPositiveInteger(query.pageSize, 10);
  const pageSize = Math.min(rawPageSize, 100);
  const keyword = String(toSingleValue(query.keyword) || "").trim();
  const requestedSearchType = String(toSingleValue(query.searchType) || "content");
  const searchType = SEARCH_TYPES.has(requestedSearchType) ? requestedSearchType : "content";

  return {
    page,
    pageSize,
    keyword,
    searchType,
  };
};

export const buildAdminCommentWhere = ({ keyword, searchType }) => {
  if (!keyword) {
    return {};
  }

  return {
    [searchType]: {
      contains: keyword,
    },
  };
};

export const toAdminCommentListItem = (comment) => ({
  id: comment.id,
  content: comment.content,
  author: comment.author,
  email: comment.email,
  website: comment.website,
  avatar: comment.avatar,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  postId: comment.postId,
  parentId: comment.parentId,
  likes: comment.likes,
  postTitle: comment.post?.title || "",
  postSlug: comment.post?.slug || "",
});
