import { createAlistClient } from "~/server/services/alist/client.mjs";
import {
  findAlistSourceById,
  normalizeAlistSourceInput,
  saveAlistHealth,
  toAlistClientConfig,
} from "~/server/services/alist/records";

const getHealthMessage = (checks: Array<{ ok: boolean; message: string }>) => {
  const failed = checks.find((check) => !check.ok);
  return failed?.message || "连接正常";
};

const hasDraftSourceInput = (body: Record<string, unknown>) =>
  ["name", "link", "authMode", "username", "secret", "password", "token", "rootPath", "enabled"]
    .some((key) => Object.prototype.hasOwnProperty.call(body, key));

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const client = createAlistClient();
  const id = Number(body.id);

  let config;
  if (Number.isFinite(id) && id > 0) {
    const source = await findAlistSourceById(id);
    if (hasDraftSourceInput(body)) {
      const normalized = normalizeAlistSourceInput(body, source);
      config = toAlistClientConfig({
        id,
        ...normalized,
      });
    } else {
      config = toAlistClientConfig(source);
    }
  } else {
    const normalized = normalizeAlistSourceInput({
      ...body,
      name: body.name || "AList 测试源",
    });
    config = toAlistClientConfig({
      id: 0,
      ...normalized,
    });
  }

  const result = await client.testConnection(config);
  const message = getHealthMessage(result.checks);

  if (Number.isFinite(id) && id > 0) {
    await saveAlistHealth(id, {
      ok: result.ok,
      message,
    });
  }

  return {
    code: result.ok ? 200 : 400,
    msg: result.ok ? "连接正常" : message,
    data: result,
  };
});
