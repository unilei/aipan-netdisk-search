import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {
    // 验证管理员权限
    const user = event.context.user;
    if (!user || user.role !== 'admin') {
        return {
            code: 403,
            msg: '无权限访问'
        };
    }

    if (event.method === 'GET') {
        try {
            const settings = await prisma.systemSettings.findFirst({
                where: {
                    key: 'quark_config'
                }
            });

            return {
                code: 200,
                data: settings ? JSON.parse(settings.value) : {
                    quarkCookie: '',
                    userId: '',
                    typeId: ''
                }
            };
        } catch (error) {
            console.error('获取配置失败:', error);
            return {
                code: 500,
                msg: '获取配置失败'
            };
        }
    }

    if (event.method === 'POST') {
        try {
            const body = await readBody(event);

            await prisma.systemSettings.upsert({
                where: {
                    key: 'quark_config'
                },
                update: {
                    value: JSON.stringify(body)
                },
                create: {
                    key: 'quark_config',
                    value: JSON.stringify(body)
                }
            });

            return {
                code: 200,
                msg: '配置保存成功'
            };
        } catch (error) {
            console.error('保存配置失败:', error);
            return {
                code: 500,
                msg: '保存配置失败'
            };
        }
    }
}); 