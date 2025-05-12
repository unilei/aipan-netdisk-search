<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-over']);

// Game state
const score = ref(0);
const gameActive = ref(false);
const gameTime = ref(30); // 30 seconds game
const timer = ref(null);
const interval = ref(null);
const holes = ref(Array(9).fill(false));
const cooldown = ref(false);

// Initialize game
const initGame = () => {
  score.value = 0;
  gameTime.value = 30;
  holes.value = Array(9).fill(false);
  gameActive.value = true;
  cooldown.value = false;
  
  // Start game timer
  timer.value = setInterval(() => {
    gameTime.value--;
    
    if (gameTime.value <= 0) {
      endGame();
    }
  }, 1000);
  
  // Start showing moles
  showRandomMole();
};

// Show random mole
const showRandomMole = () => {
  if (!gameActive.value) return;
  
  // Hide all moles
  holes.value = Array(9).fill(false);
  
  // Show a random mole
  const randomHole = Math.floor(Math.random() * 9);
  holes.value[randomHole] = true;
  
  // Set timeout for next mole
  const timeout = Math.max(400, 1000 - score.value * 10); // Gets faster as score increases
  interval.value = setTimeout(showRandomMole, timeout);
};

// Whack mole
const whackMole = (index) => {
  if (!gameActive.value || cooldown.value) return;
  
  if (holes.value[index]) {
    // Hit!
    score.value++;
    holes.value[index] = false;
    
    // Prevent multiple rapid clicks
    cooldown.value = true;
    setTimeout(() => {
      cooldown.value = false;
    }, 100);
  }
};

// End game
const endGame = () => {
  gameActive.value = false;
  clearInterval(timer.value);
  clearTimeout(interval.value);
  emit('game-over', { score: score.value });
};

// Restart game
const restartGame = () => {
  endGame();
  initGame();
};

// Watch for active state changes
watch(() => props.active, (isActive) => {
  if (isActive) {
    initGame();
  } else {
    endGame();
  }
});

// Clean up on unmount
onBeforeUnmount(() => {
  clearInterval(timer.value);
  clearTimeout(interval.value);
});

// Expose methods to parent
defineExpose({
  restartGame
});
</script>

<template>
  <div class="whackamole-game">
    <div class="flex justify-between items-center mb-4">
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">得分:</span> {{ score }}
      </div>
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">剩余时间:</span> {{ gameTime }}s
      </div>
      <button 
        @click="restartGame" 
        class="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        <i class="fa-solid fa-rotate mr-1"></i>
        重新开始
      </button>
    </div>

    <!-- Game Over Message -->
    <div v-if="!gameActive && gameTime <= 0" class="text-center py-4 mb-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
      <h3 class="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">
        <i class="fa-solid fa-flag-checkered mr-2"></i>
        游戏结束
      </h3>
      <p class="text-blue-600 dark:text-blue-400">
        你的最终得分是 {{ score }}
      </p>
    </div>

    <!-- Mole Grid -->
    <div class="grid grid-cols-3 gap-4 max-w-sm mx-auto">
      <div 
        v-for="(active, index) in holes" 
        :key="index"
        @click="whackMole(index)"
        class="aspect-square rounded-full overflow-hidden relative cursor-pointer transition-all"
      >
        <!-- Hole -->
        <div class="absolute inset-0 bg-gradient-to-b from-amber-800 to-amber-950 rounded-full"></div>
        
        <!-- Mole -->
        <div 
          v-if="active"
          class="absolute bottom-0 left-0 right-0 transition-all duration-200 transform"
          :class="{ 'translate-y-0': active, 'translate-y-full': !active }"
        >
          <div class="bg-gray-700 dark:bg-gray-800 rounded-full w-3/4 h-3/4 mx-auto flex items-center justify-center overflow-hidden">
            <div class="text-3xl">🐹</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.whackamole-game {
  width: 100%;
}

@keyframes moleAppear {
  0% { transform: translateY(100%); }
  100% { transform: translateY(0); }
}

@keyframes moleDisappear {
  0% { transform: translateY(0); }
  100% { transform: translateY(100%); }
}
</style>
