import prisma from "~/lib/prisma";
interface Body {
    name: string
}

interface Item {
    name: string
    creator: {
        username: string
    }
    type: {
        name: string
    },
    typeId: number,
    createdAt: Date,
    updatedAt: Date,
    id: number,
    links: string
}
export default defineEventHandler(async (event) => {
    const body: Body = await readBody(event);

    try {
        const nameFilter = body.name ? String(body.name).trim() : undefined;

        if (!nameFilter) {
            return {
                list: [],
                code: 200
            };
        }

        const res: Item[] = await prisma.resource.findMany({
            where: {
                name: {
                    contains: nameFilter,
                    mode: 'insensitive',
                },
            },
            include: {
                creator: {
                    select: { username: true },
                },
                type: {
                    select: { name: true },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100,
        });

        const result = res.map((item) => {
            try {
                const links = JSON.parse(item.links);
                const linksArr = links.map((link: any) => {
                    let service = 'OTHER';
                    if (link.value) {
                        if (link.value.includes('pan.baidu.com')) service = 'BAIDU';
                        else if (link.value.includes('pan.xunlei.com')) service = 'XUNLEI';
                        else if (link.value.includes('pan.quark.cn')) service = 'QUARK';
                        else if (link.value.includes('aliyundrive.com')) service = 'ALIYUN';
                        else if (link.value.includes('pan.uc.cn')) service = 'UC';
                        else if (link.value.includes('alipan.com')) service = 'ALIYUN';
                    }
                    return { pwd: "", link: link.value, service };
                });
                return { name: item.name, links: linksArr };
            } catch (e) {

                return { name: item.name, links: [] };
            }
        });

        return {
            list: result,
            code: 200
        };

    } catch (e) {

        return {
            code: 500,
            msg: 'An error occurred while searching for resources',
            list: []
        };
    }
});
