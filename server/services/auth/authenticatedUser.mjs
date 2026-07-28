export const ACTIVE_USER_STATUS = "active";

export const normalizeUserRole = (role) =>
  String(role || "user").trim().toLowerCase();

export const resolveAuthenticatedUser = ({ decoded, user }) => {
  const userId = Number(decoded?.userId);

  if (!decoded || !Number.isInteger(userId) || userId <= 0) {
    return {
      allowed: false,
      reason: "invalid_token",
    };
  }

  if (!user || Number(user.id) !== userId) {
    return {
      allowed: false,
      reason: "user_not_found",
    };
  }

  if (String(user.status || "").toLowerCase() !== ACTIVE_USER_STATUS) {
    return {
      allowed: false,
      reason: "account_disabled",
    };
  }

  return {
    allowed: true,
    reason: "authenticated",
    user: {
      userId: Number(user.id),
      role: normalizeUserRole(user.role),
      status: ACTIVE_USER_STATUS,
    },
  };
};
