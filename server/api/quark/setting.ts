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


    if (event.method === 'GET') {
        try {
            const settings = await prisma.systemSettings.findFirst({
                where: {
                    key: 'quark_config'
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

}); 
