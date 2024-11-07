<script setup>
useHead({
    title: '爱盼 - 电视直播与 Alist 数据源聚合播放',
    meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, shrink-to-fit=no' },
        { name: 'keywords', content: '爱盼, 电视直播, Alist 数据源, 聚合播放, 在线电视' },
        { hid: 'description', name: 'description', content: '爱盼提供最新的电视直播和 Alist 数据源聚合播放，轻松享受精彩内容！' },
        { name: 'author', content: '爱盼团队' },
        { name: 'robots', content: 'index, follow' },
        { name: 'format-detection', content: 'telephone=no' },
        { property: 'og:title', content: '爱盼 - 电视直播与 Alist 数据源聚合播放' },
        { property: 'og:description', content: '爱盼提供最新的电视直播和 Alist 数据源聚合播放，轻松享受精彩内容！' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: "https://aipan.me/tv" }, // 动态获取当前页面的 URL
        { property: 'og:image', content: '/logo.png' }, // 替换为适当的缩略图链接
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: '爱盼 - 电视直播与 Alist 数据源聚合播放' },
        { name: 'twitter:description', content: '爱盼提供最新的电视直播和 Alist 数据源聚合播放，轻松享受精彩内容！' },
        { name: 'twitter:image', content: '/logo.png' } // 替换为适当的 Twitter 卡片图像链接
    ]
});
import Hls from "hls.js";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import bgImage from '~/assets/tv-bg-1.jpg';
import { sourcesAipan } from "~/assets/vod/tv";
import { useTvStore } from "~/stores/tv";
definePageMeta({
    layout: 'custom',
});
const tvStore = useTvStore();
const sourceIndex = ref(0);
const tvSources = ref([]);
const videoPlayer = ref(null);
const videoSrc = ref('');
const modalShow = ref(false);
const videoPlayStatus = ref(false);
const videoLoading = ref(false);
const videoMuted = ref(false);

let player = null;
let hls = null;  // 缓存 HLS 实例
let currentEffectIndex = 0;

const alistData = ref([])
const alistPath = ref([''])
const currentIsDir = ref(true) // 当前是否是文件夹 默认是文件夹
const alistUrl = ref("")
const alistSettingData = ref([])
const alistSettingShow = ref(false)
const alistCurrentPlayIndex = ref(0)

// 判断是否为 m3u8 格式
const isM3u8 = (url) => /\.m3u8(\?.*)?$/.test(url);
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
const loadHLS = (url) => {
    // 显示加载动画
    const showLoadingSpinner = () => {
        videoLoading.value = true;
    };

    // 隐藏加载动画
    const hideLoadingSpinner = () => {
        videoLoading.value = false;
        videoPlayStatus.value = true;
    };

    // 判断播放类型
    let type = '';
    if (url.includes('.mp4')) {
        type = 'video/mp4';
    } else if (url.includes('.mkv')) {
        type = 'video/webm';
    } else if (url.includes('.ts')) {
        type = 'video/mp2t';
    } else if (isM3u8(url)) {
        type = 'application/x-mpegURL';  // HLS/M3U8 类型
    }

    if (!player) {
        // 设置播放器选项
        const options = {
            liveui: true,
            html5: {
                hls: {
                    enableLowInitialPlaylist: true,
                    smoothQualityChange: true,
                },
            },
        };

        // 创建播放器
        player = videojs(videoPlayer.value, options);
        player.on('ended', () => {
            player.currentTime(0);
            player.play();
        });

        player.on("waiting", showLoadingSpinner);
        player.on("playing", hideLoadingSpinner);
        player.on("error", hideLoadingSpinner);
    }

    if (type === 'application/x-mpegURL' && Hls.isSupported()) {
        // HLS 播放
        if (!hls) {
            hls = new Hls();
            hls.attachMedia(videoPlayer.value);
            hls.on(Hls.Events.MANIFEST_LOADING, showLoadingSpinner);
            hls.on(Hls.Events.MANIFEST_PARSED, hideLoadingSpinner);
            hls.on(Hls.Events.ERROR, hideLoadingSpinner);
        }
        hls.loadSource(url);
    } else {
        // 非 HLS 类型播放
        if (hls) {
            hls.destroy();
            hls = null;
        }
        showLoadingSpinner();
        player.src({ type, src: url });
    }

    player.play();
    player.on("loadeddata", hideLoadingSpinner);
    player.on("loadedmetadata", hideLoadingSpinner);
};

const handleSwithcSource = async (url) => {
    if (channelCategory.value === 3) {
        modalShow.value = true
    } else {
        videoLoading.value = true;
        videoSrc.value = url;
        loadHLS(url);
        videoPlayStatus.value = true;
    }
};

// 视频播放和暂停
const handleSwitchVideoStatus = () => {
    if (player) {
        if (videoPlayer.value.paused) {
            videoPlayer.value.play();
            videoPlayStatus.value = true;
        } else {
            videoPlayer.value.pause();
            videoPlayStatus.value = false;
        }
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
    if (!player) return
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

    if (player) {
        if (player.isFullscreen()) {
            player.exitFullscreen();
        } else {
            player.requestFullscreen();

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
    if (player) {
        videoMuted.value = !videoMuted.value;
        player.muted(videoMuted.value);
    }
}

const channelCategory = ref(1)
const channelCategoryData = [
    {
        id: 1,
        name: "常用",
    },
    {
        id: 2,
        name: "电视直播",
    },
    {
        id: 3,
        name: "Alist",
    }
]

const handleSwithcChannelCategory = (id) => {
    tvStore.setTvCategory(id)
    channelCategory.value = id
    if (id === 3) {
        alistSettingShow.value = false
        currentIsDir.value = true
        alistPath.value = [""]
        tvStore.setAlistPath([""])
        let params = {
            page: 1,
            password: '',
            path: alistPath.value.join('/'),
            per_page: 0,
            refresh: false
        }
        getFsList(params)
    }
}
const getFsList = async (params) => {
    if (!alistUrl.value) return
    let res = await $fetch(`${alistUrl.value}/api/fs/list`, {
        method: 'POST',
        body: params
    })
    // console.log(res)
    if (res.code === 200) {
        alistData.value = res.data
        tvStore.setAlistData(res.data)
    } else {
        alistData.value.pop()
        tvStore.setAlistData(alistData.value)
    }
}
const getFsGet = async (params) => {
    if (!alistUrl.value) return
    let res = await $fetch(`${alistUrl.value}/api/fs/get`, {
        method: 'POST',
        body: params
    })

    if (res.code === 200) {
        let sign = res.data.sign;
        let alistPathTemp = []

        alistPath.value.forEach((item, index) => {
            alistPathTemp[index] = encodeURIComponent(item)
        })
        let temp_url = alistPathTemp.join('/') + '?sign=' + sign
        videoSrc.value = `${alistUrl.value}/d${temp_url}`
        loadHLS(`${alistUrl.value}/d${temp_url}`);
    } else {
        alistData.value.pop()
        tvStore.setAlistData(alistData.value)
    }
}

const handleClickAlist = (item, index) => {

    if (item.is_dir) {
        console.log('this is is dir')
        // 如果是文件夹
        if (currentIsDir.value) {
            alistPath.value.push(item.name)
        } else {
            alistPath.value.pop()
            alistPath.value.push(item.name)
        }
        currentIsDir.value = true
        // 在这里进行深拷贝
        const currentPath = [...alistPath.value]; // 或使用 JSON.parse(JSON.stringify(alistPath.value)) 进行深拷贝
        tvStore.setAlistPath(currentPath)
        tvStore.setAlistCurrentPlayIndex(0)
        getFsList({
            page: 1,
            password: "",
            path: alistPath.value.join('/'),
            per_page: 0,
            refresh: false
        })
    } else {
        // 如果是文件
        if (currentIsDir.value) {
            alistPath.value.push(item.name)
        } else {
            alistPath.value.pop()
            alistPath.value.push(item.name)
        }
        currentIsDir.value = false
        tvStore.setAlistCurrentPlayIndex(index)
        alistCurrentPlayIndex.value = index
        getFsGet({
            path: alistPath.value.join('/'),
            password: "",
        })
    }
}
const handleBackAlist = () => {
    alistPath.value.pop()
    currentIsDir.value = true
    // console.log(alistPath.value)
    // tvStore.setAlistPath(alistPath.value)
    getFsList({
        page: 1,
        password: "",
        path: alistPath.value.join('/'),
        per_page: 0,
        refresh: false
    })
}

const getAlists = async () => {
    try {
        let res = await $fetch("/api/alist/get", {
            method: "GET",
        })
        // console.log(res)
        alistSettingData.value = res.alists;
    } catch (e) {
        console.log(e)
    }
}
const handleAlistSetting = async () => {
    alistSettingShow.value = true
    tvStore.setAlistSettingShow(true)
    await getAlists()
}

const handleClickAlistUrl = (item) => {
    alistUrl.value = item.link;
    tvStore.setAlistUrl(item.link)
}

// 页面挂载和销毁
onMounted(() => {
    // 获取视频源
    getTvSources();
    getAlists();

    // 从store中获取数据
    if (tvStore.tvCategory) {
        channelCategory.value = tvStore.tvCategory
    }
    if (tvStore.alistUrl) {
        alistUrl.value = tvStore.alistUrl
    }
    if (tvStore.alistSettingShow) {
        alistSettingShow.value = tvStore.alistSettingShow
    }
    if (tvStore.alistData) {
        alistData.value = tvStore.alistData
    }
    if (tvStore.alistPath) {
        alistPath.value = tvStore.alistPath
    }
    if (tvStore.alistCurrentPlayIndex) {
        alistCurrentPlayIndex.value = tvStore.alistCurrentPlayIndex
    }

    if (channelCategory.value === 3) {

        let params = {
            page: 1,
            password: '',
            path: alistPath.value.join('/'),
            per_page: 0,
            refresh: false
        }
        getFsList(params)
    }
});

onBeforeUnmount(() => {
    if (hls) {
        hls.destroy();
        hls = null;  // 确保不再引用该实例
    }
    if (player) {
        player.dispose();
        player = null;
    }
});

</script>

<template>
    <div class="custom-bg dark:bg-slate-800 min-h-screen bg-no-repeat bg-cover bg-center relative">
        <div class="absolute top-0 left-0 right-0 bottom-0 bg-black/20 backdrop-blur-sm"></div>
        <div class="fixed bottom-10 left-10 right-10 top-10 rounded-xl max-w-screen-lg mx-auto flex items-center ">
            <div class="w-full rounded-t-xl dark:bg-slate-700">
                <div id="aipan-video-container"
                    class="relative w-full h-full bg-black rounded-t-md overflow-hidden px-6 pt-6 flex items-center justify-center aspect-video">
                    <video ref="videoPlayer" id="aipan-video"
                        class="video-js w-full h-full relative shadow-md border border-gray-900 rounded-md"></video>
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
            class="fixed bottom-0 top-0 left-0 p-5 w-full md:w-[520px] h-full bg-black overflow-y-scroll">
            <div class="flex flex-row items-center justify-center gap-2">
                <input class="border border-gray-300 px-4 py-2 rounded-md w-2/3" type="text" v-model="videoSrc"
                    placeholder="请输入视频链接">
                <button class="bg-red-500 text-white px-2 py-2 rounded-md text-xs hover:text-md" type="button"
                    @click="handleSwithcSource(videoSrc)">切换视频</button>
            </div>
            <div class="mt-5 flex flex-row gap-2">
                <div class="w-10 space-y-2">
                    <div>
                        <button class="bg-red-500 text-white px-2 py-1 rounded-md text-xs hover:text-md" type="button"
                            @click="modalShow = false">关闭</button>
                    </div>
                    <ul class="space-y-2">
                        <li class="text-sm font-semibold text-gray-600 border border-gray-700 p-2  rounded-md cursor-pointer hover:bg-gray-700 hover:text-white transition duration-300"
                            :class="{ 'bg-gray-700 text-white': channelCategory === category.id }"
                            style="writing-mode: vertical-rl;" v-for="(category, index) in channelCategoryData"
                            :key="index" @click="handleSwithcChannelCategory(category.id)">

                            {{ category.name }}
                        </li>
                    </ul>
                </div>
                <div class="w-full">
                    <div v-if="channelCategory === 1" class="space-y-2">
                        <div class="w-full text-sm font-semibold border border-gray-800 text-slate-600 dark:text-white dark:bg-slate-700 rounded-full p-2 cursor-pointer  hover:bg-black hover:text-white transition duration-300"
                            :class="{ 'bg-black text-white': item.url === videoSrc }"
                            v-for=" (item, index) in tvSources" :key="index" @click="handleSwithcSource(item.url)">
                            {{ item.name }}
                        </div>
                    </div>

                    <div v-if="channelCategory === 2">
                        <div class="flex flex-row flex-wrap items-center justify-center max-w-screen-lg mx-auto gap-4">
                            <div class="text-sm font-semibold border border-gray-700 text-slate-600 dark:text-white dark:bg-slate-700 rounded-md p-2 cursor-pointer  hover:bg-black hover:text-white transition duration-300"
                                :class="{ 'bg-black text-white': sourceIndex === index }"
                                v-for=" (item, index) in sourcesAipan" :key="index" @click="sourceIndex = index">
                                {{ item.label }}
                            </div>
                        </div>

                        <div class=" space-y-2 mt-5">
                            <div class="text-sm font-semibold border border-gray-700 text-slate-600 dark:text-white dark:bg-slate-700 rounded-full p-2 cursor-pointer  hover:bg-black hover:text-white transition duration-300"
                                :class="{ 'bg-black text-white': item.url === videoSrc }"
                                v-for=" (item, index) in sourcesAipan[sourceIndex]['sources']" :key="index"
                                @click="handleSwithcSource(item.url)">
                                {{ item.name }}
                            </div>
                        </div>
                    </div>
                    <div class="space-y-2" v-if="channelCategory === 3">
                        <div class="space-x-2">
                            <button class="border-gray-800 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                                type="button" @click="handleBackAlist()">
                                返回上级
                            </button>
                            <button class="border border-gray-800 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                                type="button" @click="() => {
                                    handleSwithcChannelCategory(3)
                                    alistSettingShow = false
                                    tvStore.setAlistSettingShow(false)
                                }">
                                主页
                            </button>
                            <button class="border border-gray-800 text-white px-2 py-1 rounded-md text-xs hover:text-md"
                                :class="alistSettingShow ? 'bg-red-500' : ''" type="button"
                                @click="handleAlistSetting()">
                                设置
                            </button>
                        </div>
                        <div class="space-y-2" v-if="alistSettingShow">
                            <div class="text-gray-600 p-2 text-xs border border-gray-700 rounded-md cursor-pointer transition duration-300 break-words"
                                :class="alistUrl === item.link ? 'bg-gray-400 text-gray-900 ' : 'hover:bg-gray-200'"
                                v-for=" (item, index) in alistSettingData" :key="index"
                                @click="handleClickAlistUrl(item)">
                                {{ item.name }} {{ item.link }}
                            </div>
                        </div>
                        <div class="space-y-2" v-else>
                            <div class="text-gray-600 p-2 text-xs border border-gray-700 rounded-md cursor-pointer transition duration-300 break-words"
                                :class="item.is_dir ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-600' : alistCurrentPlayIndex === index ? 'bg-gray-400 text-gray-900 ' : 'hover:bg-gray-200'"
                                v-for=" (item, index) in alistData?.content" :key="index"
                                @click="handleClickAlist(item, index)">
                                {{ item.name }} - {{ item.is_dir ? '文件夹' : '文件' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>
<style scoped>
.custom-bg {
    background-image: linear-gradient(135deg, #FFCF71 10%, #2376DD 100%);
}

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