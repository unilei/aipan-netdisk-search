import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import prisma from "~/lib/prisma";

const BCRYPT_ROUNDS = 12;

type PasswordUser = {
  id: number;
  password: string;
  salt: string | null;
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

const hashLegacyPassword = (password: string, salt: string) => {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
};

export const verifyAndUpgradePassword = async (
  user: PasswordUser,
  password: string,
) => {
  const isBcryptMatch = await bcrypt.compare(password, user.password);
  if (isBcryptMatch) {
    return {
      isValid: true,
      wasUpgraded: false,
    };
  }

  if (!user.salt) {
    return {
      isValid: false,
      wasUpgraded: false,
    };
  }

  const legacyHash = hashLegacyPassword(password, user.salt);
  if (legacyHash !== user.password) {
    return {
      isValid: false,
      wasUpgraded: false,
    };
  }

  const newPasswordHash = await hashPassword(password);
  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: newPasswordHash,
      salt: null,
    },
  });

  return {
    isValid: true,
    wasUpgraded: true,
  };
};
