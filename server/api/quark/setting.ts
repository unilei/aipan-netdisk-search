import prisma from "~/lib/prisma";

export default defineEventHandler(async (event) => {


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

}); 