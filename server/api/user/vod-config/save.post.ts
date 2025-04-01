import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    try {
        // 从上下文中获取用户ID
        const userId = event.context.user?.userId;
        if (!userId) {
            return {
                code: 401,
                msg: "用户未登录或登录已过期"
            };
        }

        // 获取请求体中的配置数据
        const { config } = await readBody(event);
        if (!config) {
            return {
                code: 400,
                msg: "配置数据不能为空"
            };
        }

        // 查找是否已存在配置
        const existingConfig = await prisma.userVodConfig.findFirst({
            where: { userId }
        });

        let result;
        if (existingConfig) {
            // 更新现有配置
            result = await prisma.userVodConfig.update({
                where: { id: existingConfig.id },
                data: { config }
            });
        } else {
            // 创建新配置
            result = await prisma.userVodConfig.create({
                data: {
                    userId,
                    config
                }
            });
        }

        return {
            code: 200,
            msg: "保存成功",
            data: result
        };
    } catch (error: any) {
        console.error("保存VOD配置失败", error);
        return {
            code: 500,
            msg: "服务器错误",
            error: error.message
        };
    }
}); 