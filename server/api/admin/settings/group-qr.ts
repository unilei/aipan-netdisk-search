import prisma from '~/lib/prisma'

const DEFAULT_CONFIG = {
    enabled: true,
    title: '为防止网站和谐，请进ailook群获取最新网址',
    description: '长按识别二维码或扫码进群',
    qrCodeUrl: '',
    showInHeader: true,
    showInSearchResults: true
}

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
                    key: 'group_qr_config',
                    group: 'display'
                }
            });

            const storedConfig = settings ? JSON.parse(settings.value) : {};

            return {
                code: 200,
                data: {
                    ...DEFAULT_CONFIG,
                    ...storedConfig
                }
            };
        } catch (error) {
            console.error('获取群二维码配置失败:', error);
            return {
                code: 500,
                msg: '获取配置失败'
            };
        }
    }

    if (event.method === 'POST') {
        try {
            const body = await readBody(event);

            // 验证必要字段
            if (!body.title || body.title.trim() === '') {
                return {
                    code: 400,
                    msg: '标题不能为空'
                };
            }

            if (body.enabled && (!body.qrCodeUrl || body.qrCodeUrl.trim() === '')) {
                return {
                    code: 400,
                    msg: '启用显示时二维码图片链接不能为空'
                };
            }

            // 验证二维码URL格式
            if (body.qrCodeUrl && body.qrCodeUrl.trim() !== '') {
                try {
                    new URL(body.qrCodeUrl);
                } catch (error) {
                    return {
                        code: 400,
                        msg: '二维码图片链接格式不正确'
                    };
                }
            }

            const normalizedConfig = {
                ...DEFAULT_CONFIG,
                ...body,
                enabled: Boolean(body.enabled),
                showInHeader: Boolean(body.showInHeader),
                showInSearchResults: Boolean(body.showInSearchResults),
                title: body.title?.trim() || DEFAULT_CONFIG.title,
                description: body.description?.trim() || DEFAULT_CONFIG.description,
                qrCodeUrl: body.qrCodeUrl?.trim() || ''
            };

            await prisma.systemSettings.upsert({
                where: {
                    key: 'group_qr_config'
                },
                update: {
                    value: JSON.stringify(normalizedConfig),
                    group: 'display',
                    description: '群二维码显示配置'
                },
                create: {
                    key: 'group_qr_config',
                    value: JSON.stringify(normalizedConfig),
                    group: 'display',
                    description: '群二维码显示配置'
                }
            });

            return {
                code: 200,
                msg: '配置保存成功'
            };
        } catch (error) {
            console.error('保存群二维码配置失败:', error);
            return {
                code: 500,
                msg: '保存配置失败'
            };
        }
    }

    return {
        code: 405,
        msg: '方法不允许'
    };
});