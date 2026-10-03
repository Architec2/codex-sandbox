export interface SaveData {
  version: 1;
  name: string;
  seed: number;
  mode: "adventure" | "creative";
  difficulty: "peaceful" | "gentle" | "adventure";
  position: [number, number, number];
  time: number;
  inventory: Record<string, number>;
  changes: Record<string, string | null>;
  tutorial: number;
}

export interface Settings {
  graphics: "Very Low" | "Low" | "Medium";
  viewDistance: number;
  renderScale: number;
  sensitivity: number;
  music: number;
  sound: number;
  invertY: boolean;
  reducedMotion: boolean;
}

const SAVE_KEY = "essies-enchanted-wilds-save";
const SETTINGS_KEY = "essies-enchanted-wilds-settings";
const DB_NAME = "essies-enchanted-wilds";
const defaults: Settings = {
  graphics: "Low",
  viewDistance: 24,
  renderScale: 0.85,
  sensitivity: 5,
  music: 3,
  sound: 5,
  invertY: false,
  reducedMotion: false,
};

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("game");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction("game").objectStore("game").get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(key: string, value: unknown): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("game", "readwrite");
    transaction.objectStore("game").put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export const Saves = {
  has(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  },
  async load(): Promise<SaveData | null> {
    try {
      const value = await idbGet<SaveData>(SAVE_KEY);
      if (value?.version === 1) return value;
    } catch {
      /* localStorage remains available in private/restricted contexts. */
    }
    try {
      const value = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      return value?.version === 1 ? value : null;
    } catch {
      return null;
    }
  },
  async save(value: SaveData): Promise<void> {
    // The marker makes Continue immediately reliable while IndexedDB is async.
    localStorage.setItem(SAVE_KEY, JSON.stringify(value));
    try {
      await idbPut(SAVE_KEY, value);
    } catch {
      /* fallback already written */
    }
  },
};

export const Preferences = {
  load(): Settings {
    try {
      return {
        ...defaults,
        ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
      };
    } catch {
      return { ...defaults };
    }
  },
  save(value: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(value));
  },
};
