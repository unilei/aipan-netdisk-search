import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPageItems,
  getPaginationState,
} from "../../utils/musicPagination.js";

test("buildPageItems returns only the requested page slice", () => {
  const items = Array.from({ length: 23 }, (_, index) => ({ id: index + 1 }));

  assert.deepEqual(
    buildPageItems(items, { page: 2, pageSize: 10 }).map((item) => item.id),
    [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
  );
});

test("getPaginationState clamps pages and reports visible range", () => {
  assert.deepEqual(
    getPaginationState({ totalItems: 23, page: 8, pageSize: 10 }),
    {
      page: 3,
      pageSize: 10,
      totalItems: 23,
      totalPages: 3,
      start: 21,
      end: 23,
      hasPrevious: true,
      hasNext: false,
    }
  );
});

test("getPaginationState handles an empty result set", () => {
  assert.deepEqual(getPaginationState({ totalItems: 0, page: 1, pageSize: 10 }), {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
    start: 0,
    end: 0,
    hasPrevious: false,
    hasNext: false,
  });
});
