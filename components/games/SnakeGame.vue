<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-over']);

// Game state
const snake = ref([{ x: 10, y: 10 }]);
const food = ref({ x: 5, y: 5 });
const direction = ref('right');
const gameOver = ref(false);
const score = ref(0);
const interval = ref(null);
const speed = ref(150);
const gridSize = 20;

// Initialize game
const initGame = () => {
  snake.value = [{ x: 10, y: 10 }];
  generateFood();
  direction.value = 'right';
  gameOver.value = false;
  score.value = 0;
  
  if (interval.value) {
    clearInterval(interval.value);
  }
  
  interval.value = setInterval(moveSnake, speed.value);
  
  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown);
};

// Generate food at random position
const generateFood = () => {
  const x = Math.floor(Math.random() * gridSize);
  const y = Math.floor(Math.random() * gridSize);
  
  // Check if food is on snake
  const isOnSnake = snake.value.some(segment => segment.x === x && segment.y === y);
  
  if (isOnSnake) {
    generateFood();
  } else {
    food.value = { x, y };
  }
};

// Move snake
const moveSnake = () => {
  if (gameOver.value) return;
  
  const head = { ...snake.value[0] };
  
  switch (direction.value) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  // Check for collision with walls
  if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize) {
    endGame();
    return;
  }
  
  // Check for collision with self
  if (snake.value.some(segment => segment.x === head.x && segment.y === head.y)) {
    endGame();
    return;
  }
  
  // Add new head
  snake.value.unshift(head);
  
  // Check for food
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10;
    generateFood();
    
    // Increase speed every 50 points
    if (score.value % 50 === 0) {
      clearInterval(interval.value);
      speed.value = Math.max(50, speed.value - 10);
      interval.value = setInterval(moveSnake, speed.value);
    }
  } else {
    // Remove tail if no food eaten
    snake.value.pop();
  }
};

// Handle keyboard input
const handleKeyDown = (e) => {
  if (!props.active) return;
  
  switch (e.key) {
    case 'ArrowUp':
      if (direction.value !== 'down') direction.value = 'up';
      break;
    case 'ArrowDown':
      if (direction.value !== 'up') direction.value = 'down';
      break;
    case 'ArrowLeft':
      if (direction.value !== 'right') direction.value = 'left';
      break;
    case 'ArrowRight':
      if (direction.value !== 'left') direction.value = 'right';
      break;
  }
};

// End game
const endGame = () => {
  gameOver.value = true;
  clearInterval(interval.value);
  emit('game-over', { score: score.value });
};

// Restart game
const restartGame = () => {
  initGame();
};

// Watch for active state changes
watch(() => props.active, (isActive) => {
  if (isActive) {
    initGame();
  } else {
    clearInterval(interval.value);
    window.removeEventListener('keydown', handleKeyDown);
  }
});

// Initialize on mount
onMounted(() => {
  if (props.active) {
    initGame();
  }
});

// Clean up on unmount
onBeforeUnmount(() => {
  clearInterval(interval.value);
  window.removeEventListener('keydown', handleKeyDown);
});

// Expose methods to parent
defineExpose({
  restartGame
});
</script>

<template>
  <div class="snake-game">
    <div class="flex justify-between items-center mb-4">
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">得分:</span> {{ score }}
      </div>
      <button 
        @click="restartGame" 
        class="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        <i class="fa-solid fa-rotate mr-1"></i>
        重新开始
      </button>
    </div>

    <!-- Game Over Message -->
    <div v-if="gameOver" class="text-center py-4 mb-4 bg-red-100 dark:bg-red-900 rounded-lg">
      <h3 class="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
        <i class="fa-solid fa-skull mr-2"></i>
        游戏结束
      </h3>
      <p class="text-red-600 dark:text-red-400">
        你的得分是 {{ score }}
      </p>
    </div>

    <!-- Snake Game Board -->
    <div 
      class="snake-board relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden"
      style="width: 400px; height: 400px; margin: 0 auto;"
    >
      <!-- Food -->
      <div 
        class="absolute bg-red-500 rounded-full"
        :style="{
          width: '18px',
          height: '18px',
          left: `${food.x * 20}px`,
          top: `${food.y * 20}px`
        }"
      ></div>
      
      <!-- Snake -->
      <div 
        v-for="(segment, index) in snake" 
        :key="index"
        class="absolute bg-green-500"
        :class="{ 'rounded-full': index === 0 }"
        :style="{
          width: '18px',
          height: '18px',
          left: `${segment.x * 20}px`,
          top: `${segment.y * 20}px`
        }"
      ></div>
    </div>

    <div class="text-center mt-4 text-gray-600 dark:text-gray-400">
      使用键盘方向键控制蛇的移动
    </div>
  </div>
</template>

<style scoped>
.snake-game {
  width: 100%;
}

@media (max-width: 640px) {
  .snake-board {
    width: 300px !important;
    height: 300px !important;
  }
}
</style>
