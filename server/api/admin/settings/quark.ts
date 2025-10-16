import prisma from "~/lib/prisma";

const DEFAULT_API_URL = 'http://127.0.0.1:5000/api/quark/sharepage/save';
const DEFAULT_ACCESS_DURATION = 1440;

const DEFAULT_CONFIG = {
    quarkCookie: '',
    userId: '',
    typeId: '',
    enabled: false,
    apiUrl: DEFAULT_API_URL,
    verificationEnabled: false,
    shareLink: '',
    accessDurationMinutes: DEFAULT_ACCESS_DURATION
};

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
                data: {
                    ...DEFAULT_CONFIG,
                    ...storedConfig,
                    accessDurationMinutes: Number(storedConfig?.accessDurationMinutes ?? DEFAULT_ACCESS_DURATION)
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

            const normalizedConfig = {
                ...DEFAULT_CONFIG,
                ...body,
                enabled: Boolean(body.enabled),
                verificationEnabled: Boolean(body.verificationEnabled),
                accessDurationMinutes: Math.min(
                    1440,
                    Math.max(5, Number(body.accessDurationMinutes ?? DEFAULT_ACCESS_DURATION))
                )
            };

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
