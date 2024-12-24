<script setup>
import { marked } from 'marked';
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import moment from 'moment';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

const route = useRoute();
const loading = ref(true);
const mounted = ref(false);
const showToc = ref(false);
const activeHeading = ref('');
const headings = ref([]);
const showShareMenu = ref(false);
const copySuccess = ref(false);

const { data: blog } = await useAsyncData('blog', async () => {
    loading.value = true;
    try {
        const res = await $fetch(`/api/blog/posts/${route.params.slug}`, {
            method: 'GET'
        });
        return res.data;
    } finally {
        loading.value = false;
    }
}, {
    server: false
})

// Computed property to safely parse the blog content
const parsedContent = computed(() => {
    if (!blog.value?.content || !mounted.value) return '';
    return marked.parse(blog.value.content);
})

// 预计阅读时间
const readingTime = computed(() => {
    if (!blog.value?.content) return 0;
    const wordsPerMinute = 200;
    const words = blog.value.content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
});

// 生成唯一ID
const generateId = (text) => {
    return text
        .toLowerCase()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// 解析HTML并提取标题
const parseHeadings = () => {
    const article = document.querySelector('.markdown-body');
    if (!article) return [];

    const headingElements = article.querySelectorAll('h2, h3');
    const headings = [];

    headingElements.forEach((heading) => {
        // 为标题生成ID（如果没有的话）
        if (!heading.id) {
            heading.id = generateId(heading.textContent);
        }

        headings.push({
            id: heading.id,
            text: heading.textContent,
            level: heading.tagName.toLowerCase(),
            top: heading.offsetTop
        });
    });

    return headings;
};

// 更新活动标题
const updateActiveHeading = () => {
    const scrollPosition = window.scrollY;
    const offset = 150; // 调整偏移量以提前高亮

    // 找到第一个顶部位置大于当前滚动位置的标题
    let active = null;
    for (let i = headings.value.length - 1; i >= 0; i--) {
        if (scrollPosition + offset >= headings.value[i].top) {
            active = headings.value[i].id;
            break;
        }
    }

    // 如果没有找到活动标题，且页面接近顶部，选择第一个标题
    if (!active && scrollPosition < 100 && headings.value.length > 0) {
        active = headings.value[0].id;
    }

    activeHeading.value = active;
};

// 防抖函数
const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
};

// 初始化目录
const initToc = () => {
    // 等待DOM更新完成
    nextTick(() => {
        headings.value = parseHeadings();
        updateActiveHeading();
    });
};

// 滚动处理
const handleScroll = debounce(() => {
    updateActiveHeading();
}, 100);

// 平滑滚动到指定标题
const scrollToHeading = (headingId) => {
    const element = document.getElementById(headingId);
    if (element) {
        const offset = 100;
        const top = element.offsetTop - offset;
        window.scrollTo({
            top,
            behavior: 'smooth'
        });

        // 在移动端点击目录项后关闭目录
        if (window.innerWidth < 1024) {
            showToc.value = false;
        }
    }
};

const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
}

// 复制链接
const copyLink = async () => {
    try {
        const url = window.location.href;
        await navigator.clipboard.writeText(url);
        copySuccess.value = true;
        setTimeout(() => {
            copySuccess.value = false;
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
};

// 社交媒体分享
const shareToSocial = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(blog.value?.title || '');
    const text = encodeURIComponent(`Check out this article: ${blog.value?.title}`);

    const shareUrls = {
        twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        weibo: `http://service.weibo.com/share/share.php?url=${url}&title=${title}`,
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
};

// 监听内容变化
watch(() => parsedContent.value, () => {
    initToc();
}, { immediate: true });

// 监听窗口大小变化
let resizeTimeout;
const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        headings.value = parseHeadings();
        updateActiveHeading();
    }, 200);
};

onMounted(() => {
    mounted.value = true;
    // 配置 marked.js
    marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: true,
        langPrefix: 'hljs language-',
        highlight: function (code, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (__) { }
            }
            return hljs.highlightAuto(code).value;
        }
    });

    // 添加事件监听
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // 初始化目录
    initToc();
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleResize);
    clearTimeout(resizeTimeout);
});
</script>

<template>
    <div
        class="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <ClientOnly>
            <!-- 顶部导航栏 -->
            <nav
                class="bg-white/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between h-16">
                        <div class="flex items-center space-x-4">
                            <NuxtLink to="/blog"
                                class="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20"
                                    fill="currentColor">
                                    <path fill-rule="evenodd"
                                        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z"
                                        clip-rule="evenodd" />
                                </svg>
                                返回博客列表
                            </NuxtLink>
                        </div>
                        <button @click="showToc = !showToc"
                            class="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            <!-- 主要内容区域 -->
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="lg:grid lg:grid-cols-12 lg:gap-8">
                    <!-- 文章内容 -->
                    <article class="lg:col-span-9">
                        <!-- 骨架屏 -->
                        <div v-if="loading"
                            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
                            <div class="px-6 py-8 border-b border-gray-100 dark:border-gray-700 animate-pulse">
                                <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                                <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                                    <div class="mx-2">·</div>
                                    <div class="flex gap-2">
                                        <div class="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                        <div class="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-6 py-8 space-y-4">
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                                <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded w-full mt-6"></div>
                            </div>
                        </div>

                        <!-- 实际内容 -->
                        <div v-else
                            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
                            <!-- 文章头部信息 -->
                            <header class="px-6 py-8 border-b border-gray-100 dark:border-gray-700">
                                <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                                    {{ blog?.title }}
                                </h1>
                                <div class="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <time class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {{ formatDate(blog?.createdAt) }}
                                    </time>
                                    <div class="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {{ readingTime }} 分钟阅读
                                    </div>
                                    <div class="flex flex-wrap gap-2">
                                        <span v-for="category in blog?.categories" :key="category.id"
                                            class="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                                            {{ category.category.name }}
                                        </span>
                                    </div>
                                </div>
                            </header>

                            <!-- 文章内容 -->
                            <div class="px-6 py-8">
                                <div class="markdown-body prose prose-lg dark:prose-invert max-w-none"
                                    v-html="parsedContent">
                                </div>
                            </div>

                            <!-- 文章底部 -->
                            <footer class="px-6 py-8 border-t border-gray-100 dark:border-gray-700">
                                <div class="flex justify-between items-center">
                                    <div class="text-sm text-gray-500 dark:text-gray-400">
                                        感谢阅读
                                    </div>
                                    <div class="flex items-center space-x-4">
                                        <!-- 分享按钮 -->
                                        <div class="relative">
                                            <button @click="showShareMenu = !showShareMenu"
                                                class="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none"
                                                    viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round"
                                                        stroke-width="2"
                                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                            </button>

                                            <!-- 分享菜单 -->
                                            <div v-show="showShareMenu"
                                                class="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50">
                                                <!-- 复制链接 -->
                                                <button @click="copyLink"
                                                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none"
                                                        viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2"
                                                            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                    </svg>
                                                    <span>{{ copySuccess ? '已复制!' : '复制链接' }}</span>
                                                </button>

                                                <!-- Twitter -->
                                                <button @click="shareToSocial('twitter')"
                                                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                                                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path
                                                            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                    </svg>
                                                    <span>分享到 Twitter</span>
                                                </button>

                                                <!-- Facebook -->
                                                <button @click="shareToSocial('facebook')"
                                                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                                                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path
                                                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                    </svg>
                                                    <span>分享到 Facebook</span>
                                                </button>

                                                <!-- LinkedIn -->
                                                <button @click="shareToSocial('linkedin')"
                                                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                                                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path
                                                            d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                    </svg>
                                                    <span>分享到 LinkedIn</span>
                                                </button>

                                                <!-- 微博 -->
                                                <button @click="shareToSocial('weibo')"
                                                    class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                                                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                                        <path
                                                            d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.096-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.601l.014-.028zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.615.375-.977.42-1.804 0-2.404-.781-1.112-2.915-1.053-5.364-.03 0 0-.766.331-.571-.271.376-1.217.315-2.224-.27-2.809-1.338-1.337-4.869.045-7.888 3.08C1.309 10.87 0 13.273 0 15.348c0 3.981 5.099 6.395 10.086 6.395 6.536 0 10.888-3.801 10.888-6.82 0-1.822-1.547-2.854-2.915-3.284v.01zm1.908-5.092c-.766-.856-1.908-1.187-2.96-.962-.436.09-.706.511-.616.932.09.42.511.691.932.602.511-.105 1.067.044 1.442.465.376.421.466.977.316 1.473-.136.406.089.856.51.992.405.119.857-.105.992-.512.33-1.021.12-2.178-.646-3.035l.03.045zm2.418-2.195c-1.576-1.757-3.905-2.419-6.054-1.968-.496.104-.812.587-.706 1.081.104.496.586.813 1.082.707 1.532-.331 3.185.15 4.296 1.383.98 1.081 1.363 2.554 1.156 3.906-.09.586.181 1.172.767 1.337.586.165 1.156-.18 1.322-.767.391-1.772-.181-3.742-1.398-5.24-.465-.467-.465-.467-.465-.467v.028z" />
                                                    </svg>
                                                    <span>分享到微博</span>
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </footer>
                        </div>
                    </article>

                    <!-- 侧边栏 - 目录 -->
                    <aside class="hidden lg:block lg:col-span-3">
                        <div class="sticky top-24">
                            <nav v-if="headings.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">目录</h2>
                                <ul class="space-y-2">
                                    <li v-for="heading in headings" :key="heading.id" :class="[
                                        'group relative',
                                        heading.level === 'h3' ? 'pl-4' : '',
                                        activeHeading === heading.id ? 'bg-blue-50 dark:bg-blue-900/20 rounded' : ''
                                    ]">
                                        <div v-if="heading.level === 'h2' && activeHeading === heading.id"
                                            class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>
                                        <a href="#" @click.prevent="scrollToHeading(heading.id)" :class="[
                                            'block py-2 px-2 text-sm transition-colors duration-200 rounded',
                                            activeHeading === heading.id
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400',
                                            heading.level === 'h3' ? 'text-[13px]' : ''
                                        ]">
                                            {{ heading.text }}
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </aside>

                    <!-- 移动端目录抽屉 -->
                    <div v-show="showToc" class="fixed inset-0 z-50 lg:hidden">
                        <div class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            @click="showToc = false"></div>
                        <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
                            <div class="relative w-screen max-w-md">
                                <div class="h-full flex flex-col bg-white dark:bg-gray-800 shadow-xl">
                                    <div class="flex-1 overflow-y-auto">
                                        <div class="p-6">
                                            <div class="flex items-center justify-between mb-6">
                                                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">目录</h2>
                                                <button @click="showToc = false"
                                                    class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                                                        stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <nav v-if="headings.length > 0">
                                                <ul class="space-y-2">
                                                    <li v-for="heading in headings" :key="heading.id" :class="[
                                                        'group relative',
                                                        heading.level === 'h3' ? 'pl-4' : '',
                                                        activeHeading === heading.id ? 'bg-blue-50 dark:bg-blue-900/20 rounded' : ''
                                                    ]">
                                                        <div v-if="heading.level === 'h2' && activeHeading === heading.id"
                                                            class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r">
                                                        </div>
                                                        <a href="#" @click.prevent="scrollToHeading(heading.id)" :class="[
                                                            'block py-2 px-2 text-sm transition-colors duration-200 rounded',
                                                            activeHeading === heading.id
                                                                ? 'text-blue-600 dark:text-blue-400'
                                                                : 'text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400',
                                                            heading.level === 'h3' ? 'text-[13px]' : ''
                                                        ]">
                                                            {{ heading.text }}
                                                        </a>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClientOnly>
    </div>
</template>

<style>
/* Markdown 基础样式 */
.markdown-body {
    color: #24292e;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.8;
}

.dark .markdown-body {
    color: #c9d1d9;
}

/* 标题样式 */
.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
    scroll-margin-top: 100px;
}

.markdown-body h1 {
    font-size: 2em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaecef;
}

.dark .markdown-body h1 {
    border-bottom-color: #30363d;
}

.markdown-body h2 {
    font-size: 1.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #eaecef;
}

.dark .markdown-body h2 {
    border-bottom-color: #30363d;
}

/* 段落和列表样式 */
.markdown-body p,
.markdown-body ul,
.markdown-body ol {
    margin-bottom: 16px;
}

.markdown-body ul,
.markdown-body ol {
    padding-left: 2em;
}

.markdown-body li {
    margin: 0.25em 0;
}

/* 链接样式 */
.markdown-body a {
    color: #0366d6;
    text-decoration: none;
    transition: color 0.2s ease-in-out;
}

.markdown-body a:hover {
    color: #0969da;
    text-decoration: underline;
}

.dark .markdown-body a {
    color: #58a6ff;
}

.dark .markdown-body a:hover {
    color: #79b8ff;
}

/* 代码块样式 */
.markdown-body pre {
    margin: 16px 0;
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 8px;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.dark .markdown-body pre {
    background-color: #161b22;
}

.markdown-body code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 6px;
}

.dark .markdown-body code {
    background-color: rgba(240, 246, 252, 0.15);
}

/* 引用块样式 */
.markdown-body blockquote {
    margin: 16px 0;
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
    font-style: italic;
}

.dark .markdown-body blockquote {
    color: #8b949e;
    border-left-color: #30363d;
}

/* 表格样式 */
.markdown-body table {
    display: block;
    width: 100%;
    overflow: auto;
    margin: 16px 0;
    border-spacing: 0;
    border-collapse: collapse;
    border-radius: 8px;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.markdown-body table th,
.markdown-body table td {
    padding: 8px 16px;
    border: 1px solid #dfe2e5;
}

.dark .markdown-body table th,
.dark .markdown-body table td {
    border-color: #30363d;
}

.markdown-body table tr {
    background-color: #fff;
    border-top: 1px solid #c6cbd1;
}

.dark .markdown-body table tr {
    background-color: #0d1117;
    border-top-color: #30363d;
}

.markdown-body table tr:nth-child(2n) {
    background-color: #f6f8fa;
}

.dark .markdown-body table tr:nth-child(2n) {
    background-color: #161b22;
}

/* 图片样式 */
.markdown-body img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    transition: transform 0.2s ease-in-out;
}

.markdown-body img:hover {
    transform: scale(1.01);
}

/* 水平线样式 */
.markdown-body hr {
    height: 1px;
    padding: 0;
    margin: 24px 0;
    background-color: #e1e4e8;
    border: 0;
}

.dark .markdown-body hr {
    background-color: #30363d;
}

/* 代码高亮主题自定义 */
.hljs {
    background: transparent !important;
    padding: 0 !important;
}

/* 添加平滑过渡效果 */
.markdown-body * {
    transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
}

/* 滚动条美化 */
.markdown-body pre::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.markdown-body pre::-webkit-scrollbar-track {
    background: transparent;
}

.markdown-body pre::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
}

.dark .markdown-body pre::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.1);
}

/* 添加分享菜单动画 */
.share-menu-enter-active,
.share-menu-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.share-menu-enter-from,
.share-menu-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

/* 目录样式优化 */
.toc-link-active {
    @apply bg-blue-50 dark:bg-blue-900/20;
    position: relative;
}

.toc-link-active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: #3b82f6;
    border-radius: 0 2px 2px 0;
}

/* 移动端目录抽屉动画 */
.drawer-enter-active,
.drawer-leave-active {
    transition: transform 0.3s ease-out;
}

.drawer-enter-from,
.drawer-leave-to {
    transform: translateX(100%);
}
</style>