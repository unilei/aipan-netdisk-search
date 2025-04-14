<template>
  <div class="max-w-6xl mx-auto p-4 space-y-6">
    <!-- 错误消息 -->
    <div
      v-if="errorMessage"
      class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
      role="alert"
    >
      <p>{{ errorMessage }}</p>
    </div>

    <!-- 视频容器 -->
    <div class="bg-gray-900 aspect-video rounded-lg overflow-hidden flex items-center justify-center">
      <!-- 主视频区域 -->
      <div v-if="isHost" class="w-full h-full relative">
        <!-- 房主共享中 -->
        <template v-if="isSharing">
          <video
            ref="hostVideoElement"
            class="w-full h-full bg-black"
            autoplay
            playsinline
            muted
          ></video>
          <div class="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              @click="stopScreenShare"
              class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
            >
              停止共享
            </button>
          </div>
        </template>
        
        <!-- 房主未共享 -->
        <div v-else class="flex flex-col items-center justify-center h-full text-white">
          <p class="text-xl mb-4">开始共享你的屏幕</p>
          <button
            @click="startScreenShare"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            开始共享
          </button>
        </div>
      </div>
      
      <!-- 观众视图 -->
      <div v-else class="w-full h-full relative">
        <video
          v-if="remoteStream"
          ref="videoElement"
          class="w-full h-full bg-black"
          autoplay
          playsinline
        ></video>
        <div v-else class="flex flex-col items-center justify-center h-full text-white">
          <p class="text-xl">等待房主开始屏幕共享...</p>
        </div>
      </div>
    </div>

    <!-- 房间信息卡片 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 class="text-xl font-bold mb-4 text-gray-800 dark:text-white">
        房间信息
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p class="text-gray-600 dark:text-gray-300 mb-2">
            房间名: {{ currentRoom.name || "未命名房间" }}
          </p>
          <p class="text-gray-600 dark:text-gray-300 mb-2">
            角色: {{ isHost ? "主持人" : "观众" }}
          </p>
          <p class="text-gray-600 dark:text-gray-300 mb-2">
            观看人数: {{ viewerCount }}
          </p>
        </div>

        <!-- 房间链接 -->
        <div v-if="currentRoom.id" class="flex flex-col md:items-end">
          <div class="flex items-center mb-2 md:justify-end">
            <span class="text-gray-600 dark:text-gray-300 mr-2">房间链接:</span>
            <div class="relative flex-1 md:max-w-xs">
              <input
                type="text"
                :value="roomLink"
                readonly
                class="w-full pr-12 pl-3 py-2 border rounded-lg text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 focus:outline-none"
              />
              <button
                @click="copyLink"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700 transition duration-200"
              >
                <span v-if="linkCopied" class="text-green-500">已复制!</span>
                <span v-else>复制</span>
              </button>
            </div>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            分享此链接给他人以加入您的屏幕共享
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useScreenSharing } from "~/composables/useScreenSharing";

const route = useRoute();
const router = useRouter();
const videoElement = ref(null);
const hostVideoElement = ref(null);
const linkCopied = ref(false);

const {
  createRoom,
  joinRoom,
  startScreenShare,
  stopScreenShare,
  currentRoom,
  isHost,
  isSharing,
  remoteStream,
  screenStream,
  errorMessage,
  isSocketConnected,
} = useScreenSharing();

// 计算房间分享链接
const roomLink = computed(() => {
  if (!currentRoom.id) return "";
  return `${window.location.origin}/screen/${currentRoom.id}`;
});

// 计算观看人数
const viewerCount = computed(() => {
  return currentRoom.viewers?.length || 0;
});

// 复制分享链接
const copyLink = () => {
  navigator.clipboard.writeText(roomLink.value);
  linkCopied.value = true;
  setTimeout(() => {
    linkCopied.value = false;
  }, 3000);
};

// 监听远程流变化，并设置到视频元素
watch(remoteStream, (newStream) => {
  if (newStream && videoElement.value) {
    videoElement.value.srcObject = newStream;
  }
});

// 监听屏幕流变化，并设置到房主视频元素
watch(screenStream, (newStream) => {
  nextTick(() => {
    if (newStream && hostVideoElement.value) {
      hostVideoElement.value.srcObject = newStream;
      hostVideoElement.value.play().catch(err => {
        console.error('视频播放失败:', err);
      });
    }
  });
});

onMounted(async () => {
  // 如果URL中有房间ID，则加入房间
  const roomId = route.params.roomId;
  if (roomId) {
    try {
      await joinRoom(roomId);
    } catch (error) {
      console.error("加入房间失败", error);
      // 失败时返回首页
      setTimeout(() => {
        router.push("/screen");
      }, 3000);
    }
  } else {
    // 如果没有房间ID，则创建新房间
    try {
      const roomName = `${
        localStorage.getItem("username") || "用户"
      }的屏幕共享`;
      await createRoom(roomName);
    } catch (error) {
      console.error("创建房间失败", error);
    }
  }
  
  // 确保DOM更新后设置视频元素
  nextTick(() => {
    setVideoSources();
  });
});

function setVideoSources() {
  // 设置观众视频
  if (!isHost.value && remoteStream.value && videoElement.value) {
    videoElement.value.srcObject = remoteStream.value;
    
    console.log('已设置远程流到观众视频元素');
    
    // 尝试播放视频
    videoElement.value.play().catch(err => {
      console.error('观众视频播放失败:', err);
    });
  }
  
  // 设置房主视频
  if (isHost.value && screenStream.value && hostVideoElement.value) {
    hostVideoElement.value.srcObject = screenStream.value;
    
    console.log('已设置屏幕流到房主视频元素');
    
    // 尝试播放视频
    hostVideoElement.value.play().catch(err => {
      console.error('房主视频播放失败:', err);
    });
  }
}

watch(screenStream, () => {
  nextTick(() => {
    setVideoSources();
  });
});

watch(remoteStream, () => {
  nextTick(() => {
    setVideoSources();
  });
});
</script>
