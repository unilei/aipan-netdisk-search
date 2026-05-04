import prisma from "~/lib/prisma";
import {
  getLatestReleaseIdentity,
  getReleaseNotesFromSettings,
} from "~/server/services/releases/releaseNotes.mjs";

export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (!user || user.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "无权限访问",
    });
  }

  const { notes, source } = await getReleaseNotesFromSettings(prisma, {
    includeDrafts: true,
  });

  return {
    code: 200,
    msg: "获取成功",
    data: {
      notes,
      latestIdentity: getLatestReleaseIdentity(notes[0]),
      source,
    },
  };
});
