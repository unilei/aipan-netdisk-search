import prisma from "~/lib/prisma";
import { buildPublicQuarkConfig } from "~/server/services/quark/quarkConfig.mjs";

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
                data: buildPublicQuarkConfig(storedConfig)
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
