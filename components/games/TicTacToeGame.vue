<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-end']);

// Game state
const board = ref(Array(9).fill(null));
const currentPlayer = ref('X');
const winner = ref(null);
const winningCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

// Initialize game
const initGame = () => {
  board.value = Array(9).fill(null);
  currentPlayer.value = 'X';
  winner.value = null;
};

// Make a move
const makeMove = (index) => {
  // Return if cell is already filled or game is won
  if (board.value[index] || winner.value) return;
  
  // Make move
  board.value[index] = currentPlayer.value;
  
  // Check for winner
  checkWinner();
  
  // Switch player if no winner
  if (!winner.value) {
    currentPlayer.value = currentPlayer.value === 'X' ? 'O' : 'X';
    
    // AI move if playing against computer and it's O's turn
    if (currentPlayer.value === 'O') {
      setTimeout(makeAIMove, 500);
    }
  }
};

// AI move
const makeAIMove = () => {
  if (winner.value) return;
  
  // Simple AI: randomly select an empty cell
  const emptyCells = board.value
    .map((cell, index) => cell === null ? index : null)
    .filter(index => index !== null);
  
  if (emptyCells.length > 0) {
    const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    makeMove(randomIndex);
  }
};

// Check for winner
const checkWinner = () => {
  for (const combo of winningCombinations) {
    const [a, b, c] = combo;
    if (
      board.value[a] &&
      board.value[a] === board.value[b] &&
      board.value[a] === board.value[c]
    ) {
      winner.value = board.value[a];
      emit('game-end', { winner: winner.value });
      return;
    }
  }
  
  // Check for draw
  if (!board.value.includes(null) && !winner.value) {
    winner.value = 'draw';
    emit('game-end', { winner: 'draw' });
  }
};

// Restart game
const restartGame = () => {
  initGame();
};

// Watch for active state changes
watch(() => props.active, (isActive) => {
  if (isActive) {
    initGame();
  }
});

// Expose methods to parent
defineExpose({
  restartGame
});
</script>

<template>
  <div class="tictactoe-game">
    <div class="flex justify-between items-center mb-4">
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">当前玩家:</span> 
        <span :class="currentPlayer === 'X' ? 'text-blue-500' : 'text-red-500'">
          {{ currentPlayer }}
        </span>
      </div>
      <button 
        @click="restartGame" 
        class="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        <i class="fa-solid fa-rotate mr-1"></i>
        重新开始
      </button>
    </div>

    <!-- Winner Message -->
    <div 
      v-if="winner" 
      class="text-center py-4 mb-4 rounded-lg"
      :class="{
        'bg-blue-100 dark:bg-blue-900': winner === 'X',
        'bg-red-100 dark:bg-red-900': winner === 'O',
        'bg-gray-100 dark:bg-gray-900': winner === 'draw'
      }"
    >
      <h3 
        class="text-xl font-bold mb-2"
        :class="{
          'text-blue-700 dark:text-blue-300': winner === 'X',
          'text-red-700 dark:text-red-300': winner === 'O',
          'text-gray-700 dark:text-gray-300': winner === 'draw'
        }"
      >
        <template v-if="winner === 'draw'">
          <i class="fa-solid fa-handshake mr-2"></i>
          平局！
        </template>
        <template v-else>
          <i class="fa-solid fa-trophy mr-2"></i>
          玩家 {{ winner }} 获胜！
        </template>
      </h3>
    </div>

    <!-- Game Board -->
    <div class="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      <div 
        v-for="(cell, index) in board" 
        :key="index"
        @click="makeMove(index)"
        class="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-3xl font-bold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        :class="{
          'text-blue-500': cell === 'X',
          'text-red-500': cell === 'O',
          'pointer-events-none': cell !== null || winner
        }"
      >
        {{ cell }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.tictactoe-game {
  width: 100%;
}
</style>
