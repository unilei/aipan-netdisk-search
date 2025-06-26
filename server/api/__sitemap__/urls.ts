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

    // 静态页面
    const staticPages = [
        { loc: '/', lastmod: new Date(), priority: 1.0, changefreq: 'daily' },
        { loc: '/search', lastmod: new Date(), priority: 0.9, changefreq: 'daily' },
        { loc: '/ai-search', lastmod: new Date(), priority: 0.8, changefreq: 'weekly' },
        { loc: '/music', lastmod: new Date(), priority: 0.8, changefreq: 'weekly' },
        { loc: '/tv', lastmod: new Date(), priority: 0.8, changefreq: 'weekly' },
        { loc: '/movie', lastmod: new Date(), priority: 0.8, changefreq: 'weekly' },
        { loc: '/blog', lastmod: new Date(), priority: 0.7, changefreq: 'daily' },
        { loc: '/forum', lastmod: new Date(), priority: 0.7, changefreq: 'daily' },
        { loc: '/about', lastmod: new Date(), priority: 0.5, changefreq: 'monthly' },
        { loc: '/games', lastmod: new Date(), priority: 0.6, changefreq: 'weekly' },
    ];

    // 博客文章页面
    const blogPages = posts.map((post) => {
        return {
            loc: `/blog/${post.slug}`,
            lastmod: post.updatedAt,
            priority: 0.6,
            changefreq: 'weekly'
        }
    });

    return [...staticPages, ...blogPages];
})