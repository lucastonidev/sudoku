/**
 * Geração e validação do tabuleiro de Sudoku.
 */

import { createEmptyBoard, cloneBoard, shuffle } from "./utils.js";

const DIFFICULTY_REMOVALS = {
  easy: 38,
  medium: 48,
  hard: 56,
};

export class BoardGenerator {
  isValidPlacement(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
      if (board[row][i] === num || board[i][col] === num) return false;
    }
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if (board[r][c] === num) return false;
      }
    }
    return true;
  }

  fillBoard(board) {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (const num of numbers) {
            if (this.isValidPlacement(board, row, col, num)) {
              board[row][col] = num;
              if (this.fillBoard(board)) return true;
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  generateSolvedBoard() {
    const board = createEmptyBoard();
    this.fillBoard(board);
    return board;
  }

  generate(difficulty) {
    const solution = this.generateSolvedBoard();
    const puzzle = cloneBoard(solution);
    let removals = DIFFICULTY_REMOVALS[difficulty] ?? DIFFICULTY_REMOVALS.easy;
    while (removals > 0) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (puzzle[row][col] !== 0) {
        puzzle[row][col] = 0;
        removals--;
      }
    }
    return { puzzle, solution };
  }
}
