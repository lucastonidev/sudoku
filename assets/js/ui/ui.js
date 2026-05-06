/**
 * Manipulação do DOM: renderização do tabuleiro e interações visuais.
 */

export class BoardRenderer {
  constructor(boardEl) {
    this.boardEl = boardEl;
  }

  getCell(row, col) {
    return this.boardEl.querySelector(
      `.cell[data-row="${row}"][data-col="${col}"]`,
    );
  }

  render(puzzle, onInput, onKeydown, onSelect) {
    this.boardEl.innerHTML = "";
    puzzle.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const input = this._createCellInput(
          value,
          rowIndex,
          colIndex,
          onInput,
          onKeydown,
          onSelect,
        );
        this.boardEl.appendChild(input);
      });
    });
  }

  _createCellInput(value, rowIndex, colIndex, onInput, onKeydown, onSelect) {
    const input = document.createElement("input");
    input.className = "cell";
    input.type = "text";
    input.inputMode = "numeric";
    input.pattern = "[1-9]";
    input.maxLength = 1;
    input.setAttribute("role", "gridcell");
    input.setAttribute(
      "aria-label",
      `Linha ${rowIndex + 1}, coluna ${colIndex + 1}`,
    );
    input.dataset.row = rowIndex;
    input.dataset.col = colIndex;
    input.dataset.boxRow = rowIndex;
    input.dataset.boxCol = colIndex;

    if (value !== 0) {
      input.value = value;
      input.disabled = true;
    }

    input.addEventListener("focus", () => onSelect(rowIndex, colIndex));
    input.addEventListener("click", () => onSelect(rowIndex, colIndex));
    input.addEventListener("input", onInput);
    input.addEventListener("keydown", onKeydown);
    return input;
  }

  focusFirstEditable() {
    const first = [...this.boardEl.querySelectorAll(".cell")].find(
      (c) => !c.disabled,
    );
    if (first) first.focus();
  }

  paintState(puzzle, selected) {
    const selectedValue = selected ? puzzle[selected.row][selected.col] : null;

    this.boardEl.querySelectorAll(".cell").forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const isSelected =
        selected && row === selected.row && col === selected.col;
      const sameRow = selected && row === selected.row;
      const sameCol = selected && col === selected.col;
      const sameBox =
        selected &&
        Math.floor(row / 3) === Math.floor(selected.row / 3) &&
        Math.floor(col / 3) === Math.floor(selected.col / 3);
      const currentValue = puzzle[row][col];

      cell.classList.toggle("selected", Boolean(isSelected));
      cell.classList.toggle(
        "related",
        Boolean(selected) && !isSelected && (sameRow || sameCol || sameBox),
      );
      cell.classList.toggle(
        "same-number",
        Boolean(selectedValue) && currentValue === selectedValue && !isSelected,
      );
    });
  }
}
