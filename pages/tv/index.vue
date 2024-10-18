<script setup>
import Hls from "hls.js";
import bgImage from '~/assets/tv-bg-1.jpg';

definePageMeta({
    layout: 'custom',
});

const tvSources = ref([]);
const videoPlayer = ref(null);
const videoSrc = ref('');
const modalShow = ref(false);
const videoPlayStatus = ref(false);
const videoLoading = ref(false);
const videoMuted = ref(false);

let hls = null;  // 缓存 HLS 实例
let currentEffectIndex = 0;

// 获取视频源
const getTvSources = async () => {
    try {
        const res = await $fetch('https://r2cf.aipan.me/tv.json');
        if (videoSrc.value === '') {
            videoSrc.value = res[0].url;
            // loadHLS(videoSrc.value);  // 初始化第一个视频源
        }
        tvSources.value = res;
    } catch (error) {
        console.error('Error fetching TV sources:', error);
    }
};

// 加载 HLS 视频
const loadHLS = (url) => {
    // 判断是否是 m3u8 格式
    if (url.endsWith('.m3u8')) {
        if (!hls && Hls.isSupported()) {
            hls = new Hls();
            hls.attachMedia(videoPlayer.value);
        }
        if (Hls.isSupported()) {
            hls.loadSource(url);
            videoPlayer.value.play();
            videoPlayer.value.muted = videoMuted.value;
            videoPlayStatus.value = true;
            videoLoading.value = false;
            modalShow.value = false;
        } else if (videoPlayer.value.canPlayType('application/vnd.apple.mpegurl')) {
            // 对于 Safari 或其他原生支持 HLS 的浏览器
            videoPlayer.value.src = url;
            videoPlayer.value.play();
            videoPlayer.value.muted = videoMuted.value;
            videoPlayStatus.value = true;
            videoLoading.value = false;
            modalShow.value = false;
        }
    } else {
        // 如果不是 m3u8，直接将 URL 赋值给 videoPlayer 的 src
        if (hls) {
            hls.destroy();
            hls = null; // 确保 HLS 实例不再被使用
        }
        videoPlayer.value.src = url;
        videoPlayer.value.load();  // 加载新视频
        videoPlayer.value.play();
        videoPlayer.value.muted = videoMuted.value;
        videoPlayStatus.value = true;
        videoLoading.value = false;
        modalShow.value = false;
    }
};

// 视频切换处理
const handleSwithcSource = (url) => {
    videoLoading.value = true;

    // 在切换视频源之前，停止当前视频播放，并清除旧的src
    if (videoPlayer.value) {
        videoPlayer.value.pause();
        videoPlayer.value.removeAttribute('src'); // 清空旧视频源
        videoPlayer.value.load();  // 重置 <video> 标签
    }

    videoSrc.value = url;
    loadHLS(url);
};
// 视频播放和暂停
const handleSwitchVideoStatus = () => {
    if (videoPlayer.value.paused) {
        videoPlayer.value.play();
        videoPlayStatus.value = true;
    } else {
        videoPlayer.value.pause();
        videoPlayStatus.value = false;
    }
};

// 切换视频主题效果
const videoEffects = [
    'nostalgia-video', 'nostalgia2-video', 'vintage-video', 'dreamy-video',
    'cinematic-video', 'high-contrast-bw-video', 'neon-night-video',
    'film-video', 'sunset-video', 'cool-tone-video', 'gothic-video',
    'psychedelic-video'
];

const handleSwitchVideoTheme = () => {
    videoPlayer.value.classList.remove(videoEffects[currentEffectIndex]);
    currentEffectIndex = (currentEffectIndex + 1) % videoEffects.length;
    videoPlayer.value.classList.add(videoEffects[currentEffectIndex]);
};

// 重置视频主题
const handleResetTheme = () => {
    videoEffects.forEach(effect => {
        videoPlayer.value.classList.remove(effect);
    });
};

// 全屏功能
const handleFullscreen = () => {
    if (!document.fullscreenElement) {
        if (videoPlayer.value.requestFullscreen) {
            videoPlayer.value.requestFullscreen();
        } else if (videoPlayer.value.mozRequestFullScreen) {
            videoPlayer.value.mozRequestFullScreen();
        } else if (videoPlayer.value.webkitRequestFullscreen) {
            videoPlayer.value.webkitRequestFullscreen();
        } else if (videoPlayer.value.msRequestFullscreen) {
            videoPlayer.value.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
};

// 处理视频加载和播放状态
const handleWaiting = () => {
    videoLoading.value = true;
};

const handlePlaying = () => {
    videoLoading.value = false;
};
const handleMute = () => {
    if (videoPlayer.value.muted) {
        videoPlayer.value.muted = false;
        videoMuted.value = false
    } else {
        videoPlayer.value.muted = true;
        videoMuted.value = true
    }
}
// 页面挂载和销毁
onMounted(() => {
    getTvSources();

    videoPlayer.value.addEventListener('waiting', handleWaiting);
    videoPlayer.value.addEventListener('playing', handlePlaying);
});

onBeforeUnmount(() => {
    if (hls) {
        hls.destroy();
        hls = null;  // 确保不再引用该实例
    }
    if (videoPlayer.value) {
        videoPlayer.value.removeEventListener('waiting', handleWaiting);
        videoPlayer.value.removeEventListener('playing', handlePlaying);
        videoPlayer.value = null;
    }
});
</script>

<template>
    <div class="dark:bg-slate-800 min-h-screen bg-no-repeat bg-cover bg-center relative"
        :style="{ 'background-image': `url(${bgImage})` }">
        <div class="absolute top-0 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm"></div>
        <div class="fixed bottom-10 left-10 right-10 top-10 rounded-xl max-w-screen-lg mx-auto">
            <div class="w-full rounded-t-xl dark:bg-slate-700">
                <div
                    class="relative w-full h-full bg-black rounded-t-md overflow-hidden px-6 pt-6 flex items-center justify-center aspect-video">
                    <video ref="videoPlayer" id="video"
                        class="w-full h-full relative shadow-md border border-gray-900 rounded-md"></video>
                    <div v-if="!videoPlayStatus"
                        class="absolute top-6 left-6 right-6 bottom-0 video-mask shadow-xl rounded-md flex items-center justify-center">
                        <button class="bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                            @click="handleSwithcSource(videoSrc)">开机</button>
                    </div>
                    <div v-if="videoLoading"
                        class="absolute top-6 left-6 right-6 bottom-0  flex items-center justify-center bg-black/50 z-50 bg-[url('@/assets/tvstatic.gif')]">
                        <div class="text-white text-lg font-semibold">
                            <button class="ml-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                                @click="videoLoading = !videoLoading">关闭</button>
                        </div>
                    </div>
                </div>
                <div class="p-4 rounded-b-xl bg-black text-center text-white text-sm font-semibold">
                    <nuxt-link to="/">AIPAN</nuxt-link>
                </div>

                <div class="grid grid-cols-12">
                    <div class="col-span-4 flex items-center gap-2">

                    </div>
                    <div class="col-span-4">
                        <div class="bg-black w-10 h-10 mx-auto"></div>
                        <div class="bg-black w-full h-10"></div>
                    </div>
                    <div class="col-span-4 flex items-center justify-end gap-2">
                        <button class="bg-gray-500 text-white px-2 py-1 rounded-md text-xs hover:text-md" type="button"
                            @click="modalShow = !modalShow">频道</button>
                        <button class="bg-gray-500 text-white px-2 py-1 rounded-md text-xs hover:text-md" type="button"
                            @click="handleMute">{{ !videoMuted ? '静音' : '取消静音' }}</button>
                        <button type="button" class=" bg-gray-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                            @click="handleSwitchVideoStatus">
                            {{ !videoPlayStatus ? '播放' : '暂停' }}
                        </button>
                        <button type="button" class="bg-gray-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                            @click="handleSwitchVideoTheme">
                            换肤
                        </button>
                        <button type="button" class=" bg-gray-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                            @click="handleResetTheme">
                            重置
                        </button>
                        <button type="button" class=" bg-gray-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                            @click="handleFullscreen">
                            全屏
                        </button>
                    </div>
                </div>
            </div>

        </div>


        <div v-if="modalShow"
            class="fixed bottom-0 left-0 right-0 w-full h-full bg-black/50 flex flex-col items-center justify-center">
            <div class="bg-white p-10 rounded-xl dark:bg-black dark:text-white">
                <div class="flex flex-row items-center justify-center gap-2">
                    <input class="border border-gray-300 px-4 py-2 rounded-md w-2/3" type="text" v-model="videoSrc"
                        placeholder="请输入视频链接">
                    <button class="bg-red-500 text-white px-2 py-2 rounded-md text-xs hover:text-md" type="button"
                        @click="handleSwithcSource(videoSrc)">切换视频</button>
                </div>
                <div class="flex flex-row flex-wrap items-center justify-center max-w-screen-sm mx-auto gap-4 mt-5">
                    <div class="text-sm font-semibold border border-gray-300 text-slate-600 dark:text-white dark:bg-slate-700 rounded-full p-2 cursor-pointer  hover:bg-black hover:text-white transition duration-300"
                        :class="{ 'bg-black text-white': item.url === videoSrc }" v-for=" (item, index) in tvSources"
                        :key="index" @click="handleSwithcSource(item.url)">
                        {{ item.name }}
                    </div>
                </div>

                <div class="flex flex-row items-center justify-center gap-2 mt-5">
                    <button class="bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md" type="button"
                        @click="modalShow = false">关闭</button>
                </div>
            </div>
        </div>
    </div>

</template>
<style scoped>
.video-mask {
    background: repeating-linear-gradient(0deg, #000, #302e2e 4px, #000);
}

.nostalgia-video {
    width: 100%;
    height: auto;
    filter: sepia(0.8) contrast(1.2) brightness(0.9);
    /* 添加一些模糊效果 */
    filter: blur(1px);
    /* 添加一些噪点效果 */
    background: rgba(255, 255, 255, 0.1);
}

.nostalgia-video::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
}

.nostalgia2-video {
    width: 100%;
    height: auto;
    filter: sepia(0.8) contrast(1.2) brightness(0.9) blur(1px) grayscale(100%);
    background: rgba(255, 255, 255, 0.1);
    position: relative;
}

.nostalgia2-video::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    pointer-events: none;
}

.vintage-video {
    filter: sepia(0.6) saturate(0.6) contrast(1.2) brightness(0.9) hue-rotate(-20deg);
}

.dreamy-video {
    filter: blur(3px) saturate(1.5) brightness(1.2) contrast(0.9);
}

.cinematic-video {
    filter: brightness(0.8) contrast(1.3) saturate(0.8) hue-rotate(180deg);
}

.high-contrast-bw-video {
    filter: grayscale(100%) contrast(2) brightness(0.8);
}

.neon-night-video {
    filter: brightness(1.2) contrast(1.5) saturate(2) hue-rotate(290deg);
}

.film-video {
    filter: sepia(0.4) contrast(1.1) brightness(0.9) grain(0.5);
}

.sunset-video {
    filter: brightness(1.1) contrast(1.2) saturate(1.8) hue-rotate(30deg);
}

.cool-tone-video {
    filter: brightness(0.8) contrast(1.1) saturate(0.8) hue-rotate(200deg);
}

.gothic-video {
    filter: brightness(0.6) contrast(1.5) grayscale(0.9) hue-rotate(250deg);
}

.psychedelic-video {
    filter: contrast(2) saturate(2) hue-rotate(340deg) brightness(1.2);
}
</style>