type RouteQueryValue = string | string[] | null | undefined;

export const getSingleQueryValue = (value: RouteQueryValue): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

export const getLegacyDecodedQueryValue = (value: RouteQueryValue): string => {
  const normalized = getSingleQueryValue(value);

  if (!normalized || !normalized.includes("%")) {
    return normalized;
  }

  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
};
