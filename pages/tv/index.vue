<script setup>
import { tvSources } from '~/assets/vod/tv.js';
import Hls from "hls.js"
import bgImage from '~/assets/tv-bg-1.jpg'

const config = useRuntimeConfig();
definePageMeta({
    layout: 'custom',
})
const videoPlayer = ref(null);
const sourceIndex = ref(0);
const videoSrc = ref(tvSources[0]['sources'][0]['url']);
const modalShow = ref(false);
const videoPlayStatus = ref(false)
const videoLoading = ref(false)
const liveBaseUrl = config.public.liveBaseUrlForTv

const verifyIncludeHttpsOrHttp = (url) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
        return true
    }
    return false
}

onMounted(() => {

    // Video events to manage loading state
    videoPlayer.value.addEventListener('waiting', () => {
        videoLoading.value = true;  // Show loading text
    });

    videoPlayer.value.addEventListener('playing', () => {
        videoLoading.value = false;  // Hide loading text when video starts playing
    });

    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(verifyIncludeHttpsOrHttp(videoSrc.value) ? videoSrc.value : liveBaseUrl + videoSrc.value);
        hls.attachMedia(videoPlayer.value);
        if (videoPlayer.value) {
            videoPlayer.value.play();
            videoPlayStatus.value = true
        }
    }
    // HLS.js is not supported on platforms that do not have Media Source
    // Extensions (MSE) enabled.
    //
    // When the browser has built-in HLS support (check using `canPlayType`),
    // we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video
    // element through the `src` property. This is using the built-in support
    // of the plain video element, without using HLS.js.
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {

        if (videoPlayer.value) {
            videoPlayer.value.src = verifyIncludeHttpsOrHttp(videoSrc.value) ? videoSrc.value : liveBaseUrl + videoSrc.value;
            videoPlayer.value.play();
            videoPlayStatus.value = true
        }
    }

})


onUnmounted(() => {
    if (videoPlayer.value) {
        videoPlayer.value.dispose();
    }
})
const handleSwithcSource = (url) => {
    videoLoading.value = true
    videoSrc.value = url
    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(verifyIncludeHttpsOrHttp(url) ? url : liveBaseUrl + url);
        hls.attachMedia(videoPlayer.value);
        videoPlayer.value.play();
        videoPlayStatus.value = true
        modalShow.value = false
    }
    // HLS.js is not supported on platforms that do not have Media Source
    // Extensions (MSE) enabled.
    //
    // When the browser has built-in HLS support (check using `canPlayType`),
    // we can provide an HLS manifest (i.e. .m3u8 URL) directly to the video
    // element through the `src` property. This is using the built-in support
    // of the plain video element, without using HLS.js.
    else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.value.src = verifyIncludeHttpsOrHttp(url) ? url : liveBaseUrl + url;
        videoPlayer.value.play();
        videoPlayStatus.value = true
        modalShow.value = false
    }
}


const handleSwitchVideoStatus = () => {

    if (videoPlayer.value.paused) {
        videoPlayer.value.play();
        videoPlayStatus.value = true
    } else {
        videoPlayer.value.pause();
        videoPlayStatus.value = false
    }
}

let currentEffectIndex = 0;

const handleSwitchVideoTheme = () => {
    const videoEffects = [
        'nostalgia-video',
        'nostalgia2-video',
        'vintage-video',
        'dreamy-video',
        'cinematic-video',
        'high-contrast-bw-video',
        'neon-night-video',
        'film-video',
        'sunset-video',
        'cool-tone-video',
        'gothic-video',
        'psychedelic-video'
    ];

    // Remove the current effect
    videoPlayer.value.classList.remove(videoEffects[currentEffectIndex]);

    // Increment the index to loop through effects
    currentEffectIndex = (currentEffectIndex + 1) % videoEffects.length;

    // Add the new effect
    videoPlayer.value.classList.add(videoEffects[currentEffectIndex]);
}
const handleResetTheme = () => {
    videoPlayer.value.classList.remove('nostalgia-video');
    videoPlayer.value.classList.remove('nostalgia2-video');
    videoPlayer.value.classList.remove('vintage-video');
    videoPlayer.value.classList.remove('dreamy-video');
    videoPlayer.value.classList.remove('cinematic-video');
    videoPlayer.value.classList.remove('high-contrast-bw-video');
    videoPlayer.value.classList.remove('neon-night-video');
    videoPlayer.value.classList.remove('film-video');
    videoPlayer.value.classList.remove('sunset-video');
    videoPlayer.value.classList.remove('cool-tone-video');
    videoPlayer.value.classList.remove('gothic-video');
    videoPlayer.value.classList.remove('psychedelic-video');
}
</script>

<template>
    <div class="pt-20 dark:bg-slate-800 min-h-screen bg-no-repeat bg-cover bg-center"
        :style="{ 'background-image': `url(${bgImage})` }">
        <!-- Loading text -->
        <div v-if="videoLoading"
            class="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black/50 z-50">
            <div class="text-white text-lg font-semibold">正在加载视频，请稍候... <button
                    class="ml-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                    @click="videoLoading = !videoLoading">关闭</button></div>
        </div>
        <div class="fixed bottom-10 left-0 right-0 w-full h-ful">
            <div class="bg-black max-w-screen-lg mx-auto px-10 pt-10 pb-4 rounded-xl">
                <video ref="videoPlayer" id="video" class="w-full relative"></video>
                <div class="mt-4 grid grid-cols-12">
                    <div class="col-span-4">
                        <button class="bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md" type="button"
                            @click="modalShow = !modalShow">切换频道</button>
                    </div>
                    <div class="col-span-4">
                        <div class="text-center text-white text-sm font-semibold">
                            AIPAN
                        </div>
                    </div>
                    <div class="col-span-4 flex justify-end">
                        <button type="button"
                            class=" ml-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                            @click="handleSwitchVideoStatus">
                            {{ !videoPlayStatus ? '播放' : '暂停' }}
                        </button>
                        <button type="button"
                            class=" ml-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                            @click="handleSwitchVideoTheme">
                            换肤
                        </button>
                        <button type="button"
                            class=" ml-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                            @click="handleResetTheme">
                            重置
                        </button>
                    </div>
                </div>
            </div>
            <div class="w-14 h-20 bg-black mx-auto"></div>
            <div class="w-1/4 h-14 bg-black mx-auto"></div>
        </div>


        <div v-if="modalShow"
            class="fixed bottom-0 left-0 right-0 w-full h-full bg-black/50 flex flex-col items-center justify-center">
            <div class="bg-white p-10 rounded-xl dark:bg-black dark:text-white">
                <div class="flex flex-row flex-wrap items-center justify-center max-w-screen-lg mx-auto gap-4 ">
                    <div class="text-sm font-semibold border border-gray-300 text-slate-600 dark:text-white dark:bg-slate-700 rounded-full p-2 cursor-pointer  hover:bg-black hover:text-white transition duration-300"
                        :class="{ 'bg-black text-white': sourceIndex === index }" v-for=" (item, index) in tvSources"
                        :key="index" @click="sourceIndex = index">
                        {{ item.label }}
                    </div>
                </div>

                <div class="flex flex-row flex-wrap items-center justify-center max-w-screen-sm mx-auto gap-4 mt-5">
                    <div class="text-sm font-semibold border border-gray-300 text-slate-600 dark:text-white dark:bg-slate-700 rounded-full p-2 cursor-pointer  hover:bg-black hover:text-white transition duration-300"
                        :class="{ 'bg-black text-white': item.url === videoSrc }"
                        v-for=" (item, index) in tvSources[sourceIndex]['sources']" :key="index"
                        @click="handleSwithcSource(item.url)">
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