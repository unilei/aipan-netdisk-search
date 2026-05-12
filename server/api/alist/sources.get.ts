import prisma from "~/lib/prisma";
import {
  getAlistSourceSelect,
} from "~/server/services/alist/records";
import { toPublicAlistSource } from "~/server/services/alist/client.mjs";

export default defineEventHandler(async () => {
  const sources = await prisma.alist.findMany({
    where: {
      enabled: true,
    },
    select: getAlistSourceSelect(),
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    code: 200,
    data: sources.map(toPublicAlistSource),
  };
});
