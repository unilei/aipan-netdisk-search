import { filterTvSources } from "~/server/services/tv/sources.mjs";

const REMOTE_TV_SOURCES_URL = "https://r2cf.aipan.me/tv.json";

interface TvSource {
  name?: string;
  url?: string;
  [key: string]: unknown;
}

export default defineEventHandler(async (event) => {
  try {
    const data = await $fetch<TvSource[]>(REMOTE_TV_SOURCES_URL, {
      method: "GET",
      timeout: 8000,
      retry: 1,
    });

    setHeader(event, "Cache-Control", "public, max-age=300, s-maxage=300");

    return filterTvSources(data);
  } catch (error: any) {
    console.error("Failed to fetch remote TV sources:", error?.message || error);

    throw createError({
      statusCode: 502,
      statusMessage: "获取远程直播源失败",
    });
  }
});
