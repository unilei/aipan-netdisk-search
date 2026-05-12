const BLOCKED_TV_SOURCE_NAME_PATTERNS = [/霍元甲/i];

const normalizeTvSourceField = (value) => String(value || "").trim();

export const filterTvSources = (sources) => {
  if (!Array.isArray(sources)) {
    return [];
  }

  return sources.reduce((items, source) => {
    if (!source || typeof source !== "object") {
      return items;
    }

    const name = normalizeTvSourceField(source.name);
    const url = normalizeTvSourceField(source.url);

    if (!name || !url) {
      return items;
    }

    if (BLOCKED_TV_SOURCE_NAME_PATTERNS.some((pattern) => pattern.test(name))) {
      return items;
    }

    items.push({
      ...source,
      name,
      url,
    });

    return items;
  }, []);
};
