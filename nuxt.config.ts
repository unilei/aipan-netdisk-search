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
      title: '爱盼：资源随心，娱乐无限',
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
      meta: [
        {
          name: 'keywords',
          content:
            '爱盼, 开源, 免费资源搜索, 网盘搜索, 音乐下载, TVBox数据接口, 电视直播, 博客发布, 影视资源, 教学工具, 非商业用途',
        },
        {
          hid: 'description',
          name: 'description',
          content:
            '爱盼是一个开源免费的资源搜索平台，提供网盘资源搜索、音乐下载、TV直播、TVBox接口地址以及博客发布等多项功能，打造丰富的影视音聚合体验，供学习与探索使用，不支持商业用途。',
        },
        { name: 'format-detection', content: 'telephone=no' },
        { property: 'og:title', content: '爱盼：资源随心，音乐下载与影视聚合平台' },
        {
          property: 'og:description',
          content:
            '爱盼是一个开源免费的资源搜索平台，提供网盘、音乐、影视等多种资源，一站式服务，供学习使用。',
        },
        { property: 'og:image', content: 'https://aipan.me/logo.png' },
        { property: 'og:url', content: 'https://aipan.me' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '爱盼：资源随心，音乐下载与影视聚合平台' },
        {
          name: 'twitter:description',
          content: '免费开源的资源搜索平台，涵盖音乐、网盘、影视等内容，学习探索好去处！',
        },
        { name: 'twitter:image', content: 'https://aipan.me/logo.png' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
    '@nuxt/image',
    '@element-plus/nuxt',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/device',
    '@nuxtjs/i18n',
    '@nuxtjs/google-fonts',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/sitemap',
  ],

  image: {
    provider: 'ipx',
    dir: 'public',
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      '2xl': 1536,
    },
    domains: ['img1.doubanio.com', 'img2.doubanio.com', 'img3.doubanio.com', 'img9.doubanio.com'],
    alias: {
      douban: 'https://img1.doubanio.com',
    },
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

  i18n: {
    defaultLocale: 'cn',
    langDir: './assets/lang/',
    locales: [
      {
        code: 'en',
        name: 'English',
        language: 'en-US',
        file: 'en-US.json',
      },
      {
        code: 'cn',
        name: '中文',
        language: 'zh-CN',
        file: 'zh-CN.json',
      },
    ],
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
    adminUser: process.env.ADMIN_USER,
    adminPassword: process.env.ADMIN_PASSWORD,
    adminEmail: process.env.ADMIN_EMAIL,
    jwtSecret: process.env.JWT_SECRET,
    public: {
      GITHUB_OWNER: process.env.NUXT_PUBLIC_GITHUB_OWNER,
      GITHUB_REPO: process.env.NUXT_PUBLIC_GITHUB_REPO,
      GITHUB_TOKEN: process.env.NUXT_PUBLIC_GITHUB_TOKEN,
      GITHUB_BRANCH: process.env.NUXT_PUBLIC_GITHUB_BRANCH,
    },
  },
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    exclude: ['/admin/**'],
  },
  site: {
    name: '爱盼 - 资源随心，娱乐无限',
    url: 'https://www.aipan.me',
    description:
      '爱盼 - 资源随心，娱乐无限， 一个开源免费的网盘资源搜索程序，仅供学习使用，不支持商业用途。',
  },
  compatibilityDate: '2024-09-12',
})
