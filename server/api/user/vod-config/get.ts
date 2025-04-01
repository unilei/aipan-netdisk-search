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

        // 查询用户的VOD配置
        const userConfig = await prisma.userVodConfig.findFirst({
            where: { userId }
        });

        if (!userConfig) {
            return {
                code: 404,
                msg: "未找到配置",
                data: []
            };
        }

        return {
            code: 200,
            msg: "获取成功",
            data: userConfig.config
        };
    } catch (error: any) {
        console.error("获取VOD配置失败", error);
        return {
            code: 500,
            msg: "服务器错误",
            error: error.message
        };
    }
}); 