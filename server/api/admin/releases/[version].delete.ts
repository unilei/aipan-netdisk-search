import prisma from "~/lib/prisma";
import {
  deleteReleaseNote,
  getReleaseNotesFromSettings,
  saveReleaseNotesToSettings,
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

  const { notes } = await getReleaseNotesFromSettings(prisma, {
    includeDrafts: true,
  });

  if (!notes.some((note: any) => note.version === version)) {
    throw createError({
      statusCode: 404,
      statusMessage: "发布日志不存在",
    });
  }

  const nextNotes = deleteReleaseNote(notes, version);
  await saveReleaseNotesToSettings(prisma, nextNotes);

  return {
    code: 200,
    msg: "发布日志已删除",
    data: nextNotes,
  };
});
