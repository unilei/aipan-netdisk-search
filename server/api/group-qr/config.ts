import prisma from '~/lib/prisma'

export default defineEventHandler(async (event) => {
    try {
        const settings = await prisma.systemSettings.findFirst({
            where: {
                key: 'group_qr_config',
                group: 'display'
            }
        });

        const defaultConfig = {
            enabled: true,
            title: '为防止网站和谐，请进ailook群获取最新网址',
            description: '长按识别二维码或扫码进群',
            qrCodeUrl: '',
            showInHeader: true,
            showInSearchResults: true
        };

        const config = settings ? JSON.parse(settings.value) : defaultConfig;

        return {
            code: 200,
            data: {
                ...defaultConfig,
                ...config
            }
        };
    } catch (error) {
        console.error('获取群二维码配置失败:', error);
        return {
            code: 500,
            msg: '获取配置失败'
        };
    }
});