export default defineNuxtConfig({
  devtools: { enabled: false },

  // 优化构建配置
  vite: {
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        treeshake: true,
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('video.js')) {
                return 'video-js'
              }
              // 添加更多常用库的分块
              if (id.includes('@element-plus')) {
                return 'element-plus'
              }
              if (id.includes('@pinia')) {
                return 'pinia'
              }
            }
          },
        },
      },
    },
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'AIPAN.ME - 你的数字生活伙伴 | 搜索·音乐·社区·游戏·直播一站搞定',
      htmlAttrs: {
        lang: 'zh-CN'
      },
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://www.aipan.me' },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'keywords',
          content:
            'AIPAN,爱盼,数字生活伙伴,网盘搜索,资源搜索,在线音乐,博客平台,论坛社区,休闲游戏,电视直播,FM电台,影视资源,音乐播放器,TVBox,百度网盘,阿里云盘,夸克网盘,一站搞定',
        },
        {
          name: 'description',
          content:
            'AIPAN.ME是你的数字生活伙伴！集资源搜索、音乐播放、社区交流、休闲游戏、电视直播于一体。支持百度网盘、阿里云盘、夸克网盘搜索，海量影视音乐资源随心享用。一个网站，满足你的所有数字娱乐需求！',
        },
        { name: 'author', content: 'AIPAN.ME' },
        { name: 'publisher', content: 'AIPAN.ME' },
        { name: 'robots', content: 'index, follow' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#3b82f6' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: '爱盼' },
        { property: 'og:title', content: 'AIPAN.ME - 你的数字生活伙伴 | 搜索·音乐·社区·游戏·直播一站搞定' },
        {
          property: 'og:description',
          content:
            'AIPAN.ME是你的数字生活伙伴！集资源搜索、音乐播放、社区交流、休闲游戏、电视直播于一体，一个网站满足所有数字娱乐需求。',
        },
        { property: 'og:image', content: 'https://www.aipan.me/logo.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:url', content: 'https://www.aipan.me' },
        { property: 'og:locale', content: 'zh_CN' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@aipan_me' },
        { name: 'twitter:title', content: 'AIPAN.ME - 你的数字生活伙伴 | 搜索·音乐·社区·游戏·直播一站搞定' },
        {
          name: 'twitter:description',
          content: '你的数字生活伙伴！资源搜索、音乐播放、社区交流、休闲游戏、电视直播，一个网站满足所有需求！',
        },
        { name: 'twitter:image', content: 'https://www.aipan.me/logo.png' },
        // 统一 referrer 策略
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },
      ],
      script: [
        {
          src: 'https://www.googletagmanager.com/gtag/js?id=G-17SPF6S871',
          async: true,
        },
        {
          src: '/ga.js',
          defer: true,
        },
        {
          src: '/qrcode.min.js',
          defer: true,
        },
        {
          src: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
          async: true,
        },
        {
          src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8210373406341452',
          async: true,
          crossorigin: 'anonymous',
        },
      ],
    },
  },

  // build modules
  modules: [
    '@element-plus/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/device',
    '@nuxtjs/google-fonts',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/i18n',
  ],

  // i18n 配置 - 简化版本
  i18n: {
    // 禁用浏览器语言自动检测和重定向
    detectBrowserLanguage: false,
    // 支持的语言列表
    locales: [
      { code: 'zh', iso: 'zh-CN', name: '中文', file: 'zh.json' },
      { code: 'en', iso: 'en-US', name: 'English', file: 'en.json' }
    ],
    // 默认语言
    defaultLocale: 'zh',
    // 路由策略: 除了默认语言外其他语言添加前缀
    strategy: 'prefix_except_default',
    // 语言文件目录
    langDir: 'locales'
  },
  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'light',
    classSuffix: '',
  },

  tailwindcss: {
    configPath: 'tailwind.config.js',
  },

  googleFonts: {
    display: 'swap',
    prefetch: false,
    preconnect: false,
    preload: true,
    download: false,
    base64: false,
    families: {
      Inter: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      'Poetsen One': [100, 200, 300, 400, 500, 600, 700, 800, 900],
      'Sedan SC': [100, 200, 300, 400, 500, 600, 700, 800, 900],
      'Briem Hand': [100, 200, 300, 400, 500, 600, 700, 800, 900],
      'Noto Sans Simplified Chinese': [100, 200, 300, 400, 500, 600, 700, 800, 900],
    },
  },
  plugins: [],
  nitro: {
    devProxy: {
      '/aipanme': {
        target: '',
        changeOrigin: true,
      },
    },
    experimental: {
      wasm: true,
    },
  },
  runtimeConfig: {
    // 兼容两种格式的环境变量，优先使用 NUXT_ 前缀的变量
    adminUser: process.env.NUXT_ADMIN_USER || process.env.ADMIN_USER,
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
    adminEmail: process.env.NUXT_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
    jwtSecret: process.env.NUXT_JWT_SECRET || process.env.JWT_SECRET,
    public: {
      GITHUB_OWNER: process.env.NUXT_PUBLIC_GITHUB_OWNER,
      GITHUB_REPO: process.env.NUXT_PUBLIC_GITHUB_REPO,
      GITHUB_TOKEN: process.env.NUXT_PUBLIC_GITHUB_TOKEN,
      GITHUB_BRANCH: process.env.NUXT_PUBLIC_GITHUB_BRANCH,
      QUARK_COOKIE: process.env.NUXT_PUBLIC_QUARK_COOKIE,
      WS_PORT: process.env.NUXT_PUBLIC_WS_PORT || '3002'
    },
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/admin/**'],
  },
  site: {
    name: 'AIPAN.ME - 你的数字生活伙伴',
    url: 'https://www.aipan.me',
    description:
      'AIPAN.ME是你的数字生活伙伴！集资源搜索、音乐播放、社区交流、休闲游戏、电视直播于一体，一个网站满足所有数字娱乐需求。',
  },
  compatibilityDate: '2024-09-12',
})
