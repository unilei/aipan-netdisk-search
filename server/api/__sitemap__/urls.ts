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

interface ForumCategorySitemapEntry {
    slug: string,
    updatedAt: Date,
}

interface ForumTopicSitemapEntry {
    slug: string,
    updatedAt: Date,
    lastActivityAt: Date,
}

export default defineEventHandler(async () => {
    const [posts, forumCategories, forumTopics]: [Post[], ForumCategorySitemapEntry[], ForumTopicSitemapEntry[]] = await Promise.all([
        prisma.post.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        }),
        prisma.forumCategory.findMany({
            select: {
                slug: true,
                updatedAt: true,
            },
            orderBy: {
                order: 'asc',
            },
        }),
        prisma.forumTopic.findMany({
            where: {
                status: 'approved',
            },
            select: {
                slug: true,
                updatedAt: true,
                lastActivityAt: true,
            },
            orderBy: [
                { lastActivityAt: 'desc' },
                { createdAt: 'desc' },
            ],
        }),
    ]);

    const now = new Date();

    // 静态页面
    const staticPages = [
        { loc: '/', lastmod: now, priority: 1.0, changefreq: 'daily' },
        { loc: '/search', lastmod: now, priority: 0.9, changefreq: 'daily' },
        { loc: '/ai-search', lastmod: now, priority: 0.8, changefreq: 'weekly' },
        { loc: '/tv', lastmod: now, priority: 0.8, changefreq: 'weekly' },
        { loc: '/movie/daily', lastmod: now, priority: 0.8, changefreq: 'daily' },
        { loc: '/blog', lastmod: now, priority: 0.8, changefreq: 'daily' },
        { loc: '/forum', lastmod: now, priority: 0.8, changefreq: 'daily' },
        { loc: '/about', lastmod: now, priority: 0.5, changefreq: 'monthly' },
        { loc: '/games', lastmod: now, priority: 0.6, changefreq: 'weekly' },
        { loc: '/spring-festival', lastmod: now, priority: 0.4, changefreq: 'yearly' },
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

    const forumCategoryPages = forumCategories
        .filter((category) => category.slug)
        .map((category: ForumCategorySitemapEntry) => {
            return {
                loc: `/forum/category/${category.slug}`,
                lastmod: category.updatedAt,
                priority: 0.6,
                changefreq: 'weekly'
            }
        });

    const forumTopicPages = forumTopics
        .filter((topic) => topic.slug)
        .map((topic: ForumTopicSitemapEntry) => {
            return {
                loc: `/forum/topic/${topic.slug}`,
                lastmod: topic.lastActivityAt || topic.updatedAt,
                priority: 0.5,
                changefreq: 'weekly'
            }
        });

    return [...staticPages, ...blogPages, ...forumCategoryPages, ...forumTopicPages];
})
