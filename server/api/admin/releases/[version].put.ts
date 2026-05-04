import prisma from "~/lib/prisma";
import {
  getReleaseNotesFromSettings,
  saveReleaseNotesToSettings,
  upsertReleaseNote,
} from "~/server/services/releases/releaseNotes.mjs";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "无权限访问",
    });
  }

  const version = decodeURIComponent(getRouterParam(event, "version") || "");
  if (!version) {
    throw createError({
      statusCode: 400,
      statusMessage: "版本号不能为空",
    });
  }

  try {
    const body = await readBody(event);
    const { notes } = await getReleaseNotesFromSettings(prisma, {
      includeDrafts: true,
    });

    if (!notes.some((note: any) => note.version === version)) {
      throw createError({
        statusCode: 404,
        statusMessage: "发布日志不存在",
      });
    }

    const nextNotes = upsertReleaseNote(notes, body, version);
    await saveReleaseNotesToSettings(prisma, nextNotes);

    return {
      code: 200,
      msg: "发布日志已更新",
      data: nextNotes,
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError({
      statusCode: 400,
      statusMessage: error.message || "更新发布日志失败",
    });
  }
});
