<template>
  <div class="connect-four-game">
    <div class="game-info mb-4">
      <div v-if="!gameOver" class="text-xl font-bold mb-2">
        <span>当前玩家: </span>
        <span :class="currentPlayer === 1 ? 'text-red-500' : 'text-yellow-500'">
          {{ currentPlayer === 1 ? '红色' : '黄色' }}
        </span>
      </div>
      <div v-else class="text-xl font-bold mb-2">
        <span v-if="winner">
          <span :class="winner === 1 ? 'text-red-500' : 'text-yellow-500'">
            {{ winner === 1 ? '红色' : '黄色' }}
          </span>
          玩家获胜!
        </span>
        <span v-else>平局!</span>
      </div>
    </div>
    
    <div class="game-board">
      <div class="column-indicators">
        <button 
          v-for="col in columns" 
          :key="'indicator-' + col"
          class="column-indicator"
          :disabled="isColumnFull(col - 1) || gameOver"
          @click="dropDisc(col - 1)"
        >
          <i class="fa-solid fa-arrow-down"></i>
        </button>
      </div>
      
      <div class="connect-four-grid">
        <div 
          v-for="(cell, index) in board.flat()"
          :key="index"
          class="cell"
        >
          <div 
            v-if="cell !== 0" 
            class="disc" 
            :class="cell === 1 ? 'player-one' : 'player-two'"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="game-controls mt-4">
      <button 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        @click="restartGame"
      >
        开始新游戏
      </button>
      
      <button
        v-if="vsComputer"
        class="ml-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        @click="toggleVsComputer"
      >
        电脑对战模式: 开启
      </button>
      <button
        v-else
        class="ml-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        @click="toggleVsComputer"
      >
        电脑对战模式: 关闭
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-over']);

// Game configuration
const rows = 6;
const columns = 7;
const winLength = 4;

// Game state
const board = ref(Array(rows).fill().map(() => Array(columns).fill(0)));
const currentPlayer = ref(1); // 1 for player one, 2 for player two
const gameOver = ref(false);
const winner = ref(null);
const vsComputer = ref(true);

// Initialize the game
const initializeGame = () => {
  // Reset the board
  board.value = Array(rows).fill().map(() => Array(columns).fill(0));
  currentPlayer.value = 1;
  gameOver.value = false;
  winner.value = null;
};

// Check if a column is full
const isColumnFull = (col) => {
  return board.value[0][col] !== 0;
};

// Get the next available row in a column
const getNextAvailableRow = (col) => {
  for (let row = rows - 1; row >= 0; row--) {
    if (board.value[row][col] === 0) {
      return row;
    }
  }
  return -1;
};

// Drop a disc in a column
const dropDisc = (col) => {
  if (gameOver.value || isColumnFull(col)) return;
  
  const row = getNextAvailableRow(col);
  if (row === -1) return;
  
  // Place the disc
  board.value[row][col] = currentPlayer.value;
  
  // Check for win
  if (checkWin(row, col)) {
    gameOver.value = true;
    winner.value = currentPlayer.value;
    emit('game-over', {
      game: 'connect-four',
      winner: currentPlayer.value
    });
    return;
  }
  
  // Check for draw
  if (checkDraw()) {
    gameOver.value = true;
    emit('game-over', {
      game: 'connect-four',
      draw: true
    });
    return;
  }
  
  // Switch player
  currentPlayer.value = currentPlayer.value === 1 ? 2 : 1;
  
  // AI move
  if (vsComputer.value && currentPlayer.value === 2 && !gameOver.value) {
    setTimeout(() => {
      computerMove();
    }, 500);
  }
};

// Check for draw
const checkDraw = () => {
  for (let col = 0; col < columns; col++) {
    if (!isColumnFull(col)) {
      return false;
    }
  }
  return true;
};

// Check for win
const checkWin = (row, col) => {
  const player = board.value[row][col];
  
  // Check horizontal
  let count = 0;
  for (let c = 0; c < columns; c++) {
    count = (board.value[row][c] === player) ? count + 1 : 0;
    if (count >= winLength) return true;
  }
  
  // Check vertical
  count = 0;
  for (let r = 0; r < rows; r++) {
    count = (board.value[r][col] === player) ? count + 1 : 0;
    if (count >= winLength) return true;
  }
  
  // Check diagonal (top-left to bottom-right)
  let r = row - Math.min(row, col);
  let c = col - Math.min(row, col);
  count = 0;
  while (r < rows && c < columns) {
    count = (board.value[r][c] === player) ? count + 1 : 0;
    if (count >= winLength) return true;
    r++;
    c++;
  }
  
  // Check diagonal (top-right to bottom-left)
  r = row - Math.min(row, columns - 1 - col);
  c = col + Math.min(row, columns - 1 - col);
  count = 0;
  while (r < rows && c >= 0) {
    count = (board.value[r][c] === player) ? count + 1 : 0;
    if (count >= winLength) return true;
    r++;
    c--;
  }
  
  return false;
};

// Computer move (simple AI)
const computerMove = () => {
  // First check if computer can win in the next move
  for (let col = 0; col < columns; col++) {
    if (!isColumnFull(col)) {
      const row = getNextAvailableRow(col);
      
      // Temporarily place a disc
      board.value[row][col] = 2;
      
      // Check if this move would win
      if (checkWin(row, col)) {
        // Keep the winning move
        currentPlayer.value = 1;
        
        // Check for game over
        gameOver.value = true;
        winner.value = 2;
        emit('game-over', {
          game: 'connect-four',
          winner: 2
        });
        
        return;
      }
      
      // Undo the move
      board.value[row][col] = 0;
    }
  }
  
  // Check if player can win in the next move and block
  for (let col = 0; col < columns; col++) {
    if (!isColumnFull(col)) {
      const row = getNextAvailableRow(col);
      
      // Temporarily place a player disc
      board.value[row][col] = 1;
      
      // Check if this move would win for the player
      if (checkWin(row, col)) {
        // Block this move
        board.value[row][col] = 2;
        currentPlayer.value = 1;
        
        // Check for draw
        if (checkDraw()) {
          gameOver.value = true;
          emit('game-over', {
            game: 'connect-four',
            draw: true
          });
        }
        
        return;
      }
      
      // Undo the move
      board.value[row][col] = 0;
    }
  }
  
  // Choose a random column, prioritizing the center
  const preferredCols = [3, 2, 4, 1, 5, 0, 6];
  for (const col of preferredCols) {
    if (!isColumnFull(col)) {
      const row = getNextAvailableRow(col);
      board.value[row][col] = 2;
      currentPlayer.value = 1;
      
      // Check for draw
      if (checkDraw()) {
        gameOver.value = true;
        emit('game-over', {
          game: 'connect-four',
          draw: true
        });
      }
      
      return;
    }
  }
};

// Toggle computer opponent
const toggleVsComputer = () => {
  vsComputer.value = !vsComputer.value;
  restartGame();
};

// Restart the game
const restartGame = () => {
  initializeGame();
};

// Watch for prop changes
watch(() => props.active, (isActive) => {
  if (isActive && gameOver.value) {
    // Optionally restart when tab becomes active again
  }
});

// Initialize
initializeGame();

// Expose restart function for parent component
defineExpose({
  restartGame
});
</script>

<style scoped>
.connect-four-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.game-board {
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  background-color: #0039CB;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.column-indicators {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  margin-bottom: 10px;
}

.column-indicator {
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 5px;
  padding: 5px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.column-indicator:hover:not(:disabled) {
  background-color: rgba(255, 255, 255, 0.2);
}

.column-indicator:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.connect-four-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 5px;
  aspect-ratio: 7 / 6;
}

.cell {
  background-color: #0039CB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.cell::before {
  content: '';
  position: absolute;
  width: 80%;
  height: 80%;
  background-color: white;
  border-radius: 50%;
  z-index: 1;
}

.disc {
  position: absolute;
  width: 80%;
  height: 80%;
  border-radius: 50%;
  z-index: 2;
  animation: drop-in 0.5s ease-in-out;
}

.player-one {
  background-color: #FF0000;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

.player-two {
  background-color: #FFFF00;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.3);
}

@keyframes drop-in {
  0% {
    transform: translateY(-300%);
  }
  70% {
    transform: translateY(10%);
  }
  85% {
    transform: translateY(-5%);
  }
  100% {
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .game-board {
    width: 100%;
  }
}

/* Dark mode support */
.dark .cell::before {
  background-color: #333;
}
</style>
