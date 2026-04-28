import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  devtools: { enabled: false },
  // 优化构建配置
  vite: {
    plugins: [tailwindcss()],
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
      title: '爱盼迷 - 一站式资源聚合平台 | 网盘搜索·音乐·电影·游戏·直播',
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
            '爱盼迷,网盘搜索,资源搜索,百度网盘,阿里云盘,夸克网盘,在线音乐,电影播放,电视直播,FM电台,博客平台,社区论坛,休闲游戏,影视资源,音乐播放器,TVBox,资源聚合,一站式娱乐',
        },
        {
          name: 'description',
          content:
            '爱盼迷是一站式资源聚合平台！集网盘搜索、在线音乐、电影电视、休闲游戏、直播电台于一体。支持百度网盘、阿里云盘、夸克网盘多源搜索，海量影视音乐资源随心享用。社区论坛、博客分享、AI搜索等功能齐全，满足你的所有数字娱乐需求！',
        },
        { name: 'author', content: '爱盼迷' },
        { name: 'publisher', content: '爱盼迷' },
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: '爱盼迷' },
        { property: 'og:title', content: '爱盼迷 - 一站式资源聚合平台 | 网盘搜索·音乐·电影·游戏·直播' },
        {
          property: 'og:description',
          content:
            '爱盼迷是一站式资源聚合平台，集网盘搜索、在线音乐、电影电视、休闲游戏、直播电台于一体。支持百度网盘、阿里云盘、夸克网盘多源搜索，满足你的所有数字娱乐需求！',
        },
        { property: 'og:image', content: 'https://www.aipan.me/default-og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:url', content: 'https://www.aipan.me' },
        { property: 'og:locale', content: 'zh_CN' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@aipanmi' },
        { name: 'twitter:title', content: '爱盼迷 - 一站式资源聚合平台' },
        {
          name: 'twitter:description',
          content: '网盘搜索、在线音乐、电影电视、休闲游戏、直播电台，一个平台满足所有数字娱乐需求！',
        },
        { name: 'twitter:image', content: 'https://www.aipan.me/default-og-image.png' },
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

  // Element Plus 配置
  elementPlus: {
    importStyle: 'scss',
    themes: ['dark'],
  },

  // build modules
  modules: [
    '@element-plus/nuxt',
    '@nuxtjs/device',
    '@nuxtjs/google-fonts',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/i18n',
  ],

  // Pinia 配置
  pinia: {
    storesDirs: ['./stores/**'],
  },

  // Pinia Plugin Persistedstate 配置
  piniaPluginPersistedstate: {
    storage: 'localStorage',
    debug: true,
  },

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
  css: [
    '~/assets/css/main.css',
    'element-plus/theme-chalk/dark/css-vars.css',
  ],

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

  googleFonts: {
    display: 'swap',
    prefetch: false,
    preconnect: false,
    preload: true,
    download: false,
    base64: false,
    families: {
      // Only load weights actually used in the project (400 normal, 500 medium, 600 semibold, 700 bold)
      // Removed Noto Sans Simplified Chinese — CJK font files are too large; system font stack covers Chinese well
      // Removed Poetsen One, Sedan SC, Briem Hand — not referenced in any font-family rule
      Inter: [400, 500, 600, 700],
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
    // 确保 API 路由正确处理
    routeRules: {
      // OG图片API - 长期缓存
      '/api/og-image': {
        headers: { 'Cache-Control': 'max-age=86400' },
        prerender: false
      }
    }
  },
  runtimeConfig: {
    // 兼容两种格式的环境变量，优先使用 NUXT_ 前缀的变量
    corsAllowedOrigins: process.env.NUXT_CORS_ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGINS || 'https://aipan.me,https://www.aipan.me',
    adminUser: process.env.NUXT_ADMIN_USER || process.env.ADMIN_USER,
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD,
    adminEmail: process.env.NUXT_ADMIN_EMAIL || process.env.ADMIN_EMAIL,
    jwtSecret: process.env.NUXT_JWT_SECRET || process.env.JWT_SECRET,
    settingsEncryptionKey:
      process.env.NUXT_SETTINGS_ENCRYPTION_KEY ||
      process.env.SETTINGS_ENCRYPTION_KEY,
    pansouApiUrls: process.env.NUXT_PANSOU_API_URLS || process.env.PANSOU_API_URLS || 'https://so.252035.xyz/api/search,https://pansou.aipan.me/api/search,https://pansou.app/api/search',
    elasticsearchNode:
      process.env.NUXT_ELASTICSEARCH_NODE || process.env.ELASTICSEARCH_NODE,
    elasticsearchUsername:
      process.env.NUXT_ELASTICSEARCH_USERNAME ||
      process.env.ELASTICSEARCH_USERNAME,
    elasticsearchPassword:
      process.env.NUXT_ELASTICSEARCH_PASSWORD ||
      process.env.ELASTICSEARCH_PASSWORD,
    elasticsearchCaFingerprint:
      process.env.NUXT_ELASTICSEARCH_CA_FINGERPRINT ||
      process.env.ELASTICSEARCH_CA_FINGERPRINT,
    elasticsearchUserResourceIndex:
      process.env.NUXT_ELASTICSEARCH_USER_RESOURCE_INDEX ||
      process.env.ELASTICSEARCH_USER_RESOURCE_INDEX ||
      'user-resources',
    elasticsearchResourceIndex:
      process.env.NUXT_ELASTICSEARCH_RESOURCE_INDEX ||
      process.env.ELASTICSEARCH_RESOURCE_INDEX ||
      'resources',
    githubOwner: process.env.NUXT_PUBLIC_GITHUB_OWNER || process.env.GITHUB_OWNER,
    githubRepo: process.env.NUXT_PUBLIC_GITHUB_REPO || process.env.GITHUB_REPO,
    githubToken: process.env.NUXT_PUBLIC_GITHUB_TOKEN || process.env.GITHUB_TOKEN,
    githubBranch: process.env.NUXT_PUBLIC_GITHUB_BRANCH || process.env.GITHUB_BRANCH,
    quarkCookie: process.env.NUXT_PUBLIC_QUARK_COOKIE || process.env.QUARK_COOKIE,
    public: {
      WS_PORT: process.env.NUXT_PUBLIC_WS_PORT || '3002'
    },
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/admin/**', '/user/**'],
  },
  site: {
    name: '爱盼迷 - 一站式资源聚合平台',
    url: 'https://www.aipan.me',
    description:
      '爱盼迷是一站式资源聚合平台！集网盘搜索、在线音乐、电影电视、休闲游戏、直播电台于一体。支持百度网盘、阿里云盘、夸克网盘多源搜索，满足你的所有数字娱乐需求。',
  },
  compatibilityDate: '2026-03-06',
})
