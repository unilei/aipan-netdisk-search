<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-over']);

// 游戏状态和设置
const canvas = ref(null);
const ctx = ref(null);
const score = ref(0);
const lives = ref(3);
const gameActive = ref(false);
const animationId = ref(null);
const gameOver = ref(false);
const gameWon = ref(false);
const bestScore = ref(localStorage.getItem('breakoutBestScore') || 0);

// 挡板属性
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = 0;

// 球属性
const ballRadius = 8;
let ballX = 0;
let ballY = 0;
let ballDx = 3;
let ballDy = -3;

// 砖块属性
const brickRowCount = 5;
const brickColumnCount = 9;
const brickWidth = 40;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
const bricks = [];

// 初始化砖块
const initBricks = () => {
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      // 根据行给砖块设置不同的颜色和分数
      let color;
      let points;
      
      switch (r) {
        case 0:
          color = '#FF5252'; // 红色
          points = 5;
          break;
        case 1:
          color = '#FF9800'; // 橙色
          points = 4;
          break;
        case 2:
          color = '#FFEB3B'; // 黄色
          points = 3;
          break;
        case 3:
          color = '#4CAF50'; // 绿色
          points = 2;
          break;
        case 4:
          color = '#2196F3'; // 蓝色
          points = 1;
          break;
      }
      
      bricks[c][r] = { x: 0, y: 0, status: 1, color, points };
    }
  }
};

// 游戏初始化
const initGame = () => {
  if (!canvas.value) return;
  
  // 获取画布上下文
  ctx.value = canvas.value.getContext('2d');
  
  // 设置画布大小
  resizeCanvas();
  
  // 初始化游戏状态
  score.value = 0;
  lives.value = 3;
  gameActive.value = true;
  gameOver.value = false;
  gameWon.value = false;
  
  // 初始化挡板位置
  paddleX = (canvas.value.width - paddleWidth) / 2;
  
  // 初始化球的位置
  ballX = canvas.value.width / 2;
  ballY = canvas.value.height - 30;
  ballDx = 3;
  ballDy = -3;
  
  // 初始化砖块
  initBricks();
  
  // 开始游戏循环
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
  
  gameLoop();
};

// 调整画布大小
const resizeCanvas = () => {
  if (!canvas.value) return;
  
  const gameContainer = canvas.value.parentElement;
  if (!gameContainer) return;
  
  const width = Math.min(480, gameContainer.clientWidth);
  
  canvas.value.width = width;
  canvas.value.height = Math.floor(width * 0.7); // 保持适当的高宽比
  
  // 重新计算挡板位置
  paddleX = (canvas.value.width - paddleWidth) / 2;
};

// 游戏主循环
const gameLoop = () => {
  if (!ctx.value || !canvas.value || !gameActive.value) return;
  
  // 清空画布
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
  
  // 绘制砖块
  drawBricks();
  
  // 绘制挡板
  drawPaddle();
  
  // 绘制球
  drawBall();
  
  // 绘制分数
  drawScore();
  
  // 绘制生命值
  drawLives();
  
  // 检测碰撞
  collisionDetection();
  
  // 更新球的位置
  updateBallPosition();
  
  // 请求下一帧
  animationId.value = requestAnimationFrame(gameLoop);
};

// 绘制砖块
const drawBricks = () => {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        
        ctx.value.beginPath();
        ctx.value.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.value.fillStyle = bricks[c][r].color;
        ctx.value.fill();
        ctx.value.closePath();
      }
    }
  }
};

// 绘制挡板
const drawPaddle = () => {
  ctx.value.beginPath();
  ctx.value.rect(paddleX, canvas.value.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.value.fillStyle = '#0095DD';
  ctx.value.fill();
  ctx.value.closePath();
};

// 绘制球
const drawBall = () => {
  ctx.value.beginPath();
  ctx.value.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.value.fillStyle = '#0095DD';
  ctx.value.fill();
  ctx.value.closePath();
};

// 绘制分数
const drawScore = () => {
  ctx.value.font = '16px Arial';
  ctx.value.fillStyle = '#0095DD';
  ctx.value.fillText(`分数: ${score.value}`, 8, 20);
};

// 绘制生命值
const drawLives = () => {
  ctx.value.font = '16px Arial';
  ctx.value.fillStyle = '#0095DD';
  ctx.value.fillText(`生命: ${lives.value}`, canvas.value.width - 65, 20);
};

// 碰撞检测
const collisionDetection = () => {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const brick = bricks[c][r];
      
      if (brick.status === 1) {
        if (
          ballX > brick.x &&
          ballX < brick.x + brickWidth &&
          ballY > brick.y &&
          ballY < brick.y + brickHeight
        ) {
          ballDy = -ballDy;
          brick.status = 0;
          score.value += brick.points;
          
          // 更新最高分
          if (score.value > bestScore.value) {
            bestScore.value = score.value;
            localStorage.setItem('breakoutBestScore', bestScore.value);
          }
          
          // 检查是否所有砖块都被击碎
          checkWinCondition();
        }
      }
    }
  }
};

// 检查胜利条件
const checkWinCondition = () => {
  let bricksRemaining = 0;
  
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        bricksRemaining++;
      }
    }
  }
  
  if (bricksRemaining === 0) {
    gameWon.value = true;
    gameActive.value = false;
    emit('game-over', { score: score.value, won: true });
    cancelAnimationFrame(animationId.value);
  }
};

// 更新球的位置
const updateBallPosition = () => {
  // 球碰到左右边界
  if (ballX + ballDx > canvas.value.width - ballRadius || ballX + ballDx < ballRadius) {
    ballDx = -ballDx;
  }
  
  // 球碰到上边界
  if (ballY + ballDy < ballRadius) {
    ballDy = -ballDy;
  } 
  // 球碰到下边界
  else if (ballY + ballDy > canvas.value.height - ballRadius) {
    // 如果球碰到挡板
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      // 根据球碰到挡板的位置改变反弹角度
      const hitPos = (ballX - paddleX) / paddleWidth; // 0-1之间的值
      const angleRange = Math.PI / 3; // 60度的角度范围
      const angle = (hitPos - 0.5) * angleRange; // 计算角度，中间为0，两侧最大为±30度
      
      const speed = Math.sqrt(ballDx * ballDx + ballDy * ballDy);
      ballDx = speed * Math.sin(angle);
      ballDy = -speed * Math.cos(angle);
      
      // 每次反弹略微增加速度
      const speedIncrease = 0.2;
      ballDx *= (1 + speedIncrease);
      ballDy *= (1 + speedIncrease);
    } else {
      // 球没有碰到挡板，失去一条生命
      lives.value--;
      
      if (lives.value <= 0) {
        // 游戏结束
        gameOver.value = true;
        gameActive.value = false;
        emit('game-over', { score: score.value, won: false });
        cancelAnimationFrame(animationId.value);
      } else {
        // 重置球和挡板位置
        ballX = canvas.value.width / 2;
        ballY = canvas.value.height - 30;
        ballDx = 3;
        ballDy = -3;
        paddleX = (canvas.value.width - paddleWidth) / 2;
      }
    }
  }
  
  // 更新球的位置
  ballX += ballDx;
  ballY += ballDy;
};

// 鼠标/触摸移动事件处理
const mouseMoveHandler = (e) => {
  if (!canvas.value || !gameActive.value) return;
  
  const relativeX = e.type.includes('touch') 
    ? e.touches[0].clientX - canvas.value.getBoundingClientRect().left 
    : e.clientX - canvas.value.getBoundingClientRect().left;
  
  if (relativeX > 0 && relativeX < canvas.value.width) {
    paddleX = relativeX - paddleWidth / 2;
    
    // 确保挡板不会超出画布
    if (paddleX < 0) {
      paddleX = 0;
    } else if (paddleX > canvas.value.width - paddleWidth) {
      paddleX = canvas.value.width - paddleWidth;
    }
  }
};

// 键盘按键事件处理
const keyDownHandler = (e) => {
  if (!gameActive.value) return;
  
  if (e.key === 'Right' || e.key === 'ArrowRight') {
    paddleX += 7;
    if (paddleX > canvas.value.width - paddleWidth) {
      paddleX = canvas.value.width - paddleWidth;
    }
  } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
    paddleX -= 7;
    if (paddleX < 0) {
      paddleX = 0;
    }
  }
};

// 重启游戏
const restartGame = () => {
  initGame();
};

// 监听屏幕尺寸变化
const handleResize = () => {
  resizeCanvas();
};

// 在组件挂载时初始化
onMounted(() => {
  window.addEventListener('resize', handleResize);
  
  if (props.active) {
    // 添加事件监听
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('touchmove', mouseMoveHandler);
    
    initGame();
  }
});

// 在组件卸载时清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', keyDownHandler);
  window.removeEventListener('mousemove', mouseMoveHandler);
  window.removeEventListener('touchmove', mouseMoveHandler);
  
  if (animationId.value) {
    cancelAnimationFrame(animationId.value);
  }
});

// 当active属性变化时
watch(() => props.active, (isActive) => {
  if (isActive) {
    // 添加事件监听
    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('touchmove', mouseMoveHandler);
    
    initGame();
  } else {
    // 移除事件监听
    window.removeEventListener('keydown', keyDownHandler);
    window.removeEventListener('mousemove', mouseMoveHandler);
    window.removeEventListener('touchmove', mouseMoveHandler);
    
    gameActive.value = false;
    if (animationId.value) {
      cancelAnimationFrame(animationId.value);
    }
  }
});

// 暴露方法给父组件
defineExpose({
  restartGame
});
</script>

<template>
  <div class="breakout-game">
    <div class="flex justify-between items-center mb-4">
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">最高分:</span> {{ bestScore }}
      </div>
      <button 
        @click="restartGame" 
        class="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <i class="fa-solid fa-rotate mr-1"></i>
        重新开始
      </button>
    </div>

    <!-- 游戏赢了提示 -->
    <div v-if="gameWon" class="text-center py-4 mb-4 bg-green-100 dark:bg-green-900 rounded-lg">
      <h3 class="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
        <i class="fa-solid fa-trophy mr-2"></i>
        恭喜！
      </h3>
      <p class="text-green-600 dark:text-green-400">
        你成功击碎了所有砖块！得分: {{ score }}
      </p>
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

    <!-- 游戏说明 -->
    <div class="text-center mb-4 text-gray-600 dark:text-gray-400">
      使用鼠标、触摸或键盘方向键移动挡板，反弹球击碎所有砖块
    </div>

    <!-- 游戏画布 -->
    <div class="canvas-container mx-auto" style="max-width: 480px;">
      <canvas 
        ref="canvas" 
        class="bg-gray-100 dark:bg-gray-700 rounded-lg shadow-inner mx-auto"
        style="touch-action: none;"
      ></canvas>
    </div>
  </div>
</template>

<style scoped>
.breakout-game {
  width: 100%;
}

.canvas-container {
  width: 100%;
}

canvas {
  display: block;
  margin: 0 auto;
  touch-action: none;
}
</style>
