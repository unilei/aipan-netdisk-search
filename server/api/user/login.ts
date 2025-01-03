import prisma from "~/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    try {
        const { email, password } = await readBody(event);

        if (!email || !password) {
            return {
                code: 400,
                msg: '请填写完整的登录信息'
            }
        }

        // 查找用户
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return {
                code: 400,
                msg: '用户不存在'
            }
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return {
                code: 400,
                msg: '密码错误'
            }
        }

        // 生成 JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        return {
            code: 200,
            msg: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            }
        }

    } catch (e) {
        console.error(e);
        return {
            code: 500,
            msg: '服务器错误',
            error: e
        }
    }
}) 