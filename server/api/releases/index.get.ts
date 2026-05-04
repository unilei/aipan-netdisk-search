import prisma from "~/lib/prisma";
import {
  getLatestReleaseIdentity,
  getReleaseNotesFromSettings,
} from "~/server/services/releases/releaseNotes.mjs";

export default defineEventHandler(async (event) => {
  const { notes, source } = await getReleaseNotesFromSettings(prisma);
  const latest = notes[0] || null;

  setHeader(event, "Cache-Control", "public, max-age=120, s-maxage=300");

  return {
    success: true,
    data: {
      notes,
      latest,
      latestIdentity: getLatestReleaseIdentity(latest),
      source,
    },
  };
});
