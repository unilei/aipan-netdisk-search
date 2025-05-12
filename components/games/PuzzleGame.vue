<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['game-completed']);

// Game state
const puzzleSize = 3; // 3x3 puzzle
const puzzleTiles = ref([]);
const puzzleMoves = ref(0);
const puzzleCompleted = ref(false);
const emptyTileIndex = ref(puzzleSize * puzzleSize - 1); // Last tile is empty

// Initialize game
const initGame = () => {
  // Create tiles 1 to 8 (9th is empty)
  const tiles = Array.from({ length: puzzleSize * puzzleSize - 1 }, (_, i) => i + 1);
  tiles.push(null); // Empty tile
  
  // Shuffle tiles (ensure it's solvable)
  do {
    shufflePuzzle(tiles);
  } while (!isPuzzleSolvable(tiles));
  
  puzzleTiles.value = tiles;
  puzzleMoves.value = 0;
  puzzleCompleted.value = false;
  emptyTileIndex.value = puzzleTiles.value.indexOf(null);
};

// Shuffle puzzle
const shufflePuzzle = (tiles) => {
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
};

// Check if puzzle is solvable
const isPuzzleSolvable = (tiles) => {
  // Count inversions (for 3x3 puzzle, solvable if inversions is even)
  let inversions = 0;
  const tilesWithoutEmpty = tiles.filter(t => t !== null);
  
  for (let i = 0; i < tilesWithoutEmpty.length; i++) {
    for (let j = i + 1; j < tilesWithoutEmpty.length; j++) {
      if (tilesWithoutEmpty[i] > tilesWithoutEmpty[j]) {
        inversions++;
      }
    }
  }
  
  return inversions % 2 === 0;
};

// Check if tile can be moved
const canMoveTile = (index) => {
  const emptyIndex = puzzleTiles.value.indexOf(null);
  const row = Math.floor(index / puzzleSize);
  const col = index % puzzleSize;
  const emptyRow = Math.floor(emptyIndex / puzzleSize);
  const emptyCol = emptyIndex % puzzleSize;
  
  // Check if tile is adjacent to empty tile
  return (
    (row === emptyRow && Math.abs(col - emptyCol) === 1) ||
    (col === emptyCol && Math.abs(row - emptyRow) === 1)
  );
};

// Move tile
const moveTile = (index) => {
  if (!canMoveTile(index)) return;
  
  const emptyIndex = puzzleTiles.value.indexOf(null);
  const newTiles = [...puzzleTiles.value];
  
  // Swap tile with empty space
  [newTiles[index], newTiles[emptyIndex]] = [newTiles[emptyIndex], newTiles[index]];
  puzzleTiles.value = newTiles;
  emptyTileIndex.value = index;
  puzzleMoves.value++;
  
  // Check if puzzle is solved
  checkCompleted();
};

// Check if puzzle is completed
const checkCompleted = () => {
  // Check if all tiles are in order (1-8 followed by null)
  const isCompleted = puzzleTiles.value.every((tile, index) => {
    if (index === puzzleSize * puzzleSize - 1) {
      return tile === null;
    }
    return tile === index + 1;
  });
  
  if (isCompleted && !puzzleCompleted.value) {
    puzzleCompleted.value = true;
    emit('game-completed', { moves: puzzleMoves.value });
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
  <div class="puzzle-game">
    <div class="flex justify-between items-center mb-4">
      <div class="text-gray-700 dark:text-gray-300">
        <span class="font-medium">移动次数:</span> {{ puzzleMoves }}
      </div>
      <button 
        @click="restartGame" 
        class="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        <i class="fa-solid fa-rotate mr-1"></i>
        重新开始
      </button>
    </div>

    <!-- Game Completed Message -->
    <div v-if="puzzleCompleted" class="text-center py-4 mb-4 bg-green-100 dark:bg-green-900 rounded-lg">
      <h3 class="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
        <i class="fa-solid fa-trophy mr-2"></i>
        恭喜！
      </h3>
      <p class="text-green-600 dark:text-green-400">
        你用 {{ puzzleMoves }} 步完成了拼图
      </p>
    </div>

    <!-- Puzzle Grid -->
    <div class="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      <div 
        v-for="(tile, index) in puzzleTiles" 
        :key="index"
        @click="moveTile(index)"
        class="aspect-square rounded-lg flex items-center justify-center text-2xl font-bold transition-all duration-200 transform"
        :class="{
          'bg-amber-500 text-white hover:bg-amber-600 cursor-pointer hover:scale-105': tile !== null && canMoveTile(index),
          'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-not-allowed': tile !== null && !canMoveTile(index),
          'bg-transparent': tile === null,
          'pointer-events-none': puzzleCompleted
        }"
      >
        {{ tile }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.puzzle-game {
  width: 100%;
}

.puzzle-game .grid > div {
  transform-origin: center;
}
</style>
