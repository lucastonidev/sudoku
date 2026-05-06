/**
 * Utilitários gerais do jogo.
 */

export function createEmptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function cloneBoard(board) {
  return board.map((row) => [...row]);
}

export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
