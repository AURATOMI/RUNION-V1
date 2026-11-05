/**
 * Native IndexedDB Wrapper with LocalStorage fallback for 100% offline persistence.
 */

const DB_NAME = 'runion_system_ide_db';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';
const STORE_WORKSPACE = 'workspace';

interface IDBDatabaseInstance {
  db: IDBDatabase | null;
  initialized: boolean;
  useFallback: boolean;
}

const state: IDBDatabaseInstance = {
  db: null,
  initialized: false,
  useFallback: false,
};

async function openDb(): Promise<IDBDatabase | null> {
  if (state.initialized) {
    if (state.useFallback) return null;
    return state.db;
  }

  if (typeof window === 'undefined' || !window.indexedDB) {
    state.useFallback = true;
    state.initialized = true;
    return null;
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
          const projectStore = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_WORKSPACE)) {
          db.createObjectStore(STORE_WORKSPACE, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        state.db = (event.target as IDBOpenDBRequest).result;
        state.initialized = true;
        state.useFallback = false;
        resolve(state.db);
      };

      request.onerror = () => {
        console.warn('IndexedDB failed to open, falling back to localStorage');
        state.useFallback = true;
        state.initialized = true;
        resolve(null);
      };
    } catch (err) {
      console.warn('IndexedDB exception, falling back to localStorage', err);
      state.useFallback = true;
      state.initialized = true;
      resolve(null);
    }
  });
}

// Fallback LocalStorage Helpers
const LS_PROJECTS_KEY = 'runion_projects_store';
const LS_WORKSPACE_KEY = 'runion_workspace_store';

function getFallbackProjects(): any[] {
  try {
    const raw = localStorage.getItem(LS_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFallbackProjects(projects: any[]) {
  try {
    localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.error('LocalStorage write failed:', err);
  }
}

export async function dbGetAllProjects(): Promise<any[]> {
  const db = await openDb();
  if (!db) {
    return getFallbackProjects();
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve(getFallbackProjects());
    } catch {
      resolve(getFallbackProjects());
    }
  });
}

export async function dbGetProject(id: string): Promise<any | null> {
  const db = await openDb();
  if (!db) {
    const all = getFallbackProjects();
    return all.find((p) => p.id === id) || null;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_PROJECTS, 'readonly');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => {
        const all = getFallbackProjects();
        resolve(all.find((p) => p.id === id) || null);
      };
    } catch {
      const all = getFallbackProjects();
      resolve(all.find((p) => p.id === id) || null);
    }
  });
}

export async function dbSaveProject(project: any): Promise<void> {
  // Always keep localStorage updated as well for quick redundancy
  const allFallback = getFallbackProjects().filter((p) => p.id !== project.id);
  allFallback.push(project);
  saveFallbackProjects(allFallback);

  const db = await openDb();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.put(project);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function dbDeleteProject(id: string): Promise<void> {
  const allFallback = getFallbackProjects().filter((p) => p.id !== id);
  saveFallbackProjects(allFallback);

  const db = await openDb();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORE_PROJECTS, 'readwrite');
      const store = tx.objectStore(STORE_PROJECTS);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function dbGetWorkspaceMeta(key: string): Promise<any> {
  const db = await openDb();
  if (!db) {
    try {
      const raw = localStorage.getItem(`${LS_WORKSPACE_KEY}_${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_WORKSPACE, 'readonly');
      const store = tx.objectStore(STORE_WORKSPACE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.value ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function dbSetWorkspaceMeta(key: string, value: any): Promise<void> {
  try {
    localStorage.setItem(`${LS_WORKSPACE_KEY}_${key}`, JSON.stringify(value));
  } catch {
    // Ignore LS errors
  }

  const db = await openDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_WORKSPACE, 'readwrite');
      const store = tx.objectStore(STORE_WORKSPACE);
      const req = store.put({ key, value });
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}
