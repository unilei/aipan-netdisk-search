import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
    try {
        const settings = await prisma.systemSettings.findFirst({
            where: {
                key: 'music_password',
                group: 'music'
            }
        });

        // 返回密码和启用状态
        const password = settings?.value || 'aipan.me2025';
        const enabled = settings?.isEnabled ?? true;

        return {
            code: 200,
            data: {
                password,
                enabled
            }
        };
    } catch (error) {
        console.error('获取音乐验证码失败:', error);
        return {
            code: 500,
            msg: '获取验证码失败'
        };
    }
});