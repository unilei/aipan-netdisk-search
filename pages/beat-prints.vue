<template>
  <div class="min-h-screen bg-[#fafafa]">
    <div class="max-w-5xl mx-auto px-4 py-12 sm:py-20">
      <!-- Header Section -->
      <div class="text-center mb-12">
        <h1 class="text-2xl sm:text-3xl font-medium text-gray-800 mb-3">将你喜爱的音乐转化为精美的视觉艺术</h1>
      </div>

      <!-- Search Bar -->
      <div class="max-w-2xl mx-auto mb-16">
        <div class="relative">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索歌曲或艺术家..."
            @keyup.enter="searchTracks"
            class="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-gray-200
                   text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400
                   transition-colors duration-300"
            :disabled="isLoading"
          />
          <span class="absolute left-4 top-1/2 -translate-y-1/2">
            <span v-if="!isLoading" class="i-carbon-search text-lg text-gray-400" />
            <span v-else class="i-carbon-circle-dash animate-spin text-lg text-gray-400" />
          </span>
        </div>
        
        <!-- Error Message -->
        <p v-if="error" class="mt-4 text-red-500 text-center text-sm">
          {{ error }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-20">
        <span class="i-carbon-circle-dash animate-spin text-4xl text-gray-400 mb-4" />
        <p class="text-gray-500">正在搜索音乐...</p>
      </div>

      <!-- Results Section -->
      <div v-else>
        <!-- Results Count -->
        <p v-if="tracks.length" class="text-gray-500 mb-6 text-sm">
          找到 {{ tracks.length }} 首歌曲
        </p>
        
        <!-- Results Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="track in tracks" :key="track.id" 
               class="group bg-white rounded-lg border border-gray-100 overflow-hidden hover:border-gray-200 
                      transition-all duration-300">
            <div class="p-4">
              <div class="relative mb-3">
                <img :src="track.albumArt" :alt="track.name" 
                     class="w-full aspect-square object-cover rounded-lg">
                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                            transition-opacity duration-300 rounded-lg flex items-center justify-center">
                  <button 
                    @click="generatePoster(track)" 
                    class="px-4 py-2 bg-white text-gray-900 rounded-full text-sm
                           hover:bg-gray-50 transition-colors duration-300"
                  >
                    生成海报
                  </button>
                </div>
              </div>
              <div>
                <h3 class="font-medium text-gray-800 mb-1 truncate">{{ track.name }}</h3>
                <p class="text-gray-500 text-sm truncate">{{ track.artist }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- No Results State -->
        <div v-if="!isLoading && tracks.length === 0" class="text-center py-20">
          <span class="i-carbon-music-add text-5xl text-gray-300 mb-4 block"></span>
          <p class="text-gray-400">开始搜索你喜爱的音乐</p>
        </div>
      </div>

      <!-- Modal -->
      <div v-if="showModal" 
           class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
           @click="showModal = false">
        <div class="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto" @click.stop>
          <!-- Modal Header -->
          <div class="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
            <h2 class="text-lg font-medium text-gray-800">创建你的海报</h2>
            <button @click="showModal = false" 
                    class="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <span class="i-carbon-close text-xl text-gray-500" />
            </button>
          </div>

          <div class="p-6">
            <!-- Options -->
            <div class="mb-6 space-y-4">
              <!-- Template Selection -->
              <div>
                <label class="block text-sm text-gray-700 mb-2">选择样式</label>
                <div class="flex gap-3 flex-wrap">
                  <button
                    v-for="template in templates"
                    :key="template.id"
                    @click="selectedTemplate = template.id"
                    :class="[
                      'px-4 py-2 rounded-full text-sm transition-colors duration-300',
                      selectedTemplate === template.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    ]"
                    :disabled="isGenerating"
                  >
                    {{ template.name }}
                  </button>
                </div>
              </div>

              <!-- Lyrics Mode Toggle -->
              <div class="flex items-center justify-between">
                <label class="block text-sm text-gray-700">歌词显示</label>
                <div class="flex gap-3">
                  <button
                    @click="fullLyrics = false"
                    :class="[
                      'px-4 py-2 rounded-full text-sm transition-colors duration-300',
                      !fullLyrics
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    ]"
                    :disabled="isGenerating"
                  >
                    预览
                  </button>
                  <button
                    @click="fullLyrics = true"
                    :class="[
                      'px-4 py-2 rounded-full text-sm transition-colors duration-300',
                      fullLyrics
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    ]"
                    :disabled="isGenerating"
                  >
                    完整歌词
                  </button>
                </div>
              </div>
            </div>

            <!-- Generated Poster -->
            <div class="flex gap-6 w-full">
              <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                <div v-if="isGenerating" class="py-8 text-center">
                  <span class="i-carbon-circle-dash animate-spin text-3xl mb-3 block text-gray-400" />
                  <p class="text-gray-500">正在创建你的艺术作品...</p>
                </div>
                <img 
                  v-else-if="generatedPosterUrl" 
                  :src="generatedPosterUrl" 
                  :alt="selectedTrack?.name"
                  class="max-w-full w-auto object-contain rounded-lg"
                >
              </div>

              <!-- Full Lyrics Posters -->
              <div v-if="fullLyrics" class="bg-gray-50 rounded-lg p-4 flex flex-row gap-4">
                <div v-if="isGenerating" class="py-8 text-center">
                  <span class="i-carbon-circle-dash animate-spin text-3xl mb-3 block text-gray-400" />
                  <p class="text-gray-500">正在创建你的艺术作品...</p>
                </div>
                <template v-else>
                  <div v-for="(posterUrl, index) in fullLyricsPosterUrls" :key="index" 
                       class="relative group">
                    <img 
                      :src="posterUrl" 
                      :alt="`${selectedTrack?.name} 歌词海报 ${index + 1}`"
                      class="max-w-full w-auto object-contain rounded-lg"
                    >
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        @click="downloadFullLyricsPoster(index)"
                        class="px-4 py-2 bg-gray-900 text-white rounded-full text-sm
                               hover:bg-gray-800 transition-colors duration-300
                               flex items-center gap-2"
                      >
                        <span class="i-carbon-download text-lg" />
                        下载第 {{ index + 1 }} 页
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end mt-6 gap-3">
              <button 
                v-if="fullLyrics && fullLyricsPosterUrls.length > 0"
                @click="downloadAllLyricPosters" 
                class="px-6 py-2 bg-gray-100 text-gray-800 rounded-full text-sm
                       hover:bg-gray-200 transition-colors duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                :disabled="isGenerating"
              >
                <span class="i-carbon-download text-lg" />
                下载全部歌词海报 ({{ fullLyricsPosterUrls.length }}页)
              </button>
              <button 
                @click="downloadPoster" 
                class="px-6 py-2 bg-gray-900 text-white rounded-full text-sm
                       hover:bg-gray-800 transition-colors duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                :disabled="isGenerating || !generatedPosterUrl"
              >
                <span class="i-carbon-download text-lg" />
                下载预览海报
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import netEaseService from '~/services/netease'
import posterService from '~/services/poster'
import lyricsService from '~/services/lyrics'

const searchQuery = ref('')
const tracks = ref([])
const showModal = ref(false)
const selectedTrack = ref(null)
const isLoading = ref(false)
const error = ref(null)
const selectedTemplate = ref('qinghuaci')
const generatedPosterUrl = ref(null)
const fullLyricsPosterUrls = ref([])
const templates = ref([])
const isGenerating = ref(false)
const fullLyrics = ref(true)

onMounted(() => {
  templates.value = posterService.getTemplates()
})

const searchTracks = async () => {
  if (!searchQuery.value.trim()) return
  
  try {
    isLoading.value = true
    error.value = null
    tracks.value = await netEaseService.searchTracks(searchQuery.value)
  } catch (err) {
    console.error('Search failed:', err)
    error.value = '搜索失败，请重试。'
    tracks.value = []
  } finally {
    isLoading.value = false
  }
}

const generatePoster = async (track) => {
  selectedTrack.value = track
  showModal.value = true
  await regeneratePoster()
}

const regeneratePoster = async () => {
  if (!selectedTrack.value) return
  
  try {
    isGenerating.value = true
    // 生成预览海报
    const previewCanvas = await posterService.generatePoster(selectedTrack.value, selectedTemplate.value, {
      fullLyrics: false
    })
    generatedPosterUrl.value = previewCanvas.toDataURL('image/png')

    // 如果是完整歌词模式，生成多个歌词海报
    if (fullLyrics.value) {
      fullLyricsPosterUrls.value = []
      const lyrics = await lyricsService.getLyrics(selectedTrack.value)
      const lyricsPages = lyricsService.getPreviewLyrics(lyrics, 150, true)
      
      // 处理单页和多页情况
      if (Array.isArray(lyricsPages)) {
        // 多页情况：为每一页歌词生成海报
        for (const pageLyrics of lyricsPages) {
          const trackWithPageLyrics = {
            ...selectedTrack.value,
            lyrics: pageLyrics
          }
          const lyricsCanvas = await posterService.generatePoster(trackWithPageLyrics, selectedTemplate.value, {
            fullLyrics: true
          })
          fullLyricsPosterUrls.value.push(lyricsCanvas.toDataURL('image/png'))
        }
      } else {
        // 单页情况：只生成一个海报
        const trackWithLyrics = {
          ...selectedTrack.value,
          lyrics: lyricsPages
        }
        const lyricsCanvas = await posterService.generatePoster(trackWithLyrics, selectedTemplate.value, {
          fullLyrics: true
        })
        fullLyricsPosterUrls.value.push(lyricsCanvas.toDataURL('image/png'))
      }
    } else {
      fullLyricsPosterUrls.value = []
    }
  } catch (err) {
    console.error('Failed to generate poster:', err)
    error.value = '生成海报失败，请重试。'
  } finally {
    isGenerating.value = false
  }
}

const downloadPoster = () => {
  if (!generatedPosterUrl.value) return
  
  const link = document.createElement('a')
  link.download = `${selectedTrack.value.name}-preview-poster.png`
  link.href = generatedPosterUrl.value
  link.click()
}

const downloadFullLyricsPoster = (index) => {
  if (!fullLyricsPosterUrls.value[index]) return
  
  const link = document.createElement('a')
  link.download = `${selectedTrack.value.name}-lyrics-poster-${index + 1}.png`
  link.href = fullLyricsPosterUrls.value[index]
  link.click()
}

const downloadAllLyricPosters = () => {
  if (!fullLyricsPosterUrls.value.length) return
  
  // 创建一个延时函数
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
  
  // 依次下载所有海报
  fullLyricsPosterUrls.value.forEach(async (url, index) => {
    // 添加小延时避免浏览器阻止多个下载
    await delay(index * 500)
    const link = document.createElement('a')
    link.download = `${selectedTrack.value.name}-lyrics-poster-${index + 1}.png`
    link.href = url
    link.click()
  })
}

// 监听模板和歌词模式变化
watch([selectedTemplate, fullLyrics], regeneratePoster)
</script>
