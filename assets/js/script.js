/**
 * Classe principal do jogo: controla estado, lógica e eventos.
 */

import { BoardGenerator } from "./utils/board-generator.js";
import { BoardRenderer } from "./ui/ui.js";
import { GameStorage } from "./utils/storage.js";
import { cloneBoard, formatTime } from "./utils/utils.js";

export class SudokuGame {
  constructor() {
    this.state = {
      difficulty: "easy",
      puzzle: [],
      solution: [],
      selected: null,
      hintsLeft: 3,
      mistakes: 0,
      startTime: null,
      timerId: null,
      solved: false,
    };

    this.generator = new BoardGenerator();
  }

  init() {
    this._cacheElements();
    this.renderer = new BoardRenderer(this.el.board);
    this._setupButtons();
    this._setupDifficulty();
    this._setupThemeToggle();
    this._buildNumberPad();
    this._restoreOrNewGame();
  }

  _cacheElements() {
    this.el = {
      board: document.getElementById("board"),
      status: document.getElementById("status"),
      timer: document.getElementById("timer"),
      mistakes: document.getElementById("mistakes"),
      hints: document.getElementById("hintsLeft"),
      difficulty: document.getElementById("difficultySelect"),
      numberPad: document.getElementById("numberPad"),
    };
  }

  _setupButtons() {
    document
      .getElementById("newGameBtn")
      .addEventListener("click", () => this.newGame());
    document
      .getElementById("checkBtn")
      .addEventListener("click", () => this.checkBoard());
    document
      .getElementById("hintBtn")
      .addEventListener("click", () => this.useHint());
    document
      .getElementById("solveBtn")
      .addEventListener("click", () => this.solveBoard());
  }

  // ── Estado e persistência ──────────────────────────────────────────────────

  _restoreOrNewGame() {
    const saved = GameStorage.load();
    if (saved && !saved.solved) {
      Object.assign(this.state, saved);
      this._buildBoard();
      this._setStatus("Jogo restaurado de onde você parou.", "success");
      this.state.timerId = setInterval(() => {
        this._tickTimer();
        GameStorage.save(this.state);
      }, 1000);
    } else {
      this.newGame();
    }
  }

  newGame() {
    clearInterval(this.state.timerId);
    console.log(`Gerando novo puzzle (dificuldade: ${this.state.difficulty})...`);
    
    const { puzzle, solution } = this.generator.generate(this.state.difficulty);
    Object.assign(this.state, {
      puzzle,
      solution,
      selected: null,
      hintsLeft: 3,
      mistakes: 0,
      solved: false,
    });
    this.el.hints.textContent = "3";
    this.el.mistakes.textContent = "0";
    this._buildBoard();
    this._startTimer();
    this._setStatus("Novo puzzle carregado. Escolha uma célula vazia.");
    GameStorage.save(this.state);
  }

  _saveProgress() {
    GameStorage.save(this.state);
  }

  _recordCompletion(timeSeconds) {
    GameStorage.addHistoryEntry({
      date: new Date().toLocaleString(),
      time: formatTime(timeSeconds),
      difficulty: this.state.difficulty,
    });
    GameStorage.clear();
  }

  // ── Tabuleiro ──────────────────────────────────────────────────────────────

  _buildBoard() {
    this.renderer.render(
      this.state.puzzle,
      (e) => this._onCellInput(e),
      (e) => this._onCellKeydown(e),
      (r, c) => this._selectCell(r, c),
    );
    this.renderer.focusFirstEditable();
    this.renderer.paintState(this.state.puzzle, this.state.selected);
  }

  _selectCell(row, col) {
    this.state.selected = { row, col };
    this.renderer.paintState(this.state.puzzle, this.state.selected);
  }

  _onCellInput(event) {
    const input = event.target;
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    const value = input.value.replace(/[^1-9]/g, "").slice(0, 1);
    input.value = value;
    this.state.puzzle[row][col] = value ? Number(value) : 0;
    input.classList.toggle("user-filled", Boolean(value));
    this._validateCell(row, col, true);
    this.renderer.paintState(this.state.puzzle, this.state.selected);
    this._checkWin();
  }

  _onCellKeydown(event) {
    const row = Number(event.target.dataset.row);
    const col = Number(event.target.dataset.col);
    const key = event.key;

    const arrows = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    if (arrows[key]) {
      event.preventDefault();
      const [dr, dc] = arrows[key];
      this._moveSelection(row + dr, col + dc);
      return;
    }

    if (["Backspace", "Delete", "0"].includes(key)) {
      event.target.value = "";
      this.state.puzzle[row][col] = 0;
      event.target.classList.remove("invalid", "user-filled");
      this._setStatus("Célula limpa.");
      this.renderer.paintState(this.state.puzzle, this.state.selected);
    }
  }

  _moveSelection(row, col) {
    if (row < 0 || row > 8 || col < 0 || col > 8) return;
    const next = this.renderer.getCell(row, col);
    if (next) {
      next.focus();
      this._selectCell(row, col);
    }
  }

  _trackMistake() {
    this.state.mistakes += 1;
    this.el.mistakes.textContent = this.state.mistakes;
    this._checkStrikeLimit();
  }

  _checkStrikeLimit() {
    const reachedLimit = this.state.mistakes >= 3;
    this._setStatus(
      `Cuidado que se pode errar mais ${3 - this.state.mistakes}`,
      "error",
    );
    if (reachedLimit) {
      this._setStatus(
        "Limite de erros atingido. O jogo será reiniciado.",
        "error",
      );
      setTimeout(() => {
        this.newGame();
      }, 2000);
    }
  }

  _validateCell(row, col, countMistake = false) {
    const cell = this.renderer.getCell(row, col);
    if (!cell || cell.disabled) return true;
    const value = this.state.puzzle[row][col];
    if (!value) {
      cell.classList.remove("invalid");
      return true;
    }
    const correct = value === this.state.solution[row][col];
    cell.classList.toggle("invalid", !correct);
    if (!correct) {
      if (countMistake) {
        if (this.state.difficulty === "hard") {
          this._trackMistake();
        }else{
          this.state.mistakes += 1;
          this.el.mistakes.textContent = this.state.mistakes;
          this._setStatus(
            "Esse número não corresponde à solução nessa posição.",
            "error",
          );
        }
      }
    } else {
      this._setStatus("Boa jogada. Continue preenchendo a grade.");
    }
    return correct;
  }

  // ── Ações do jogador ───────────────────────────────────────────────────────

  fillSelectedValue(value) {
    if (!this.state.selected || this.state.solved) return;
    const { row, col } = this.state.selected;
    const cell = this.renderer.getCell(row, col);
    if (!cell || cell.disabled) {
      this._setStatus("Escolha uma célula editável.", "error");
      return;
    }
    if (value === 0) {
      cell.value = "";
      this.state.puzzle[row][col] = 0;
      cell.classList.remove("invalid", "user-filled");
      this.renderer.paintState(this.state.puzzle, this.state.selected);
      return;
    }
    cell.value = String(value);
    this.state.puzzle[row][col] = value;
    cell.classList.add("user-filled");
    this._validateCell(row, col, true);
    this.renderer.paintState(this.state.puzzle, this.state.selected);
    this._checkWin();
  }

  useHint() {
    if (this.state.hintsLeft <= 0) {
      this._setStatus("Você já usou todas as dicas.", "error");
      return;
    }
    const empties = [];
    this.state.puzzle.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v === 0) empties.push([r, c]);
      }),
    );
    if (!empties.length) {
      this._setStatus("Não há células vazias para receber dica.");
      return;
    }
    const [row, col] = empties[Math.floor(Math.random() * empties.length)];
    const cell = this.renderer.getCell(row, col);
    this.state.puzzle[row][col] = this.state.solution[row][col];
    cell.value = String(this.state.solution[row][col]);
    cell.classList.remove("invalid");
    cell.classList.add("user-filled", "hint");
    setTimeout(() => cell.classList.remove("hint"), 1200);
    this.state.hintsLeft -= 1;
    this.el.hints.textContent = this.state.hintsLeft;
    this._setStatus("Dica aplicada em uma célula vazia.", "success");
    this.renderer.paintState(this.state.puzzle, this.state.selected);
    this._checkWin();
  }

  checkBoard() {
    let incorrect = 0;
    this.el.board.querySelectorAll(".cell").forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      if (!cell.disabled && this.state.puzzle[row][col] !== 0) {
        if (!this._validateCell(row, col, false)) incorrect += 1;
      }
    });
    if (incorrect === 0) {
      this._setStatus(
        "Nenhum conflito encontrado nas células preenchidas.",
        "success",
      );
    } else {
      this._setStatus(`Existem ${incorrect} célula(s) incorreta(s).`, "error");
    }
  }

  solveBoard() {
    clearInterval(this.state.timerId);
    this.state.puzzle = cloneBoard(this.state.solution);
    this.el.board.querySelectorAll(".cell").forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      cell.value = String(this.state.solution[row][col]);
      cell.classList.remove("invalid");
      if (!cell.disabled) cell.classList.add("user-filled");
    });
    this.state.solved = true;
    GameStorage.clear();
    this._setStatus("Puzzle resolvido automaticamente.", "success");
    this.renderer.paintState(this.state.puzzle, this.state.selected);
  }

  _checkWin() {
    const complete = this.state.puzzle.every((row, r) =>
      row.every((value, c) => value === this.state.solution[r][c]),
    );
    if (!complete) return;
    clearInterval(this.state.timerId);
    this.state.solved = true;
    const timeSpent = Math.floor((Date.now() - this.state.startTime) / 1000);
    this._recordCompletion(timeSpent);
    this._setStatus(
      `Parabéns! Você completou o Sudoku em ${formatTime(timeSpent)}! 🎉`,
      "success",
    );
  }

  // ── Timer ──────────────────────────────────────────────────────────────────

  _startTimer() {
    clearInterval(this.state.timerId);
    this.state.startTime = Date.now();
    this._tickTimer();
    this.state.timerId = setInterval(() => {
      this._tickTimer();
      this._saveProgress();
    }, 1000);
  }

  _tickTimer() {
    if (!this.state.startTime) return;
    const elapsed = Math.floor((Date.now() - this.state.startTime) / 1000);
    this.el.timer.textContent = formatTime(elapsed);
  }

  // ── UI auxiliar ────────────────────────────────────────────────────────────

  _setStatus(message, type = "") {
    this.el.status.textContent = message;
    this.el.status.className = `status${type ? ` ${type}` : ""}`;
  }

  _buildNumberPad() {
    this.el.numberPad.innerHTML = "";
    [...Array(9)].forEach((_, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pad-btn";
      btn.textContent = String(i + 1);
      btn.addEventListener("click", () => this.fillSelectedValue(i + 1));
      this.el.numberPad.appendChild(btn);
    });
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "pad-btn clear";
    clear.textContent = "Limpar";
    clear.addEventListener("click", () => this.fillSelectedValue(0));
    this.el.numberPad.appendChild(clear);
  }

  _setupDifficulty() {
    this.el.difficulty.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-difficulty]");
      if (!target) return;
      this.state.difficulty = target.dataset.difficulty;
      [...this.el.difficulty.querySelectorAll("button")].forEach((btn) =>
        btn.classList.toggle("active", btn === target),
      );
      this.newGame();
    });
    
    // Define o botão ativo com base na dificuldade atual
    
    this.el.difficulty.querySelectorAll("button").forEach((btn) => {
      if (btn.dataset.difficulty === this.state.difficulty) {
        btn.classList.add("active");
      }
      
    });
  }

  _setupThemeToggle() {
    const toggle = document.querySelector("[data-theme-toggle]");
    let mode = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    document.documentElement.setAttribute("data-theme", mode);
    const updateIcon = () => {
      toggle.innerHTML =
        mode === "dark"
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
    };
    updateIcon();
    toggle.addEventListener("click", () => {
      mode = mode === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", mode);
      updateIcon();
    });
  }
}
