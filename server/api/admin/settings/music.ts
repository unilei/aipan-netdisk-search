import prisma from '~/lib/prisma'

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
                    key: 'music_password',
                    group: 'music'
                }
            });

            return {
                code: 200,
                data: {
                    password: settings?.value || 'aipan.me2025',
                    enabled: settings?.isEnabled ?? true
                }
            };
        } catch (error) {
            console.error('获取音乐验证码配置失败:', error);
            return {
                code: 500,
                msg: '获取配置失败'
            };
        }
    }

    if (event.method === 'POST') {
        try {
            const body = await readBody(event);
            const { password, enabled } = body;

            if (!password || password.trim() === '') {
                return {
                    code: 400,
                    msg: '密码不能为空'
                };
            }

            await prisma.systemSettings.upsert({
                where: {
                    key: 'music_password'
                },
                update: {
                    value: password,
                    group: 'music',
                    description: '音乐页面访问密码',
                    isEnabled: enabled ?? true
                },
                create: {
                    key: 'music_password',
                    value: password,
                    group: 'music',
                    description: '音乐页面访问密码',
                    isEnabled: enabled ?? true
                }
            });

            return {
                code: 200,
                msg: '配置保存成功'
            };
        } catch (error) {
            console.error('保存音乐验证码配置失败:', error);
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