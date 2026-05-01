import { getFeatureAccessConfig } from "~/server/utils/featureAccess";

export default defineEventHandler(async () => {
  const config = await getFeatureAccessConfig();

  return {
    code: 200,
    data: config,
  };
});
