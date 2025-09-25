export default defineEventHandler(async () => {
   

    // 静态页面
    const staticPages = [
        { loc: '/', lastmod: new Date(), priority: 1.0, changefreq: 'daily' },
        { loc: '/search', lastmod: new Date(), priority: 0.9, changefreq: 'daily' },
        { loc: '/ai-search', lastmod: new Date(), priority: 0.8, changefreq: 'weekly' },
        { loc: '/music', lastmod: new Date(), priority: 0.8, changefreq: 'weekly' },
        { loc: '/tv', lastmod: new Date(), priority: 0.8, changefreq: 'weekly' },
        { loc: '/movie', lastmod: new Date(), priority: 0.8, changefreq: 'weekly' },
        { loc: '/about', lastmod: new Date(), priority: 0.5, changefreq: 'monthly' },
        { loc: '/games', lastmod: new Date(), priority: 0.6, changefreq: 'weekly' },
    ];

    return [...staticPages];
})