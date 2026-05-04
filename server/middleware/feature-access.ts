import { assertFeatureAccess } from "~/server/utils/featureAccess";
import { resolveFeatureAccessKeysForPath } from "~/server/services/accessControl/featureAccessPolicy.mjs";

export default defineEventHandler(async (event) => {
  const requestPath = (event.node.req.url || "").split("?")[0];
  const featureKeys = resolveFeatureAccessKeysForPath(requestPath);

  if (featureKeys.length > 0) {
    await assertFeatureAccess(event, featureKeys);
  }
});
