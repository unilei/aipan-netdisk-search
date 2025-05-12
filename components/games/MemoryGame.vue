<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-completed']);

// Game state
const cards = ref([]);
const flippedCards = ref([]);
const matchedPairs = ref([]);
const moves = ref(0);
const gameStarted = ref(false);
const gameCompleted = ref(false);
const timer = ref(0);
const timerInterval = ref(null);

// Initialize game
const initGame = () => {
  const symbols = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
  const selectedSymbols = [...symbols.slice(0, 8)];
  const cardPairs = [...selectedSymbols, ...selectedSymbols];
  
  // Shuffle cards
  cards.value = cardPairs
    .map(symbol => ({ symbol, id: Math.random() }))
    .sort(() => Math.random() - 0.5);
  
  flippedCards.value = [];
  matchedPairs.value = [];
  moves.value = 0;
  timer.value = 0;
  gameStarted.value = false;
  gameCompleted.value = false;
  
  clearInterval(timerInterval.value);
  timerInterval.value = null;
};

// Flip card
const flipCard = (index) => {
  // Can't flip more than 2 cards at once or already matched cards
  if (flippedCards.value.length >= 2 || matchedPairs.value.includes(index) || flippedCards.value.includes(index)) {
    return;
  }
  
  // Start game on first card flip
  if (!gameStarted.value) {
    gameStarted.value = true;
    startTimer();
  }
  
  // Add card to flipped cards
  flippedCards.value.push(index);
  
  // Check for match if 2 cards are flipped
  if (flippedCards.value.length === 2) {
    moves.value++;
    
    const [firstIndex, secondIndex] = flippedCards.value;
    if (cards.value[firstIndex].symbol === cards.value[secondIndex].symbol) {
      // Match found
      matchedPairs.value.push(firstIndex, secondIndex);
      flippedCards.value = [];
      
      // Check if game is completed
      if (matchedPairs.value.length === cards.value.length) {
        gameCompleted.value = true;
        clearInterval(timerInterval.value);
        emit('game-completed', { moves: moves.value, time: timer.value });
      }
    } else {
      // No match, flip back after delay
      setTimeout(() => {
        flippedCards.value = [];
      }, 1000);
    }
  }
};

// Timer functions
const startTimer = () => {
  timerInterval.value = setInterval(() => {
    timer.value++;
  }, 1000);
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    clearInterval(timerInterval.value);
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
  clearInterval(timerInterval.value);
});

// Expose methods to parent
defineExpose({
  restartGame
});
</script>

<template>
  <div class="memory-game">
    <div class="flex justify-between items-center mb-4">
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">移动次数:</span> {{ moves }}
      </div>
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">时间:</span> {{ formatTime(timer) }}
      </div>
      <button 
        @click="restartGame" 
        class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <i class="fa-solid fa-rotate mr-1"></i>
        重新开始
      </button>
    </div>

    <!-- Game Completed Message -->
    <div v-if="gameCompleted" class="text-center py-4 mb-4 bg-green-100 dark:bg-green-900 rounded-lg">
      <h3 class="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
        <i class="fa-solid fa-trophy mr-2"></i>
        恭喜！
      </h3>
      <p class="text-green-600 dark:text-green-400">
        你用 {{ moves }} 步完成了游戏，用时 {{ formatTime(timer) }}
      </p>
    </div>

    <!-- Cards Grid -->
    <div class="grid grid-cols-4 gap-3">
      <div 
        v-for="(card, index) in cards" 
        :key="card.id"
        @click="flipCard(index)"
        class="aspect-square rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105"
        :class="{
          'bg-blue-500 text-white': flippedCards.includes(index) || matchedPairs.includes(index),
          'bg-gray-200 dark:bg-gray-700': !flippedCards.includes(index) && !matchedPairs.includes(index)
        }"
      >
        <div class="w-full h-full flex items-center justify-center text-3xl">
          <span v-if="flippedCards.includes(index) || matchedPairs.includes(index)">
            {{ card.symbol }}
          </span>
          <span v-else>
            <i class="fa-solid fa-question"></i>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memory-game {
  width: 100%;
}
</style>
