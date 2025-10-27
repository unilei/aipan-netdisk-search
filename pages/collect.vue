<script setup>
definePageMeta({
    layout: "netdisk",
});

// SEO配置
useHead({
    title: "收藏发布页 - AIPAN.ME",
    meta: [
        {
            name: "description",
            content: "爱盼网盘搜索引擎的收藏网站发布页，获取最新的发布地址和更新信息。",
        },
    ],
});
</script>

<template>
    <div class="custom-bg py-[60px] min-h-[calc(100vh-130px)] transition-colors duration-300">
        <div class="max-w-[800px] mx-auto px-4 py-8">
            <div class="animate-fadeIn">
                <div class="flex items-center justify-center mb-8">
                    <img class="w-16 h-16 md:w-20 md:h-20 dark:opacity-90 mr-4" src="@/assets/my-logo.png" alt="logo" />
                    <h1
                        class="text-2xl md:text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                        收藏网站发布页
                    </h1>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-link text-blue-500 mr-3 text-xl"></i>
                        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">永久发布页</h2>
                    </div>
                    <p class="text-gray-700 dark:text-gray-300 mb-4">
                        请收藏我们的永久发布页，以便随时获取最新的网站地址：
                    </p>
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                        <a href="https://link0.me/aipan" target="_blank"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-300 flex items-center">
                            <i class="fas fa-external-link-alt mr-2"></i>
                            https://link0.me/aipan
                        </a>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                        <p><i class="fas fa-info-circle mr-1"></i> 如遇到网站无法访问，请访问此发布页获取最新地址。</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div class="flex items-center mb-4">
                        <i class="fas fa-bookmark text-blue-500 mr-3 text-xl"></i>
                        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">如何收藏</h2>
                    </div>
                    <div class="space-y-4 text-gray-700 dark:text-gray-300">
                        <div class="flex items-start">
                            <div
                                class="bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <span class="font-medium text-blue-600 dark:text-blue-400">1</span>
                            </div>
                            <p>将本页添加到浏览器书签/收藏夹</p>
                        </div>
                        <div class="flex items-start">
                            <div
                                class="bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <span class="font-medium text-blue-600 dark:text-blue-400">2</span>
                            </div>
                            <p>将发布页链接保存到笔记中</p>
                        </div>
                        <div class="flex items-start">
                            <div
                                class="bg-blue-100 dark:bg-blue-900/30 w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <span class="font-medium text-blue-600 dark:text-blue-400">3</span>
                            </div>
                            <p>可以将链接发送到自己的邮箱中永久保存</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fadeIn {
    animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.custom-bg {
    position: relative;
    background-image: url("@/assets/hero-bg-1.png");
    background-size: 100% auto;
    background-position: top;
    background-repeat: no-repeat;
    background-color: rgba(245, 246, 249, 0.95);
}

.custom-bg::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(180deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.95) 100%);
    z-index: -1;
}

:root.dark .custom-bg {
    background-color: rgba(17, 24, 39, 0.95);
}

:root.dark .custom-bg::before {
    background: linear-gradient(180deg,
            rgba(17, 24, 39, 0) 0%,
            rgba(17, 24, 39, 0.98) 100%);
}
</style>