import prisma from "~/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    try {
        const { email, password, username } = await readBody(event);

        if (!email || !password || !username) {
            return {
                code: 400,
                msg: '请填写完整的注册信息'
            }
        }

        // 检查用户是否已存在
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            return {
                code: 400,
                msg: '用户名或邮箱已被注册'
            }
        }

        // 打印调试信息，查看环境变量传递情况
        console.log('[DEBUG] 注册用户检查：', {
            提交的邮箱: email,
            配置的管理员邮箱: config.adminEmail,
            邮箱匹配: email === config.adminEmail,
            提交的密码: password.substring(0, 3) + '***', // 出于安全考虑只显示密码前几位
            配置的管理员密码长度: config.adminPassword?.length || 0,
            密码匹配: password === config.adminPassword,
            提交的用户名: username,
            配置的管理员用户名: config.adminUser,
            用户名匹配: username === config.adminUser,
            全部配置项名称: Object.keys(config)
        });
        
        // 判断是否是管理员注册
        const isAdminRegistration = email === config.adminEmail &&
            password === config.adminPassword &&
            username === config.adminUser;

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 12);

        // 创建用户
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: isAdminRegistration ? 'admin' : 'user',
                isVerified: isAdminRegistration // 管理员账户自动验证
            }
        });

        // 生成 JWT token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            config.jwtSecret,
            { expiresIn: '24h' }
        );

        return {
            code: 200,
            msg: '注册成功',
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