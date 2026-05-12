import { createAlistClient } from "~/server/services/alist/client.mjs";
import {
  findAlistSourceById,
  toAlistClientConfig,
} from "~/server/services/alist/records";

const toRouteError = (error: any) =>
  createError({
    statusCode: error?.statusCode || 502,
    statusMessage: error?.statusMessage || error?.message || "AList 请求失败",
  });

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const source = await findAlistSourceById(Number(body.sourceId), {
    enabledOnly: true,
  });
  const client = createAlistClient();

  try {
    const data = await client.get(toAlistClientConfig(source), {
      path: body.path || "/",
      password: body.password || "",
    });

    return {
      code: 200,
      data,
    };
  } catch (error: any) {
    throw toRouteError(error);
  }
});
