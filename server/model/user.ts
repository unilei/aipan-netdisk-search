import jwt from "jsonwebtoken";
import prisma from "~/lib/prisma";
import bcrypt from "bcryptjs";
import type { JwtPayload } from "jsonwebtoken";

const config = useRuntimeConfig();
const JWT_SECRET = config.jwtSecret; // 从环境变量中读取 JWT 密钥

export const registerUser = async () => {
  const username = config.adminUser;
  const email = config.adminEmail;
  const password = config.adminPassword;

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      role: 'admin',
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
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
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
