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
        console.log(nameFilter)
        const res: Item[] = await prisma.resource.findMany({
            where: {
                name: {
                    contains: nameFilter,
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
        });

        let result = res.map((item) => {

            const links = JSON.parse(item.links)
            let linksArr = []

            linksArr = links.map((link: any) => {
                let service = '';
                if (link.value) {
                    if (link.value.includes('pan.baidu.com')) {
                        service = 'BAIDU';
                    } else if (link.value.includes('pan.xunlei.com')) {
                        service = 'XUNLEI';
                    } else if (link.value.includes('pan.quark.cn')) {
                        service = 'QUARK';
                    } else if (link.value.includes('www.aliyundrive.com')) {
                        service = 'ALIYUN'
                    } else {
                        service = 'OTHER';
                    }
                }

                return {
                    pwd: "",
                    link: link.value,
                    service
                };
            })

            return {
                name: item.name,
                links: linksArr
            }

        })


        return {
            list: result
        }


    } catch (e) {
        console.log(e);
        return {
            code: 500,
            msg: 'An error occurred while searching for resources',
        };
    }
});
