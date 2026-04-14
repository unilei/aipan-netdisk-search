<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

useSeoMeta({
  title: 'AIPAN免费盒子 - VIP视频解析播放器',
  description: 'AIPAN免费盒子提供免费的VIP视频解析服务，支持爱奇艺、腾讯视频、优酷、芒果TV、哔哩哔哩等主流视频平台。',
  keywords: 'VIP视频解析,免费视频解析,爱奇艺解析,腾讯视频解析,优酷解析,AIPAN免费盒子',
})

definePageMeta({ layout: 'default' })

// ── 解析接口 ──────────────────────────────
const parseInterfaces = [
  { url: 'https://im1907.top/?jx=',          name: 'M1907',    tag: '推荐', color: 'emerald' },
  { url: 'https://jx.xmflv.com/?url=',       name: '虾米',      tag: '稳定', color: 'blue'    },
  { url: 'https://jx.xymp4.cc/?url=',        name: '咸鱼',      tag: '快速', color: 'amber'   },
  { url: 'https://jx.2s0cn/player/?url=',    name: '极速',      tag: '高清', color: 'violet'  },
  { url: 'https://jx.playerjy.com/?url=',    name: 'PlayerJY', tag: '备用', color: 'slate'   },
]

const tagColor = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  blue:    'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  violet:  'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  slate:   'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
}

// ── 支持的平台 ────────────────────────────
const platforms = [
  { name: '爱奇艺', icon: 'fas fa-play-circle', color: '#00BE06' },
  { name: '腾讯视频', icon: 'fab fa-qq',         color: '#FF6A00' },
  { name: '优酷',   icon: 'fas fa-film',         color: '#1C8DFF' },
  { name: '芒果TV', icon: 'fas fa-tv',            color: '#FFD100' },
  { name: '哔哩哔哩', icon: 'fas fa-play',       color: '#FB7299' },
]

// ── 响应式状态 ────────────────────────────
const selectedUrl = ref('')
const videoUrl    = ref('')
const iframeUrl   = ref('')
const isLoading   = ref(false)
const isFullscreen = ref(false)
const showHistory = ref(false)
const playHistory = ref([])

const currentInterface = computed(() =>
  parseInterfaces.find(p => p.url === selectedUrl.value) ?? parseInterfaces[0]
)

const isValidUrl = computed(() => {
  if (!videoUrl.value) return null
  try { new URL(videoUrl.value); return true } catch { return false }
})

// ── 初始化 ────────────────────────────────
onMounted(() => {
  selectedUrl.value = localStorage.getItem('jxjiekou') || parseInterfaces[0].url
  videoUrl.value    = localStorage.getItem('jxurl')    || ''
  try { playHistory.value = JSON.parse(localStorage.getItem('playHistory') || '[]') } catch {}

  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

// ── 播放 ──────────────────────────────────
const playVideo = async () => {
  if (!videoUrl.value)          { ElMessage.warning('请输入视频地址'); return }
  if (!isValidUrl.value)        { ElMessage.error('请输入有效的视频链接'); return }

  isLoading.value = true
  addToHistory(videoUrl.value)
  iframeUrl.value = selectedUrl.value + videoUrl.value
  localStorage.setItem('jxjiekou', selectedUrl.value)
  localStorage.setItem('jxurl', videoUrl.value)

  await nextTick()
  document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  ElNotification({ title: '解析中', message: `使用 ${currentInterface.value.name} 接口`, type: 'success', duration: 2500 })
  isLoading.value = false
}

const openNew = () => {
  if (!videoUrl.value || !isValidUrl.value) { ElMessage.warning('请输入有效的视频链接'); return }
  addToHistory(videoUrl.value)
  localStorage.setItem('jxjiekou', selectedUrl.value)
  localStorage.setItem('jxurl', videoUrl.value)
  window.open(selectedUrl.value + videoUrl.value)
}

const switchInterface = (dir) => {
  const idx  = parseInterfaces.findIndex(p => p.url === selectedUrl.value)
  const next = (idx + (dir === 'next' ? 1 : -1) + parseInterfaces.length) % parseInterfaces.length
  selectedUrl.value = parseInterfaces[next].url
  if (iframeUrl.value) iframeUrl.value = selectedUrl.value + videoUrl.value
}

// ── 历史记录 ──────────────────────────────
const platformName = (url) => {
  try {
    const h = new URL(url).hostname
    if (h.includes('iqiyi'))    return '爱奇艺'
    if (h.includes('qq.com'))   return '腾讯视频'
    if (h.includes('youku'))    return '优酷'
    if (h.includes('mgtv'))     return '芒果TV'
    if (h.includes('bilibili')) return '哔哩哔哩'
    return '视频'
  } catch { return '视频' }
}

const addToHistory = (url) => {
  playHistory.value = [
    { url, name: platformName(url), iface: currentInterface.value.name, ts: Date.now() },
    ...playHistory.value.filter(h => h.url !== url)
  ].slice(0, 10)
  localStorage.setItem('playHistory', JSON.stringify(playHistory.value))
}

const playFromHistory = (item) => {
  videoUrl.value = item.url
  const iface = parseInterfaces.find(p => p.name === item.iface)
  if (iface) selectedUrl.value = iface.url
  showHistory.value = false
  playVideo()
}

const clearHistory = () => {
  playHistory.value = []
  localStorage.removeItem('playHistory')
  ElMessage.success('历史已清空')
}

// ── 工具函数 ──────────────────────────────
const paste = async () => {
  try {
    const t = await navigator.clipboard.readText()
    if (t?.startsWith('http')) { videoUrl.value = t; ElMessage.success('已粘贴') }
    else ElMessage.warning('剪贴板中没有有效链接')
  } catch { ElMessage.error('无法访问剪贴板，请手动粘贴') }
}

const toggleFullscreen = () => {
  const el = document.getElementById('player-section')
  if (!el) return
  isFullscreen.value ? document.exitFullscreen?.() : el.requestFullscreen?.()
}

const formatTime = (ts) => new Date(ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 transition-colors duration-300">

    <!-- ── Hero Header ─────────────────────────── -->
    <div class="pt-8 pb-6 px-4 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
        免费 · 无广告 · 支持全网平台
      </div>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
        免费盒子
        <span class="bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400 bg-clip-text text-transparent">VIP解析</span>
      </h1>
      <p class="text-gray-500 dark:text-slate-400 text-sm">粘贴视频链接，一键解析播放</p>

      <!-- Platform badges -->
      <div class="flex items-center justify-center flex-wrap gap-2 mt-4">
        <span v-for="p in platforms" :key="p.name"
          class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-white/6 border border-gray-200/80 dark:border-white/8 text-gray-600 dark:text-slate-300 shadow-sm">
          <i :class="p.icon" class="text-[10px]"></i>
          {{ p.name }}
        </span>
      </div>
    </div>

    <main class="max-w-3xl mx-auto px-4 pb-16 space-y-4">

      <!-- ── 解析卡片 ───────────────────────────── -->
      <div class="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-white/6 shadow-lg overflow-hidden">

        <!-- 接口选择 -->
        <div class="p-4 border-b border-gray-100 dark:border-white/5">
          <p class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">选择解析接口</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="p in parseInterfaces" :key="p.url"
              @click="selectedUrl = p.url"
              class="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border cursor-pointer transition-all duration-150"
              :class="selectedUrl === p.url
                ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white border-transparent shadow-md shadow-blue-500/20'
                : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/8 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-800 dark:hover:text-slate-200'">
              {{ p.name }}
              <span class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                :class="selectedUrl === p.url ? 'bg-white/20 text-white' : tagColor[p.color]">
                {{ p.tag }}
              </span>
            </button>
          </div>
        </div>

        <!-- URL 输入 -->
        <div class="p-4">
          <div class="flex items-center gap-2 mb-2">
            <p class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex-1">视频链接</p>
            <button @click="paste"
              class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/25 transition-all cursor-pointer">
              <i class="fas fa-paste text-[10px]"></i> 粘贴
            </button>
            <button @click="showHistory = !showHistory"
              class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/6 border border-gray-200 dark:border-white/8 text-gray-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:border-violet-200 dark:hover:border-violet-500/25 transition-all cursor-pointer"
              :class="showHistory ? 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/25 text-violet-600 dark:text-violet-400' : ''">
              <i class="fas fa-history text-[10px]"></i> 历史 {{ playHistory.length ? `(${playHistory.length})` : '' }}
            </button>
          </div>

          <!-- Input -->
          <div class="relative">
            <input v-model="videoUrl" type="url"
              placeholder="https://v.youku.com/... 或 https://www.iqiyi.com/..."
              @keydown.enter="playVideo"
              class="w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none transition-all bg-gray-50 dark:bg-white/5 border text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-slate-500"
              :class="isValidUrl === false
                ? 'border-red-300 dark:border-red-500/40 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
                : 'border-gray-200 dark:border-white/8 focus:border-blue-300 dark:focus:border-blue-500/40 focus:shadow-[0_0_0_3px_rgba(147,197,253,0.2)] dark:focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] focus:bg-white dark:focus:bg-white/8'" />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <i v-if="isValidUrl === true"  class="fas fa-check-circle text-emerald-500 text-sm"></i>
              <i v-if="isValidUrl === false" class="fas fa-exclamation-circle text-red-400 text-sm"></i>
              <button v-if="videoUrl" @click="videoUrl = ''; iframeUrl = ''"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors cursor-pointer">
                <i class="fas fa-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- History dropdown -->
          <Transition name="slide-down">
            <div v-if="showHistory && playHistory.length"
              class="mt-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/8 shadow-xl overflow-hidden">
              <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-white/5">
                <span class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">播放历史</span>
                <button @click="clearHistory" class="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors">清空</button>
              </div>
              <div class="max-h-56 overflow-y-auto">
                <button v-for="item in playHistory" :key="item.url"
                  @click="playFromHistory(item)"
                  class="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer text-left border-b border-gray-50 dark:border-white/3 last:border-0">
                  <i class="fas fa-play text-blue-400 text-xs flex-shrink-0"></i>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{{ item.name }}</p>
                    <p class="text-xs text-gray-400 dark:text-slate-500 truncate">{{ item.url }}</p>
                  </div>
                  <span class="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0">{{ formatTime(item.ts) }}</span>
                </button>
              </div>
            </div>
          </Transition>

          <!-- Action buttons -->
          <div class="flex gap-2 mt-3">
            <button @click="playVideo" :disabled="isLoading || !videoUrl"
              class="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-px active:scale-[.98]"
              style="background: linear-gradient(135deg, #2563eb, #4f46e5); box-shadow: 0 4px 14px rgba(37,99,235,.3)">
              <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-play text-xs"></i>
              {{ isLoading ? '解析中...' : '立即播放' }}
            </button>
            <button @click="openNew" :disabled="!videoUrl"
              class="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 cursor-pointer transition-all duration-200 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 hover:-translate-y-px active:scale-[.98] disabled:opacity-40 disabled:cursor-not-allowed">
              <i class="fas fa-external-link-alt text-xs"></i>
              新窗口
            </button>
          </div>
        </div>
      </div>

      <!-- ── 播放器 ───────────────────────────── -->
      <Transition name="fade-up">
        <div v-if="iframeUrl" id="player-section"
          class="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-white/6 shadow-lg overflow-hidden">
          <!-- Player toolbar -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] animate-pulse"></span>
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">正在播放</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 font-medium">
                {{ currentInterface.name }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button @click="switchInterface('prev')" title="上一个接口"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer">
                <i class="fas fa-step-backward text-xs"></i>
              </button>
              <button @click="switchInterface('next')" title="下一个接口"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer">
                <i class="fas fa-step-forward text-xs"></i>
              </button>
              <button @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer">
                <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'" class="text-xs"></i>
              </button>
            </div>
          </div>

          <!-- iframe -->
          <div class="relative bg-black" style="aspect-ratio:16/9">
            <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <div class="text-center text-white">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p class="text-sm text-slate-400">解析中...</p>
              </div>
            </div>
            <iframe :src="iframeUrl" class="w-full h-full" frameborder="0"
              allowfullscreen webkitallowfullscreen mozallowfullscreen
              @load="isLoading = false"></iframe>
          </div>

          <!-- Hint -->
          <p class="text-center text-xs text-gray-400 dark:text-slate-500 py-3">
            <i class="fas fa-lightbulb mr-1 text-amber-400"></i>
            播放失败？点击上方接口按钮切换到其他解析源
          </p>
        </div>
      </Transition>

      <!-- ── 温馨提示 ──────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/60 dark:bg-white/4 border border-gray-200/60 dark:border-white/5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <i class="fas fa-random text-sm"></i>
          </div>
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">多接口切换</p>
          <p class="text-xs text-gray-500 dark:text-slate-500">一键切换备用接口</p>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/60 dark:bg-white/4 border border-gray-200/60 dark:border-white/5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <i class="fas fa-history text-sm"></i>
          </div>
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">播放历史</p>
          <p class="text-xs text-gray-500 dark:text-slate-500">最近10条自动保存</p>
        </div>
        <div class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/60 dark:bg-white/4 border border-gray-200/60 dark:border-white/5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <i class="fas fa-expand text-sm"></i>
          </div>
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">全屏播放</p>
          <p class="text-xs text-gray-500 dark:text-slate-500">沉浸式观看体验</p>
        </div>
      </div>

      <!-- ── 免责声明 ──────────────────────────── -->
      <p class="text-center text-xs text-gray-400 dark:text-slate-600 pb-2">
        <i class="fas fa-shield-alt mr-1"></i>
        本服务仅供学习交流使用，所有内容版权归原平台所有，请支持正版
      </p>

    </main>
  </div>
</template>

<style scoped>
#player-section:fullscreen {
  background: #000;
  padding: 0;
}
#player-section:fullscreen [style*="aspect-ratio"] {
  height: 100vh;
  aspect-ratio: unset;
  border-radius: 0;
}

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-up-enter-active, .fade-up-leave-active {
  transition: all 0.3s ease;
}
.fade-up-enter-from, .fade-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
</style>
