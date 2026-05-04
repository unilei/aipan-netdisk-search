<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-over']);

// 游戏状态
const score = ref(0);
const bestScore = ref(0);
const gameOver = ref(false);
const won = ref(false);
const boardSize = 4;
const board = reactive(Array(boardSize).fill().map(() => Array(boardSize).fill(0)));

// 初始化游戏
const initGame = () => {
  // 清空棋盘
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      board[i][j] = 0;
    }
  }
  
  score.value = 0;
  gameOver.value = false;
  won.value = false;
  
  // 添加两个初始方块
  addRandomTile();
  addRandomTile();
};

// 添加随机方块
const addRandomTile = () => {
  // 找出所有空位置
  const emptyCells = [];
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === 0) {
        emptyCells.push({ i, j });
      }
    }
  }
  
  if (emptyCells.length === 0) return;
  
  // 随机选择一个空位置
  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  
  // 90%概率生成2，10%概率生成4
  board[randomCell.i][randomCell.j] = Math.random() < 0.9 ? 2 : 4;
};

// 移动方块
const moveTiles = (direction) => {
  if (gameOver.value || won.value) return;
  
  let moved = false;
  const oldBoard = JSON.parse(JSON.stringify(board));
  
  // 根据方向处理移动
  switch (direction) {
    case 'up':
      moved = moveUp();
      break;
    case 'down':
      moved = moveDown();
      break;
    case 'left':
      moved = moveLeft();
      break;
    case 'right':
      moved = moveRight();
      break;
  }
  
  // 如果有移动，添加新方块
  if (moved) {
    addRandomTile();
    checkGameStatus();
  }
};

// 向上移动
const moveUp = () => {
  let moved = false;
  
  for (let j = 0; j < boardSize; j++) {
    for (let i = 1; i < boardSize; i++) {
      if (board[i][j] !== 0) {
        let row = i;
        while (row > 0) {
          // 如果上方为空，移动
          if (board[row - 1][j] === 0) {
            board[row - 1][j] = board[row][j];
            board[row][j] = 0;
            row--;
            moved = true;
          } 
          // 如果上方数字相同，合并
          else if (board[row - 1][j] === board[row][j]) {
            board[row - 1][j] *= 2;
            score.value += board[row - 1][j];
            bestScore.value = Math.max(bestScore.value, score.value);
            board[row][j] = 0;
            moved = true;
            break;
          } else {
            break;
          }
        }
      }
    }
  }
  
  return moved;
};

// 向下移动
const moveDown = () => {
  let moved = false;
  
  for (let j = 0; j < boardSize; j++) {
    for (let i = boardSize - 2; i >= 0; i--) {
      if (board[i][j] !== 0) {
        let row = i;
        while (row < boardSize - 1) {
          // 如果下方为空，移动
          if (board[row + 1][j] === 0) {
            board[row + 1][j] = board[row][j];
            board[row][j] = 0;
            row++;
            moved = true;
          } 
          // 如果下方数字相同，合并
          else if (board[row + 1][j] === board[row][j]) {
            board[row + 1][j] *= 2;
            score.value += board[row + 1][j];
            bestScore.value = Math.max(bestScore.value, score.value);
            board[row][j] = 0;
            moved = true;
            break;
          } else {
            break;
          }
        }
      }
    }
  }
  
  return moved;
};

// 向左移动
const moveLeft = () => {
  let moved = false;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = 1; j < boardSize; j++) {
      if (board[i][j] !== 0) {
        let col = j;
        while (col > 0) {
          // 如果左方为空，移动
          if (board[i][col - 1] === 0) {
            board[i][col - 1] = board[i][col];
            board[i][col] = 0;
            col--;
            moved = true;
          } 
          // 如果左方数字相同，合并
          else if (board[i][col - 1] === board[i][col]) {
            board[i][col - 1] *= 2;
            score.value += board[i][col - 1];
            bestScore.value = Math.max(bestScore.value, score.value);
            board[i][col] = 0;
            moved = true;
            break;
          } else {
            break;
          }
        }
      }
    }
  }
  
  return moved;
};

// 向右移动
const moveRight = () => {
  let moved = false;
  
  for (let i = 0; i < boardSize; i++) {
    for (let j = boardSize - 2; j >= 0; j--) {
      if (board[i][j] !== 0) {
        let col = j;
        while (col < boardSize - 1) {
          // 如果右方为空，移动
          if (board[i][col + 1] === 0) {
            board[i][col + 1] = board[i][col];
            board[i][col] = 0;
            col++;
            moved = true;
          } 
          // 如果右方数字相同，合并
          else if (board[i][col + 1] === board[i][col]) {
            board[i][col + 1] *= 2;
            score.value += board[i][col + 1];
            bestScore.value = Math.max(bestScore.value, score.value);
            board[i][col] = 0;
            moved = true;
            break;
          } else {
            break;
          }
        }
      }
    }
  }
  
  return moved;
};

// 检查游戏状态
const checkGameStatus = () => {
  // 检查是否赢了（达到2048）
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === 2048) {
        won.value = true;
        emit('game-over', { score: score.value, won: true });
        return;
      }
    }
  }
  
  // 检查是否还有空格
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (board[i][j] === 0) {
        return; // 还有空格，游戏继续
      }
    }
  }
  
  // 检查是否还有可以合并的方块
  for (let i = 0; i < boardSize; i++) {
    for (let j = 0; j < boardSize; j++) {
      if (
        (i < boardSize - 1 && board[i][j] === board[i + 1][j]) ||
        (j < boardSize - 1 && board[i][j] === board[i][j + 1])
      ) {
        return; // 还有可以合并的方块，游戏继续
      }
    }
  }
  
  // 没有空格且没有可合并的方块，游戏结束
  gameOver.value = true;
  emit('game-over', { score: score.value, won: false });
};

// 处理键盘事件
const handleKeyDown = (e) => {
  if (!props.active) return;
  
  switch (e.key) {
    case 'ArrowUp':
      moveTiles('up');
      break;
    case 'ArrowDown':
      moveTiles('down');
      break;
    case 'ArrowLeft':
      moveTiles('left');
      break;
    case 'ArrowRight':
      moveTiles('right');
      break;
  }
};

// 处理触摸事件
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (e) => {
  if (!props.active) return;
  
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
};

const handleTouchEnd = (e) => {
  if (!props.active) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  
  // 确定滑动方向
  if (Math.abs(dx) > Math.abs(dy)) {
    // 水平滑动
    if (dx > 50) {
      moveTiles('right');
    } else if (dx < -50) {
      moveTiles('left');
    }
  } else {
    // 垂直滑动
    if (dy > 50) {
      moveTiles('down');
    } else if (dy < -50) {
      moveTiles('up');
    }
  }
};

// 获取方块背景色
const getTileColor = (value) => {
  switch (value) {
    case 2: return 'bg-gray-200';
    case 4: return 'bg-yellow-100';
    case 8: return 'bg-orange-200';
    case 16: return 'bg-orange-300';
    case 32: return 'bg-orange-400';
    case 64: return 'bg-orange-500';
    case 128: return 'bg-yellow-300';
    case 256: return 'bg-yellow-400';
    case 512: return 'bg-yellow-500';
    case 1024: return 'bg-yellow-600';
    case 2048: return 'bg-yellow-700';
    default: return 'bg-gray-100 dark:bg-gray-700';
  }
};

// 获取方块文字颜色
const getTileTextColor = (value) => {
  return value <= 4 ? 'text-gray-800' : 'text-white';
};

// 重启游戏
const restartGame = () => {
  initGame();
};

// 继续游戏（赢了之后）
const continueGame = () => {
  won.value = false;
};

// 监听活动状态变化
watch(() => props.active, (isActive) => {
  if (isActive) {
    initGame();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
  } else {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchend', handleTouchEnd);
  }
});

// 组件挂载
onMounted(() => {
  if (props.active) {
    initGame();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
  }
  
  // 尝试从本地存储加载最高分
  const savedBestScore = localStorage.getItem('game2048BestScore');
  if (savedBestScore) {
    bestScore.value = parseInt(savedBestScore);
  }
});

// 组件卸载
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('touchstart', handleTouchStart);
  window.removeEventListener('touchend', handleTouchEnd);
  
  // 保存最高分到本地存储
  localStorage.setItem('game2048BestScore', bestScore.value.toString());
});

// 暴露方法给父组件
defineExpose({
  restartGame
});
</script>

<template>
  <div class="game-2048">
    <div class="flex justify-between items-center mb-4">
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">得分:</span> {{ score }}
      </div>
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">最高分:</span> {{ bestScore }}
      </div>
      <button 
        @click="restartGame" 
        class="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
      >
        <i class="fa-solid fa-rotate mr-1"></i>
        重新开始
      </button>
    </div>

    <!-- 游戏赢了提示 -->
    <div v-if="won" class="text-center py-4 mb-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
      <h3 class="text-xl font-bold text-yellow-700 dark:text-yellow-300 mb-2">
        <i class="fa-solid fa-trophy mr-2"></i>
        恭喜！你达到了2048！
      </h3>
      <p class="text-yellow-600 dark:text-yellow-400 mb-2">
        你的得分是 {{ score }}
      </p>
      <button 
        @click="continueGame" 
        class="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
      >
        继续游戏
      </button>
    </div>

    <!-- 游戏结束提示 -->
    <div v-if="gameOver && !won" class="text-center py-4 mb-4 bg-red-100 dark:bg-red-900 rounded-lg">
      <h3 class="text-xl font-bold text-red-700 dark:text-red-300 mb-2">
        <i class="fa-solid fa-face-sad-tear mr-2"></i>
        游戏结束
      </h3>
      <p class="text-red-600 dark:text-red-400">
        你的最终得分是 {{ score }}
      </p>
    </div>

    <!-- 游戏说明 -->
    <div class="text-center mb-4 text-gray-600 dark:text-gray-400">
      使用方向键或滑动来移动方块，相同数字的方块会合并
    </div>

    <!-- 游戏棋盘 -->
    <div class="game-board bg-gray-300 dark:bg-gray-600 rounded-lg p-2 mx-auto" style="max-width: 400px;">
      <div class="grid grid-cols-4 gap-2">
        <template v-for="(row, i) in board" :key="i">
          <div 
            v-for="(tile, j) in row" 
            :key="`${i}-${j}`"
            class="aspect-square rounded-lg flex items-center justify-center font-bold transition-all"
            :class="[
              getTileColor(board[i][j]),
              getTileTextColor(board[i][j]),
              board[i][j] ? 'text-lg md:text-2xl' : ''
            ]"
          >
            {{ board[i][j] || '' }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-2048 {
  width: 100%;
}

.game-board {
  touch-action: none;
}
</style>
