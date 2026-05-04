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

  try {
    const body = await readBody(event);
    const { notes } = await getReleaseNotesFromSettings(prisma, {
      includeDrafts: true,
    });
    const nextNotes = upsertReleaseNote(notes, body);

    await saveReleaseNotesToSettings(prisma, nextNotes);

    return {
      code: 200,
      msg: "发布日志已保存",
      data: nextNotes,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 400,
      statusMessage: error.message || "保存发布日志失败",
    });
  }
});
