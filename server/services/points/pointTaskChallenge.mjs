import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const POINT_TASK_READ_DELAY_MS = 10_000;
export const POINT_TASK_CHALLENGE_TTL_MS = 5 * 60_000;

const encodePayload = (payload) =>
  Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");

const signPayload = (encodedPayload, secret) =>
  createHmac("sha256", secret).update(encodedPayload).digest("base64url");

const signaturesMatch = (received, expected) => {
  const receivedBuffer = Buffer.from(String(received || ""), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

export const createPointTaskClaimChallenge = ({
  secret,
  userId,
  taskId,
  taskKey,
  taskVersion,
  claimNo,
  now = Date.now(),
  delayMs = POINT_TASK_READ_DELAY_MS,
  ttlMs = POINT_TASK_CHALLENGE_TTL_MS,
  nonce = randomBytes(16).toString("base64url"),
}) => {
  if (typeof secret !== "string" || !secret) {
    throw new Error("Point task challenge secret is not configured");
  }

  const issuedAt = Number(now);
  const notBefore = issuedAt + Number(delayMs);
  const expiresAt = issuedAt + Number(ttlMs);
  const payload = {
    version: 1,
    userId: Number(userId),
    taskId: Number(taskId),
    taskKey: String(taskKey),
    taskVersion: Number(taskVersion),
    claimNo: Number(claimNo),
    issuedAt,
    notBefore,
    expiresAt,
    nonce: String(nonce),
  };
  const encodedPayload = encodePayload(payload);
  const signature = signPayload(encodedPayload, secret);

  return {
    token: `${encodedPayload}.${signature}`,
    readyAt: notBefore,
    expiresAt,
  };
};

export const verifyPointTaskClaimChallenge = ({
  token,
  secret,
  userId,
  taskId,
  taskKey,
  taskVersion,
  claimNo,
  now = Date.now(),
}) => {
  if (typeof token !== "string" || typeof secret !== "string" || !secret) {
    return {
      valid: false,
      reason: "invalid",
    };
  }

  const [encodedPayload, receivedSignature, extraPart] = token.split(".");
  if (!encodedPayload || !receivedSignature || extraPart) {
    return {
      valid: false,
      reason: "invalid",
    };
  }

  const expectedSignature = signPayload(encodedPayload, secret);
  if (!signaturesMatch(receivedSignature, expectedSignature)) {
    return {
      valid: false,
      reason: "invalid",
    };
  }

  let payload;
  try {
    payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );
  } catch {
    return {
      valid: false,
      reason: "invalid",
    };
  }

  const expectedFieldsMatch =
    payload?.version === 1 &&
    Number(payload.userId) === Number(userId) &&
    Number(payload.taskId) === Number(taskId) &&
    payload.taskKey === String(taskKey) &&
    Number(payload.taskVersion) === Number(taskVersion) &&
    Number(payload.claimNo) === Number(claimNo);

  if (!expectedFieldsMatch) {
    return {
      valid: false,
      reason: "mismatch",
    };
  }

  const currentTime = Number(now);
  if (!Number.isFinite(payload.notBefore) || currentTime < payload.notBefore) {
    return {
      valid: false,
      reason: "too_early",
      readyAt: payload.notBefore,
    };
  }

  if (!Number.isFinite(payload.expiresAt) || currentTime > payload.expiresAt) {
    return {
      valid: false,
      reason: "expired",
    };
  }

  return {
    valid: true,
    reason: "valid",
    payload,
  };
};
