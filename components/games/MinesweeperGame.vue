<template>
  <div class="minesweeper-game" :class="{ 'game-over': gameOver, 'game-won': gameWon }">
    <div class="game-status mb-4">
      <div class="flex items-center space-x-4 mt-2">
        <div class="flex items-center">
          <i class="fa-solid fa-bomb mr-2"></i>
          <span>{{ remainingMines }}</span>
        </div>
        <div class="flex items-center">
          <i class="fa-regular fa-clock mr-2"></i>
          <span>{{ timerDisplay }}</span>
        </div>
      </div>
    </div>
    
    <div class="minesweeper-board" ref="boardRef">
      <div 
        class="minesweeper-grid"
        :style="{ 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }"
      >
        <div
          v-for="(cell, index) in board"
          :key="index"
          class="minesweeper-cell"
          :class="[
            { 'revealed': cell.revealed },
            { 'mine': cell.isMine && (cell.revealed || gameOver) },
            { 'flagged': cell.flagged },
            { 'exploded': cell.exploded },
            getCellClass(cell)
          ]"
          @click="revealCell(index)"
          @contextmenu.prevent="toggleFlag(index)"
        >
          <template v-if="cell.revealed && !cell.isMine && cell.adjacentMines > 0">
            {{ cell.adjacentMines }}
          </template>
          <i v-else-if="cell.flagged" class="fa-solid fa-flag"></i>
          <i v-else-if="cell.isMine && (cell.revealed || gameOver)" class="fa-solid fa-bomb"></i>
        </div>
      </div>
    </div>
    
    <div class="game-controls mt-4">
      <button 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        @click="restartGame"
      >
        <span v-if="gameWon">You Won! Play Again</span>
        <span v-else-if="gameOver">Game Over! Try Again</span>
        <span v-else>Restart</span>
      </button>
      
      <div class="mt-4 flex flex-wrap gap-2">
        <button 
          v-for="difficulty in difficulties" 
          :key="difficulty.name"
          class="px-3 py-1 rounded transition-colors" 
          :class="currentDifficulty === difficulty.name ? 
            'bg-green-500 text-white' : 
            'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'"
          @click="changeDifficulty(difficulty.name)"
        >
          {{ difficulty.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-over']);

// Board configuration
const difficulties = [
  { name: 'easy', label: 'Easy', rows: 9, cols: 9, mines: 10 },
  { name: 'medium', label: 'Medium', rows: 16, cols: 16, mines: 40 },
  { name: 'hard', label: 'Hard', rows: 16, cols: 30, mines: 99 }
];

const currentDifficulty = ref('easy');
const rows = ref(9);
const cols = ref(9);
const totalMines = ref(10);
const board = ref([]);
const gameOver = ref(false);
const gameWon = ref(false);
const firstClick = ref(true);
const flaggedCells = ref(0);
const timer = ref(0);
const timerInterval = ref(null);
const boardRef = ref(null);

// Computed properties
const remainingMines = computed(() => totalMines.value - flaggedCells.value);
const timerDisplay = computed(() => {
  const minutes = Math.floor(timer.value / 60);
  const seconds = timer.value % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

// Game initialization
const initializeBoard = () => {
  const config = difficulties.find(d => d.name === currentDifficulty.value);
  rows.value = config.rows;
  cols.value = config.cols;
  totalMines.value = config.mines;
  
  const newBoard = [];
  for (let i = 0; i < rows.value * cols.value; i++) {
    newBoard.push({
      isMine: false,
      revealed: false,
      flagged: false,
      adjacentMines: 0,
      exploded: false
    });
  }
  
  board.value = newBoard;
  gameOver.value = false;
  gameWon.value = false;
  firstClick.value = true;
  flaggedCells.value = 0;
  timer.value = 0;
  
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
};

// Place mines after first click
const placeMines = (firstClickIndex) => {
  let minesPlaced = 0;
  
  while (minesPlaced < totalMines.value) {
    const index = Math.floor(Math.random() * (rows.value * cols.value));
    
    // Don't place mine on first click or adjacent cells
    if (index !== firstClickIndex && !isCellAdjacent(index, firstClickIndex) && !board.value[index].isMine) {
      board.value[index].isMine = true;
      minesPlaced++;
    }
  }
  
  // Calculate adjacent mines for each cell
  for (let i = 0; i < rows.value * cols.value; i++) {
    if (!board.value[i].isMine) {
      board.value[i].adjacentMines = countAdjacentMines(i);
    }
  }
};

// Check if a cell is adjacent to another
const isCellAdjacent = (index1, index2) => {
  const row1 = Math.floor(index1 / cols.value);
  const col1 = index1 % cols.value;
  const row2 = Math.floor(index2 / cols.value);
  const col2 = index2 % cols.value;
  
  return Math.abs(row1 - row2) <= 1 && Math.abs(col1 - col2) <= 1;
};

// Count adjacent mines
const countAdjacentMines = (index) => {
  const row = Math.floor(index / cols.value);
  const col = index % cols.value;
  let count = 0;
  
  for (let r = Math.max(0, row - 1); r <= Math.min(rows.value - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(cols.value - 1, col + 1); c++) {
      const idx = r * cols.value + c;
      if (idx !== index && board.value[idx].isMine) {
        count++;
      }
    }
  }
  
  return count;
};

// Reveal a cell
const revealCell = (index) => {
  if (gameOver.value || gameWon.value || board.value[index].flagged) {
    return;
  }
  
  // Start timer on first click
  if (firstClick.value) {
    startTimer();
    placeMines(index);
    firstClick.value = false;
  }
  
  const cell = board.value[index];
  
  // Game over if mine
  if (cell.isMine) {
    cell.exploded = true;
    cell.revealed = true;
    endGame(false);
    return;
  }
  
  // Reveal the cell
  if (!cell.revealed) {
    cell.revealed = true;
    
    // Auto-reveal adjacent cells if this cell has no adjacent mines
    if (cell.adjacentMines === 0) {
      revealAdjacentCells(index);
    }
    
    // Check if game won
    checkWinCondition();
  }
};

// Reveal adjacent cells (flood fill)
const revealAdjacentCells = (index) => {
  const row = Math.floor(index / cols.value);
  const col = index % cols.value;
  
  for (let r = Math.max(0, row - 1); r <= Math.min(rows.value - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(cols.value - 1, col + 1); c++) {
      const idx = r * cols.value + c;
      const adjCell = board.value[idx];
      
      if (!adjCell.revealed && !adjCell.flagged) {
        adjCell.revealed = true;
        
        if (adjCell.adjacentMines === 0) {
          revealAdjacentCells(idx);
        }
      }
    }
  }
};

// Toggle flag on a cell
const toggleFlag = (index) => {
  if (gameOver.value || gameWon.value || board.value[index].revealed) {
    return;
  }
  
  if (!firstClick.value) {
    const cell = board.value[index];
    cell.flagged = !cell.flagged;
    flaggedCells.value += cell.flagged ? 1 : -1;
    
    // Check if game won
    checkWinCondition();
  }
};

// Check if the game is won
const checkWinCondition = () => {
  let allNonMinesRevealed = true;
  
  for (let i = 0; i < board.value.length; i++) {
    const cell = board.value[i];
    if (!cell.isMine && !cell.revealed) {
      allNonMinesRevealed = false;
      break;
    }
  }
  
  if (allNonMinesRevealed) {
    endGame(true);
  }
};

// Get CSS class for cell based on adjacent mines
const getCellClass = (cell) => {
  if (cell.revealed && !cell.isMine && cell.adjacentMines > 0) {
    return `mines-${cell.adjacentMines}`;
  }
  return '';
};

// Start the timer
const startTimer = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
  
  timer.value = 0;
  timerInterval.value = setInterval(() => {
    timer.value++;
  }, 1000);
};

// End the game
const endGame = (won) => {
  gameOver.value = true;
  gameWon.value = won;
  
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
  
  // Reveal all mines if game is lost
  if (!won) {
    board.value.forEach(cell => {
      if (cell.isMine) {
        cell.revealed = true;
      }
    });
  } else {
    // Flag all mines if game is won
    board.value.forEach((cell, index) => {
      if (cell.isMine && !cell.flagged) {
        cell.flagged = true;
        flaggedCells.value++;
      }
    });
  }
  
  // Emit game-over event
  emit('game-over', {
    game: 'minesweeper',
    score: timer.value,
    won: won
  });
};

// Change difficulty
const changeDifficulty = (difficulty) => {
  currentDifficulty.value = difficulty;
  restartGame();
};

// Restart the game
const restartGame = () => {
  initializeBoard();
};

// Adjust cell size based on board dimensions and container size
const adjustCellSize = () => {
  if (!boardRef.value) return;
  
  const containerWidth = boardRef.value.clientWidth;
  const containerHeight = boardRef.value.clientHeight;
  
  const cellSize = Math.min(
    Math.floor(containerWidth / cols.value),
    Math.floor(containerHeight / rows.value)
  );
  
  const cells = boardRef.value.querySelectorAll('.minesweeper-cell');
  cells.forEach(cell => {
    cell.style.width = `${cellSize}px`;
    cell.style.height = `${cellSize}px`;
    cell.style.fontSize = `${Math.max(cellSize * 0.5, 14)}px`;
  });
};

// Watch for prop changes
watch(() => props.active, (isActive) => {
  if (isActive) {
    if (!gameOver.value && !firstClick.value) {
      startTimer();
    }
  } else {
    if (timerInterval.value) {
      clearInterval(timerInterval.value);
      timerInterval.value = null;
    }
  }
});

// Lifecycle hooks
onMounted(() => {
  initializeBoard();
  window.addEventListener('resize', adjustCellSize);
  
  // Adjust cell size after the board is rendered
  setTimeout(adjustCellSize, 100);
});

onBeforeUnmount(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
  window.removeEventListener('resize', adjustCellSize);
});

// Watch for board changes to adjust cell size
watch(board, () => {
  setTimeout(adjustCellSize, 100);
});

// Expose restart function for parent component
defineExpose({
  restartGame
});
</script>

<style scoped>
.minesweeper-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.minesweeper-board {
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: var(--game-bg, #e0e0e0);
  border-radius: 8px;
}

.minesweeper-grid {
  display: grid;
  width: 100%;
  height: 100%;
  gap: 1px;
  background-color: var(--grid-bg, #bdbdbd);
}

.minesweeper-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--cell-bg, #e0e0e0);
  border: 1px solid var(--cell-border, #bdbdbd);
  user-select: none;
  cursor: pointer;
  transition: all 0.1s ease;
  font-weight: bold;
  position: relative;
}

.minesweeper-cell:hover:not(.revealed) {
  background-color: var(--cell-hover-bg, #d0d0d0);
}

.minesweeper-cell.revealed {
  background-color: var(--revealed-bg, #f5f5f5);
}

.minesweeper-cell.mine {
  background-color: var(--mine-bg, #ff6b6b);
}

.minesweeper-cell.exploded {
  background-color: var(--exploded-bg, #ff0000);
}

.minesweeper-cell.flagged {
  color: var(--flag-color, #d32f2f);
}

/* Number colors */
.minesweeper-cell.mines-1 {
  color: #0000ff;
}

.minesweeper-cell.mines-2 {
  color: #007b00;
}

.minesweeper-cell.mines-3 {
  color: #ff0000;
}

.minesweeper-cell.mines-4 {
  color: #00007b;
}

.minesweeper-cell.mines-5 {
  color: #7b0000;
}

.minesweeper-cell.mines-6 {
  color: #007b7b;
}

.minesweeper-cell.mines-7 {
  color: #000000;
}

.minesweeper-cell.mines-8 {
  color: #7b7b7b;
}

.game-over .minesweeper-cell:not(.mine):not(.revealed) {
  opacity: 0.7;
}

.game-status {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 500px;
  padding: 8px 16px;
  background-color: var(--status-bg, #f5f5f5);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .minesweeper-board {
    max-width: 100%;
  }
  
  .minesweeper-cell {
    font-size: 12px;
  }
}

/* Dark mode support */
:root {
  --game-bg: #e0e0e0;
  --grid-bg: #bdbdbd;
  --cell-bg: #e0e0e0;
  --cell-border: #bdbdbd;
  --cell-hover-bg: #d0d0d0;
  --revealed-bg: #f5f5f5;
  --mine-bg: #ff6b6b;
  --exploded-bg: #ff0000;
  --flag-color: #d32f2f;
  --status-bg: #f5f5f5;
}

.dark {
  --game-bg: #2d2d2d;
  --grid-bg: #1a1a1a;
  --cell-bg: #3d3d3d;
  --cell-border: #2d2d2d;
  --cell-hover-bg: #4d4d4d;
  --revealed-bg: #2d2d2d;
  --mine-bg: #c62828;
  --exploded-bg: #ff0000;
  --flag-color: #ff5252;
  --status-bg: #1e1e1e;
}
</style>
