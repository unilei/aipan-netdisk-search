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

    const now = new Date();

    // 静态页面
    const staticPages = [
        { loc: '/', lastmod: now, priority: 1.0, changefreq: 'daily' },
        { loc: '/search', lastmod: now, priority: 0.9, changefreq: 'daily' },
        { loc: '/ai-search', lastmod: now, priority: 0.8, changefreq: 'weekly' },
        { loc: '/tv', lastmod: now, priority: 0.8, changefreq: 'weekly' },
        { loc: '/movie/daily', lastmod: now, priority: 0.8, changefreq: 'daily' },
        { loc: '/blog', lastmod: now, priority: 0.8, changefreq: 'daily' },
        { loc: '/about', lastmod: now, priority: 0.5, changefreq: 'monthly' },
        { loc: '/games', lastmod: now, priority: 0.6, changefreq: 'weekly' },
        { loc: '/privacy-policy', lastmod: now, priority: 0.3, changefreq: 'yearly' },
        { loc: '/user-agreement', lastmod: now, priority: 0.3, changefreq: 'yearly' },
        { loc: '/terms', lastmod: now, priority: 0.3, changefreq: 'yearly' },
        { loc: '/disclaimer', lastmod: now, priority: 0.3, changefreq: 'yearly' },
        { loc: '/copyright', lastmod: now, priority: 0.3, changefreq: 'yearly' },
    ];

    // 博客文章页面
    const blogPages = posts
        .filter((post) => post.slug)
        .map((post: Post) => {
        return {
            loc: `/blog/${post.slug}`,
            lastmod: post.updatedAt,
            priority: 0.6,
            changefreq: 'weekly'
        }
    });

    return [...staticPages, ...blogPages];
})
