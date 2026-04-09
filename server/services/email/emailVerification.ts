import crypto from "node:crypto";
import { createError } from "h3";
import prisma from "~/lib/prisma";
import { getEmailVerificationTemplate } from "~/server/services/email/templates";
import {
  getEmailServiceConfig,
  sendEmailMessage,
} from "~/server/services/email/resend";

const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000;

type VerificationUser = {
  id: number;
  username?: string | null;
  email: string;
  isVerified: boolean;
};

const hashToken = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const assertEmailServiceEnabled = async () => {
  const config = await getEmailServiceConfig();

  if (!config.enabled) {
    throw createError({
      statusCode: 400,
      statusMessage: "邮箱服务未启用",
    });
  }

  if (!config.siteUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: "站点地址未配置",
    });
  }

  return config;
};

export const sendVerificationEmail = async (
  user: VerificationUser,
  options?: {
    ignoreCooldown?: boolean;
  },
) => {
  if (!user.email) {
    throw createError({
      statusCode: 400,
      statusMessage: "用户邮箱不能为空",
    });
  }

  const config = await assertEmailServiceEnabled();

  if (!options?.ignoreCooldown) {
    const latestToken = await prisma.emailVerificationToken.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (
      latestToken &&
      Date.now() - new Date(latestToken.createdAt).getTime() <
        EMAIL_RESEND_COOLDOWN_MS
    ) {
      throw createError({
        statusCode: 429,
        statusMessage: "邮件发送过于频繁，请稍后再试",
      });
    }
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + config.verificationExpireMinutes * 60 * 1000,
  );

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      emailSnapshot: user.email,
      tokenHash,
      expiresAt,
    },
  });

  const verificationLink = `${config.siteUrl}/email-verify?token=${encodeURIComponent(rawToken)}`;
  const template = getEmailVerificationTemplate({
    userName: user.username,
    verificationLink,
    expireMinutes: config.verificationExpireMinutes,
  });

  await sendEmailMessage({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return {
    expiresAt,
  };
};

export const verifyEmailToken = async (token: string) => {
  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "缺少验证 token",
    });
  }

  const tokenRecord = await prisma.emailVerificationToken.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      user: true,
    },
  });

  if (!tokenRecord) {
    throw createError({
      statusCode: 400,
      statusMessage: "验证链接无效或已过期",
    });
  }

  if (tokenRecord.consumedAt) {
    throw createError({
      statusCode: 400,
      statusMessage: "该验证链接已被使用",
    });
  }

  if (tokenRecord.expiresAt.getTime() < Date.now()) {
    throw createError({
      statusCode: 400,
      statusMessage: "验证链接已过期",
    });
  }

  if (tokenRecord.user.email !== tokenRecord.emailSnapshot) {
    throw createError({
      statusCode: 400,
      statusMessage: "该验证链接已失效，请重新获取",
    });
  }

  const consumedAt = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: tokenRecord.userId,
      },
      data: {
        isVerified: true,
        emailVerifiedAt: consumedAt,
        emailVerificationRequired: false,
      },
    }),
    prisma.emailVerificationToken.updateMany({
      where: {
        userId: tokenRecord.userId,
        consumedAt: null,
      },
      data: {
        consumedAt,
      },
    }),
  ]);

  return tokenRecord.user;
};
