<script setup>
import { marked } from 'marked';
import { computed, ref } from 'vue';
import moment from 'moment';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

const route = useRoute();
const loading = ref(true);

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
            } catch (__) {}
        }
        return hljs.highlightAuto(code).value;
    }
});

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
})

// Computed property to safely parse the blog content
const parsedContent = computed(() => {
    if (!blog.value?.content) return '';
    return marked.parse(blog.value.content);
})

const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<template>
    <div class="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
        <!-- 顶部导航栏 -->
        <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    <NuxtLink 
                        to="/blog"
                        class="flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                        返回博客列表
                    </NuxtLink>
                </div>
            </div>
        </div>

        <!-- 文章内容区域 -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- 骨架屏 -->
            <article v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all duration-300">
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
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
            </article>

            <!-- 实际内容 -->
            <article v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transition-all duration-300">
                <div class="px-6 py-8 border-b border-gray-100 dark:border-gray-700">
                    <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {{ blog?.title }}
                    </h1>
                    <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <time>{{ formatDate(blog?.createdAt) }}</time>
                        <span class="mx-2">·</span>
                        <div class="flex gap-2">
                            <span 
                                v-for="category in blog?.categories" 
                                :key="category.id"
                                class="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs"
                            >
                                {{ category.category.name }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="px-6 py-8">
                    <div 
                        class="markdown-body prose prose-lg dark:prose-invert max-w-none"
                        v-html="parsedContent"
                    ></div>
                </div>
            </article>
        </div>
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
}

.markdown-body a:hover {
    text-decoration: underline;
}

.dark .markdown-body a {
    color: #58a6ff;
}

/* 代码块样式 */
.markdown-body pre {
    margin: 16px 0;
    padding: 16px;
    overflow: auto;
    font-size: 85%;
    line-height: 1.45;
    background-color: #f6f8fa;
    border-radius: 6px;
}

.dark .markdown-body pre {
    background-color: #161b22;
}

.markdown-body code {
    padding: 0.2em 0.4em;
    margin: 0;
    font-size: 85%;
    background-color: rgba(27,31,35,0.05);
    border-radius: 6px;
}

.dark .markdown-body code {
    background-color: rgba(240,246,252,0.15);
}

/* 引用块样式 */
.markdown-body blockquote {
    margin: 16px 0;
    padding: 0 1em;
    color: #6a737d;
    border-left: 0.25em solid #dfe2e5;
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
}

.markdown-body table th,
.markdown-body table td {
    padding: 6px 13px;
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
    box-sizing: content-box;
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

.dark .markdown-body img {
    background-color: #0d1117;
}

/* 水平线样式 */
.markdown-body hr {
    height: 0.25em;
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
</style>