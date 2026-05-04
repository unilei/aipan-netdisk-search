import prisma from "~/lib/prisma";
import { normalizeQuarkConfig } from "~/server/services/quark/quarkConfig.mjs";

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
                    key: 'quark_config',
                    group: 'quark'
                }
            });

            const storedConfig = settings ? JSON.parse(settings.value) : {};

            return {
                code: 200,
                data: normalizeQuarkConfig(storedConfig)
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

            const normalizedConfig = normalizeQuarkConfig(body);

            await prisma.systemSettings.upsert({
                where: {
                    key: 'quark_config'
                },
                update: {
                    value: JSON.stringify(normalizedConfig),
                    group: 'quark',
                    description: '夸克网盘转存配置'
                },
                create: {
                    key: 'quark_config',
                    value: JSON.stringify(normalizedConfig),
                    group: 'quark',
                    description: '夸克网盘转存配置'
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
