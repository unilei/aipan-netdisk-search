import jwt from "jsonwebtoken";
import { useRuntimeConfig } from "#imports";
import prisma from "~/lib/prisma";
import type { JwtPayload } from "jsonwebtoken";
import { hashPassword, verifyAndUpgradePassword } from "~/server/utils/password";

const config = useRuntimeConfig();
const JWT_SECRET = config.jwtSecret; // 从环境变量中读取 JWT 密钥

export const registerUser = async () => {
  const username = config.adminUser;
  const email = config.adminEmail;
  const password = config.adminPassword;

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
  return { user, token };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    return null;
  }
  const passwordResult = await verifyAndUpgradePassword(user, password);
  if (!passwordResult.isValid) {
    return null;
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
  return { user, token };
};

export const findUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  return user;
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (err) {
    return null;
  }
};
