<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-over']);

// Game state
const score = ref(0);
const level = ref(1);
const lines = ref(0);
const bestScore = ref(localStorage.getItem('tetrisBestScore') || 0);
const gameOver = ref(false);
const gamePaused = ref(false);
const gameActive = ref(false);
const requestAnimationId = ref(null);

// Grid dimensions
const gridWidth = 10;
const gridHeight = 20;
const grid = reactive(Array(gridHeight).fill().map(() => Array(gridWidth).fill(0)));

// Tetromino shapes (L, J, S, Z, I, O, T)
const tetrominoes = [
  // L-shape
  [
    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 1]
  ],
  // J-shape
  [
    [0, 2, 0],
    [0, 2, 0],
    [2, 2, 0]
  ],
  // S-shape
  [
    [0, 0, 0],
    [0, 3, 3],
    [3, 3, 0]
  ],
  // Z-shape
  [
    [0, 0, 0],
    [4, 4, 0],
    [0, 4, 4]
  ],
  // I-shape
  [
    [0, 0, 0, 0],
    [5, 5, 5, 5],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  // O-shape
  [
    [6, 6],
    [6, 6]
  ],
  // T-shape
  [
    [0, 0, 0],
    [7, 7, 7],
    [0, 7, 0]
  ]
];

// Tetromino colors
const colors = [
  'transparent',  // Empty
  '#FF8E0D',      // L - Orange
  '#0D8FFF',      // J - Blue
  '#7AFF0D',      // S - Green
  '#FF0D72',      // Z - Red
  '#0DFFEA',      // I - Cyan
  '#FFD70D',      // O - Yellow
  '#9B0DFF'       // T - Purple
];

// Current tetromino
const currentTetromino = reactive({
  shape: [],
  x: 0,
  y: 0,
  color: 0
});

// Next tetromino
const nextTetromino = reactive({
  shape: [],
  color: 0
});

// Game loop variables
const dropInterval = ref(1000); // Initial drop speed in ms
const lastDropTime = ref(0);
const dropCounter = ref(0);

// Control variables
const moveLeft = ref(false);
const moveRight = ref(false);
const moveDown = ref(false);
const rotate = ref(false);
const hardDrop = ref(false);

// Initialize the game
const initGame = () => {
  // Clear the grid
  for (let i = 0; i < gridHeight; i++) {
    for (let j = 0; j < gridWidth; j++) {
      grid[i][j] = 0;
    }
  }
  
  // Reset state
  score.value = 0;
  level.value = 1;
  lines.value = 0;
  gameOver.value = false;
  gamePaused.value = false;
  gameActive.value = true;
  
  // Update drop speed based on level
  updateDropInterval();
  
  // Generate initial tetromino
  generateRandomTetromino();
  generateNextTetromino();
  
  // Start game loop
  if (requestAnimationId.value) {
    cancelAnimationFrame(requestAnimationId.value);
  }
  lastDropTime.value = performance.now();
  gameLoop();
};

// Update the drop interval based on level
const updateDropInterval = () => {
  // Decrease interval as level increases (make game faster)
  dropInterval.value = Math.max(100, 1000 - (level.value - 1) * 100);
};

// Generate a random tetromino
const generateRandomTetromino = () => {
  // Copy next tetromino to current if it exists
  if (nextTetromino.shape.length > 0) {
    currentTetromino.shape = JSON.parse(JSON.stringify(nextTetromino.shape));
    currentTetromino.color = nextTetromino.color;
  } else {
    // First tetromino
    const index = Math.floor(Math.random() * tetrominoes.length);
    currentTetromino.shape = JSON.parse(JSON.stringify(tetrominoes[index]));
    currentTetromino.color = index + 1;
  }
  
  // Set starting position
  currentTetromino.x = Math.floor(gridWidth / 2) - Math.floor(currentTetromino.shape[0].length / 2);
  currentTetromino.y = 0;
  
  // Check if new tetromino can be placed (game over check)
  if (!isValidMove(0, 0)) {
    gameOver.value = true;
    gameActive.value = false;
    
    // Update best score
    if (score.value > bestScore.value) {
      bestScore.value = score.value;
      localStorage.setItem('tetrisBestScore', bestScore.value);
    }
    
    emit('game-over', { score: score.value });
  }
};

// Generate the next tetromino
const generateNextTetromino = () => {
  const index = Math.floor(Math.random() * tetrominoes.length);
  nextTetromino.shape = JSON.parse(JSON.stringify(tetrominoes[index]));
  nextTetromino.color = index + 1;
};

// Check if the move is valid
const isValidMove = (offsetX, offsetY, newShape = null) => {
  const shape = newShape || currentTetromino.shape;
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const newX = currentTetromino.x + x + offsetX;
        const newY = currentTetromino.y + y + offsetY;
        
        // Check boundaries
        if (newX < 0 || newX >= gridWidth || newY >= gridHeight) {
          return false;
        }
        
        // Check collision with existing blocks
        if (newY >= 0 && grid[newY][newX] !== 0) {
          return false;
        }
      }
    }
  }
  
  return true;
};

// Move tetromino
const moveTetromino = (dx, dy) => {
  if (isValidMove(dx, dy)) {
    currentTetromino.x += dx;
    currentTetromino.y += dy;
    return true;
  }
  return false;
};

// Rotate tetromino
const rotateTetromino = () => {
  // Create rotated shape matrix
  const rotatedShape = [];
  const shape = currentTetromino.shape;
  
  for (let i = 0; i < shape[0].length; i++) {
    const row = [];
    for (let j = shape.length - 1; j >= 0; j--) {
      row.push(shape[j][i]);
    }
    rotatedShape.push(row);
  }
  
  // Check if rotation is valid (with some wall kicks)
  const wallKicks = [
    { x: 0, y: 0 },    // No adjustment
    { x: -1, y: 0 },   // Left
    { x: 1, y: 0 },    // Right
    { x: 0, y: -1 },   // Up
    { x: -2, y: 0 },   // Far left
    { x: 2, y: 0 }     // Far right
  ];
  
  for (const kick of wallKicks) {
    if (isValidMove(kick.x, kick.y, rotatedShape)) {
      currentTetromino.x += kick.x;
      currentTetromino.y += kick.y;
      currentTetromino.shape = rotatedShape;
      return true;
    }
  }
  
  return false;
};

// Place the tetromino on the grid
const placeTetromino = () => {
  const shape = currentTetromino.shape;
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const gridY = currentTetromino.y + y;
        const gridX = currentTetromino.x + x;
        
        if (gridY >= 0) {
          grid[gridY][gridX] = currentTetromino.color;
        }
      }
    }
  }
  
  // Check for completed lines
  checkLines();
  
  // Generate new tetromino
  generateRandomTetromino();
  generateNextTetromino();
};

// Check for completed lines
const checkLines = () => {
  let linesCleared = 0;
  
  for (let y = gridHeight - 1; y >= 0; y--) {
    let lineComplete = true;
    
    for (let x = 0; x < gridWidth; x++) {
      if (grid[y][x] === 0) {
        lineComplete = false;
        break;
      }
    }
    
    if (lineComplete) {
      linesCleared++;
      
      // Remove the line and add empty line at top
      for (let y2 = y; y2 > 0; y2--) {
        for (let x = 0; x < gridWidth; x++) {
          grid[y2][x] = grid[y2 - 1][x];
        }
      }
      
      // Clear the top line
      for (let x = 0; x < gridWidth; x++) {
        grid[0][x] = 0;
      }
      
      // Re-check the same line
      y++;
    }
  }
  
  if (linesCleared > 0) {
    // Update lines and score
    lines.value += linesCleared;
    
    // Score based on number of lines cleared at once (1, 3, 5, 8 for 1-4 lines)
    const lineScore = [1, 3, 5, 8];
    score.value += lineScore[Math.min(linesCleared - 1, 3)] * 100 * level.value;
    
    // Update level every 10 lines
    if (lines.value >= level.value * 10) {
      level.value++;
      updateDropInterval();
    }
    
    // Update best score
    if (score.value > bestScore.value) {
      bestScore.value = score.value;
      localStorage.setItem('tetrisBestScore', bestScore.value);
    }
  }
};

// Handle keyboard controls
const handleKeyDown = (e) => {
  if (!gameActive.value || gamePaused.value) return;
  
  switch (e.key) {
    case 'ArrowLeft':
      moveLeft.value = true;
      break;
    case 'ArrowRight':
      moveRight.value = true;
      break;
    case 'ArrowDown':
      moveDown.value = true;
      break;
    case 'ArrowUp':
      rotate.value = true;
      break;
    case ' ':
      hardDrop.value = true;
      break;
    case 'Escape':
    case 'p':
    case 'P':
      togglePause();
      break;
  }
};

const handleKeyUp = (e) => {
  switch (e.key) {
    case 'ArrowLeft':
      moveLeft.value = false;
      break;
    case 'ArrowRight':
      moveRight.value = false;
      break;
    case 'ArrowDown':
      moveDown.value = false;
      break;
    case 'ArrowUp':
      rotate.value = false;
      break;
    case ' ':
      hardDrop.value = false;
      break;
  }
};

// Toggle pause state
const togglePause = () => {
  gamePaused.value = !gamePaused.value;
  
  if (!gamePaused.value && gameActive.value) {
    lastDropTime.value = performance.now();
    gameLoop();
  }
};

// Reset game
const restartGame = () => {
  initGame();
};

// Perform hard drop (drop tetromino to bottom)
const performHardDrop = () => {
  let dropDistance = 0;
  
  while (isValidMove(0, dropDistance + 1)) {
    dropDistance++;
  }
  
  if (dropDistance > 0) {
    currentTetromino.y += dropDistance;
    placeTetromino();
    return true;
  }
  
  return false;
};

// Process inputs
const processInputs = () => {
  if (moveLeft.value) {
    moveTetromino(-1, 0);
    moveLeft.value = false;
  }
  
  if (moveRight.value) {
    moveTetromino(1, 0);
    moveRight.value = false;
  }
  
  if (moveDown.value) {
    if (!moveTetromino(0, 1)) {
      placeTetromino();
    }
    moveDown.value = false;
  }
  
  if (rotate.value) {
    rotateTetromino();
    rotate.value = false;
  }
  
  if (hardDrop.value) {
    performHardDrop();
    hardDrop.value = false;
  }
};

// Update game state
const update = (time) => {
  if (gamePaused.value || !gameActive.value) return;
  
  // Handle automatic drop
  dropCounter.value += time - lastDropTime.value;
  lastDropTime.value = time;
  
  if (dropCounter.value > dropInterval.value) {
    dropCounter.value = 0;
    if (!moveTetromino(0, 1)) {
      placeTetromino();
    }
  }
  
  // Process player inputs
  processInputs();
};

// Render the game
const render = () => {
  // Current tetromino is rendered directly in the template
};

// Main game loop
const gameLoop = (time) => {
  if (!gameActive.value) return;
  
  if (!time) {
    requestAnimationId.value = requestAnimationFrame(gameLoop);
    return;
  }
  
  if (!gamePaused.value) {
    update(time);
    render();
  }
  
  requestAnimationId.value = requestAnimationFrame(gameLoop);
};

// UI Controls for touch devices
const handleMoveLeft = () => {
  if (!gameActive.value || gamePaused.value) return;
  moveTetromino(-1, 0);
};

const handleMoveRight = () => {
  if (!gameActive.value || gamePaused.value) return;
  moveTetromino(1, 0);
};

const handleMoveDown = () => {
  if (!gameActive.value || gamePaused.value) return;
  if (!moveTetromino(0, 1)) {
    placeTetromino();
  }
};

const handleRotate = () => {
  if (!gameActive.value || gamePaused.value) return;
  rotateTetromino();
};

const handleHardDrop = () => {
  if (!gameActive.value || gamePaused.value) return;
  performHardDrop();
};

// Computed properties for rendering
const mergedGrid = computed(() => {
  const result = JSON.parse(JSON.stringify(grid));
  
  if (!gameActive.value || gamePaused.value) {
    return result;
  }
  
  // Add current tetromino to the grid
  const shape = currentTetromino.shape;
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const gridY = currentTetromino.y + y;
        const gridX = currentTetromino.x + x;
        
        if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
          result[gridY][gridX] = currentTetromino.color;
        }
      }
    }
  }
  
  return result;
});

// Show ghost piece (where the tetromino will land)
const ghostPiecePosition = computed(() => {
  if (!gameActive.value || gamePaused.value) {
    return [];
  }
  
  let dropDistance = 0;
  
  while (isValidMove(0, dropDistance + 1)) {
    dropDistance++;
  }
  
  const ghostPositions = [];
  const shape = currentTetromino.shape;
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const gridY = currentTetromino.y + y + dropDistance;
        const gridX = currentTetromino.x + x;
        
        if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth) {
          ghostPositions.push({ x: gridX, y: gridY });
        }
      }
    }
  }
  
  return ghostPositions;
});

// Watch for active state change
watch(() => props.active, (isActive) => {
  if (isActive) {
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    initGame();
  } else {
    // Remove event listeners
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    
    gameActive.value = false;
    if (requestAnimationId.value) {
      cancelAnimationFrame(requestAnimationId.value);
    }
  }
});

// Initialize on mount
onMounted(() => {
  if (props.active) {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    initGame();
  }
});

// Clean up on unmount
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  
  if (requestAnimationId.value) {
    cancelAnimationFrame(requestAnimationId.value);
  }
});

// Expose methods to parent
defineExpose({
  restartGame,
  togglePause
});
</script>

<template>
  <div class="tetris-game">
    <div class="flex justify-between items-center mb-4">
      <div class="flex flex-col text-gray-700 dark:text-gray-300">
        <div><span class="font-medium">分数:</span> {{ score }}</div>
        <div><span class="font-medium">最高分:</span> {{ bestScore }}</div>
      </div>
      <div class="flex flex-col text-gray-700 dark:text-gray-300">
        <div><span class="font-medium">等级:</span> {{ level }}</div>
        <div><span class="font-medium">行数:</span> {{ lines }}</div>
      </div>
      <div class="flex flex-col gap-2">
        <button 
          @click="restartGame" 
          class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
        >
          <i class="fa-solid fa-rotate mr-1"></i>
          重新开始
        </button>
        <button 
          @click="togglePause" 
          class="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          <i class="fa-solid fa-pause mr-1" v-if="!gamePaused"></i>
          <i class="fa-solid fa-play mr-1" v-else></i>
          {{ gamePaused ? '继续' : '暂停' }}
        </button>
      </div>
    </div>

    <!-- 游戏结束提示 -->
    <div v-if="gameOver" class="text-center py-4 mb-4 bg-red-100 dark:bg-red-900 rounded-lg">
      <h3 class="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
        <i class="fa-solid fa-face-sad-tear mr-2"></i>
        游戏结束
      </h3>
      <p class="text-red-600 dark:text-red-400">
        最终得分: {{ score }}
      </p>
    </div>

    <!-- 游戏暂停提示 -->
    <div v-if="gamePaused && !gameOver" class="text-center py-4 mb-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
      <h3 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
        <i class="fa-solid fa-pause mr-2"></i>
        游戏暂停
      </h3>
      <p class="text-gray-600 dark:text-gray-400">
        点击继续按钮或按 P 键继续游戏
      </p>
    </div>

    <!-- 游戏说明 -->
    <div class="text-center mb-4 text-gray-600 dark:text-gray-400 text-sm">
      使用方向键移动和旋转，空格键快速下落
    </div>

    <div class="flex flex-col sm:flex-row justify-center gap-4">
      <!-- 主游戏区 -->
      <div class="tetris-grid bg-gray-100 dark:bg-gray-800 p-1 sm:p-2 rounded-lg shadow-inner mx-auto">
        <div class="grid grid-cols-10 gap-px">
          <div 
            v-for="(cell, index) in mergedGrid.flat()" 
            :key="index"
            class="aspect-square border border-gray-200 dark:border-gray-700"
            :class="cell !== 0 ? 'border-gray-300 dark:border-gray-600' : ''"
            :style="{ 
              backgroundColor: colors[cell],
              width: '20px',
              height: '20px'
            }"
          >
            <!-- Ghost piece (show where tetromino will land) -->
            <div 
              v-if="ghostPiecePosition.some(pos => pos.y * gridWidth + pos.x === Math.floor(index / gridWidth) * gridWidth + index % gridWidth) && cell === 0"
              class="w-full h-full border-2 border-dashed border-gray-400 dark:border-gray-500"
            ></div>
          </div>
        </div>
      </div>

      <!-- 侧边栏信息 -->
      <div class="flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-4">
        <!-- 下一个方块预览 -->
        <div class="next-piece p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div class="text-center text-sm text-gray-700 dark:text-gray-300 mb-1">下一个</div>
          <div class="grid grid-cols-4 gap-px">
            <template v-for="(row, y) in 4" :key="`next-${y}`">
              <div 
                v-for="(col, x) in 4" 
                :key="`next-${y}-${x}`"
                class="aspect-square border border-gray-200 dark:border-gray-700"
                :style="{ 
                  backgroundColor: (nextTetromino.shape[y] && nextTetromino.shape[y][x] && nextTetromino.shape[y][x] !== 0) 
                    ? colors[nextTetromino.color] 
                    : 'transparent',
                  width: '15px',
                  height: '15px'
                }"
              ></div>
            </template>
          </div>
        </div>

        <!-- 触摸控制 (仅在小屏幕和触摸设备上显示) -->
        <div class="touch-controls sm:mt-4">
          <div class="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            <button @click="handleMoveLeft" class="control-btn col-span-1">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button @click="handleRotate" class="control-btn col-span-1">
              <i class="fa-solid fa-rotate"></i>
            </button>
            <button @click="handleMoveRight" class="control-btn col-span-1">
              <i class="fa-solid fa-arrow-right"></i>
            </button>
            <button @click="handleMoveDown" class="control-btn col-span-2">
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button @click="handleHardDrop" class="control-btn col-span-1">
              <i class="fa-solid fa-arrow-down-long"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import "tailwindcss" reference;

.tetris-game {
  width: 100%;
}

.tetris-grid {
  width: fit-content;
  touch-action: none;
}

.control-btn {
  @apply bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg p-2;
  @apply flex items-center justify-center;
  @apply hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors;
}

@media (min-width: 640px) {
  .touch-controls {
    display: none;
  }
}
</style>
