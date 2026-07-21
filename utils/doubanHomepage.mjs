export const DOUBAN_HOMEPAGE_CACHE_KEY = "douban_homepage_data_r2_v2";
export const DOUBAN_HOMEPAGE_LAST_GOOD_CACHE_KEY =
  "douban_homepage_data_r2_last_good_v2";
export const DOUBAN_HOMEPAGE_LEGACY_CACHE_KEYS = [
  "douban_homepage_data_r2_v1",
];

export const DOUBAN_HOMEPAGE_CACHE_TTL_SECONDS = 60 * 60 * 24;
export const DOUBAN_HOMEPAGE_LAST_GOOD_TTL_SECONDS = 60 * 60 * 24 * 7;

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isUsableMovie = (movie) =>
  isRecord(movie) &&
  typeof movie.title === "string" &&
  movie.title.trim().length > 0;

export const normalizeDoubanHomepageData = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((section) => {
    if (
      !isRecord(section) ||
      typeof section.name !== "string" ||
      section.name.trim().length === 0 ||
      !Array.isArray(section.data)
    ) {
      return [];
    }

    const movies = section.data.filter(isUsableMovie);
    if (movies.length === 0) {
      return [];
    }

    return [
      {
        ...section,
        name: section.name.trim(),
        data: movies,
      },
    ];
  });
};

export const countDoubanHomepageItems = (value) =>
  normalizeDoubanHomepageData(value).reduce(
    (total, section) => total + section.data.length,
    0,
  );

export const hasUsableDoubanHomepageData = (value) =>
  countDoubanHomepageItems(value) > 0;
