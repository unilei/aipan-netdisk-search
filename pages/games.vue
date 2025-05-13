<script setup>
import { ref, onMounted } from 'vue';
import SnakeGame from '~/components/games/SnakeGame.vue';
import TicTacToeGame from '~/components/games/TicTacToeGame.vue';
import PuzzleGame from '~/components/games/PuzzleGame.vue';
import WhackAMoleGame from '~/components/games/WhackAMoleGame.vue';
import Game2048 from '~/components/games/Game2048.vue';
import BreakoutGame from '~/components/games/BreakoutGame.vue';
import TetrisGame from '~/components/games/TetrisGame.vue';
import MinesweeperGame from '~/components/games/MinesweeperGame.vue';
import ConnectFourGame from '~/components/games/ConnectFourGame.vue';

useHead({
  title: '休闲游戏',
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { hid: 'description', name: 'description', content: '休闲游戏' },
    { name: 'format-detection', content: 'telephone=no' }
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
  ]
})

// 游戏状态
const activeGame = ref('snake');
const gameTitle = ref('贪吃蛇');
const gameDescription = ref('使用方向键控制蛇吃食物，不要撞到墙壁或自己');

// 游戏组件引用
const snakeGameRef = ref(null);
const ticTacToeGameRef = ref(null);
const puzzleGameRef = ref(null);
const whackAMoleGameRef = ref(null);
const game2048Ref = ref(null);
const breakoutGameRef = ref(null);
const tetrisGameRef = ref(null);
const minesweeperGameRef = ref(null);
const connectFourGameRef = ref(null);

// 切换游戏
const setActiveGame = (game) => {
  activeGame.value = game;
  
  switch(game) {
    case 'snake':
      gameTitle.value = '贪吃蛇';
      gameDescription.value = '使用方向键控制蛇吃食物，不要撞到墙壁或自己';
      break;
    case 'tictactoe':
      gameTitle.value = '井字棋';
      gameDescription.value = '两人轮流在棋盘上标记X或O，先连成一条线的玩家获胜';
      break;
    case 'puzzle':
      gameTitle.value = '数字拼图';
      gameDescription.value = '移动方块，将它们按顺序排列';
      break;
    case 'whackamole':
      gameTitle.value = '打地鼠';
      gameDescription.value = '在时间内点击出现的地鼠，获得高分';
      break;
    case '2048':
      gameTitle.value = '2048';
      gameDescription.value = '滑动合并相同数字的方块，尝试达到2048';
      break;
    case 'breakout':
      gameTitle.value = '打砖块';
      gameDescription.value = '控制挡板反弹球击碎所有砖块，不要让球掉下来';
      break;
    case 'tetris':
      gameTitle.value = '俄罗斯方块';
      gameDescription.value = '旋转和移动下落的方块，消除完整的行以获得分数';
      break;
    case 'minesweeper':
      gameTitle.value = '扫雷';
      gameDescription.value = '尝试揭开所有不含地雷的方块，避免触发地雷';
      break;
    case 'connectfour':
      gameTitle.value = '四子连线';
      gameDescription.value = '轮流放置棋子，先连成四个一线的玩家获胜';
      break;
  }
};

// 重启当前游戏
const restartCurrentGame = () => {
  switch(activeGame.value) {
    case 'snake':
      snakeGameRef.value?.restartGame();
      break;
    case 'tictactoe':
      ticTacToeGameRef.value?.restartGame();
      break;
    case 'puzzle':
      puzzleGameRef.value?.restartGame();
      break;
    case 'whackamole':
      whackAMoleGameRef.value?.restartGame();
      break;
    case '2048':
      game2048Ref.value?.restartGame();
      break;
    case 'breakout':
      breakoutGameRef.value?.restartGame();
      break;
    case 'tetris':
      tetrisGameRef.value?.restartGame();
      break;
    case 'minesweeper':
      minesweeperGameRef.value?.restartGame();
      break;
    case 'connectfour':
      connectFourGameRef.value?.restartGame();
      break;
  }
};

// 游戏完成事件处理
const onGameCompleted = (gameData) => {
  console.log('游戏完成:', gameData);
  // 这里可以添加成就系统、记录最高分等功能
};

// 游戏结束事件处理
const onGameOver = (gameData) => {
  console.log('游戏结束:', gameData);
  // 这里可以添加成就系统、记录最高分等功能
};

// 初始化
onMounted(() => {
  // 可以从本地存储加载游戏偏好设置等
});
</script>

<template>
  <div class="games-container">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
        <i class="fa-solid fa-gamepad mr-2 text-blue-500"></i>
        游戏中心
      </h1>
      <p class="text-center text-gray-600 dark:text-gray-400 mb-8">
        放松一下，玩点小游戏吧！
      </p>

      <!-- 游戏选择 -->
      <div class="game-selection flex flex-wrap justify-center gap-3 mb-8">
        <button 
          @click="setActiveGame('snake')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === 'snake' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-snake mr-2"></i>
          贪吃蛇
        </button>
        <button 
          @click="setActiveGame('tictactoe')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === 'tictactoe' 
              ? 'bg-purple-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-hashtag mr-2"></i>
          井字棋
        </button>
        <button 
          @click="setActiveGame('puzzle')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === 'puzzle' 
              ? 'bg-amber-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-puzzle-piece mr-2"></i>
          数字拼图
        </button>
        <button 
          @click="setActiveGame('whackamole')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === 'whackamole' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-hammer mr-2"></i>
          打地鼠
        </button>
        <button 
          @click="setActiveGame('2048')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === '2048' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-cubes mr-2"></i>
          2048
        </button>
        <button 
          @click="setActiveGame('breakout')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === 'breakout' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-volleyball mr-2"></i>
          打砖块
        </button>
        <button 
          @click="setActiveGame('tetris')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === 'tetris' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-shapes mr-2"></i>
          俄罗斯方块
        </button>
        <button 
          @click="setActiveGame('minesweeper')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === 'minesweeper' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-bomb mr-2"></i>
          扫雷
        </button>
        <button 
          @click="setActiveGame('connectfour')" 
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeGame === 'connectfour' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          <i class="fa-solid fa-circle-dot mr-2"></i>
          四子连线
        </button>
      </div>

      <!-- 游戏信息 -->
      <div class="game-info mb-8 text-center">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">{{ gameTitle }}</h2>
        <p class="text-gray-600 dark:text-gray-400">{{ gameDescription }}</p>
      </div>

      <!-- 游戏容器 -->
      <div class="game-container bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <!-- 贪吃蛇游戏 -->
        <SnakeGame 
          v-if="activeGame === 'snake'" 
          ref="snakeGameRef"
          :active="activeGame === 'snake'"
          @game-over="onGameOver"
        />

        <!-- 井字棋游戏 -->
        <TicTacToeGame 
          v-if="activeGame === 'tictactoe'" 
          ref="ticTacToeGameRef"
          :active="activeGame === 'tictactoe'"
          @game-end="onGameOver"
        />

        <!-- 数字拼图游戏 -->
        <PuzzleGame 
          v-if="activeGame === 'puzzle'" 
          ref="puzzleGameRef"
          :active="activeGame === 'puzzle'"
          @game-completed="onGameCompleted"
        />

        <!-- 打地鼠游戏 -->
        <WhackAMoleGame 
          v-if="activeGame === 'whackamole'" 
          ref="whackAMoleGameRef"
          :active="activeGame === 'whackamole'"
          @game-over="onGameOver"
        />
        
        <!-- 2048游戏 -->
        <Game2048 
          v-if="activeGame === '2048'" 
          ref="game2048Ref"
          :active="activeGame === '2048'"
          @game-over="onGameOver"
        />
        
        <!-- 打砖块游戏 -->
        <BreakoutGame 
          v-if="activeGame === 'breakout'" 
          ref="breakoutGameRef"
          :active="activeGame === 'breakout'"
          @game-over="onGameOver"
        />
        
        <!-- 俄罗斯方块游戏 -->
        <TetrisGame 
          v-if="activeGame === 'tetris'" 
          ref="tetrisGameRef"
          :active="activeGame === 'tetris'"
          @game-over="onGameOver"
        />
        
        <!-- 扫雷游戏 -->
        <MinesweeperGame
          v-if="activeGame === 'minesweeper'" 
          ref="minesweeperGameRef"
          :active="activeGame === 'minesweeper'"
          @game-over="onGameOver"
        />
        
        <!-- 四子连线游戏 -->
        <ConnectFourGame
          v-if="activeGame === 'connectfour'" 
          ref="connectFourGameRef"
          :active="activeGame === 'connectfour'"
          @game-over="onGameOver"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.games-container {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

:root.dark .games-container {
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
}

@media (max-width: 640px) {
  .game-selection {
    flex-direction: column;
    align-items: center;
  }
  
  .game-selection button {
    margin-bottom: 0.5rem;
    width: 100%;
  }
}
</style>