import prisma from '~/lib/prisma';

interface Post {
    id: number,
    title: string,
    slug: string,
    content: string,
    createdAt: Date,
    updatedAt: Date,
    creatorId: number
}

export default defineEventHandler(async () => {
    const posts: Post[] = await prisma.post.findMany({
        orderBy: {
            createdAt: 'desc',
        },
    });

    return posts.map((post) => {
        return {
            loc: `/blog/${post.slug}`,
            lastmod: post.updatedAt,
        }
    })
})