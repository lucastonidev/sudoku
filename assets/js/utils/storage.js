/**
 * Persistência do jogo via localStorage.
 */

const KEYS = {
  save: "sudoku-save",
  history: "sudoku-history",
};

export class GameStorage {
  static save(data) {
    localStorage.setItem(KEYS.save, JSON.stringify(data));
  }

  static load() {
    const raw = localStorage.getItem(KEYS.save);
    return raw ? JSON.parse(raw) : null;
  }

  static clear() {
    localStorage.removeItem(KEYS.save);
  }

  static addHistoryEntry(entry) {
    const history = GameStorage.getHistory();
    history.push(entry);
    localStorage.setItem(KEYS.history, JSON.stringify(history));
  }

  static getHistory() {
    const raw = localStorage.getItem(KEYS.history);
    return raw ? JSON.parse(raw) : [];
  }
}
