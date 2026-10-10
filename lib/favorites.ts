const STORAGE_KEY = 'haven_favorites';

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export const favoritesStore = {
  getAll(): string[] {
    return readIds();
  },

  has(id: string): boolean {
    return readIds().includes(id);
  },

  /** Toggles the property. Returns `true` if it is now a favorite. */
  toggle(id: string): boolean {
    const ids = readIds();
    const idx = ids.indexOf(id);
    if (idx >= 0) {
      ids.splice(idx, 1);
      writeIds(ids);
      return false;
    }
    ids.push(id);
    writeIds(ids);
    return true;
  },

  clear(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
};
