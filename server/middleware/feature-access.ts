import { assertFeatureAccess } from "~/server/utils/featureAccess";
import { resolveFeatureAccessKeysForPath } from "~/server/services/accessControl/featureAccessPolicy.mjs";
import type { FeatureAccessKey } from "~/server/utils/featureAccess";

export default defineEventHandler(async (event) => {
  const requestPath = (event.node.req.url || "").split("?")[0];
  const featureKeys = resolveFeatureAccessKeysForPath(requestPath);

  if (featureKeys.length > 0) {
    await assertFeatureAccess(event, featureKeys as FeatureAccessKey[]);
  }
});
