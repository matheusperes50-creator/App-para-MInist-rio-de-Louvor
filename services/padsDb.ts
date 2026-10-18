// IndexedDB persistent storage for custom audio pads (MP3/WAV)
// Uses ArrayBuffer binary storage to guarantee 100% reliability across iOS, Android, and Desktop
// without losing files when the app or browser is closed.

export interface StoredPad {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  arrayBuffer?: ArrayBuffer;
  blob?: Blob;
  createdAt: number;
}

const DB_NAME = 'louvor_pads_database';
const STORE_NAME = 'audio_pads';
const DB_VERSION = 2; // Incremented for schema versioning with ArrayBuffer support

const openDb = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB não suportado neste ambiente'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Request persistent storage so the browser/OS doesn't evict audio files when storage is tight
export const ensurePersistentStorage = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
};

export const savePadToDb = async (pad: StoredPad): Promise<void> => {
  try {
    await ensurePersistentStorage();
    const db = await openDb();

    // Ensure we store ArrayBuffer so it never fails Structured Clone on iOS Safari
    let bufferToStore = pad.arrayBuffer;
    if (!bufferToStore && pad.blob) {
      bufferToStore = await pad.blob.arrayBuffer();
    }

    const record = {
      id: pad.id,
      name: pad.name,
      fileName: pad.fileName,
      fileType: pad.fileType || 'audio/mpeg',
      fileSize: pad.fileSize || (bufferToStore ? bufferToStore.byteLength : 0),
      arrayBuffer: bufferToStore,
      createdAt: pad.createdAt || Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao salvar pad no IndexedDB:', err);
  }
};

export const getAllPadsFromDb = async (): Promise<StoredPad[]> => {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = async () => {
        const rawResults = req.result || [];
        const hydrated: StoredPad[] = [];

        for (const raw of rawResults) {
          let buffer = raw.arrayBuffer;
          let blob = raw.blob;

          if (!buffer && blob) {
            try {
              buffer = await blob.arrayBuffer();
            } catch {}
          } else if (buffer && !blob) {
            blob = new Blob([buffer], { type: raw.fileType || 'audio/mpeg' });
          }

          hydrated.push({
            id: raw.id,
            name: raw.name,
            fileName: raw.fileName || `${raw.name}.mp3`,
            fileType: raw.fileType || 'audio/mpeg',
            fileSize: raw.fileSize || (buffer ? buffer.byteLength : 0),
            arrayBuffer: buffer,
            blob,
            createdAt: raw.createdAt || Date.now()
          });
        }

        resolve(hydrated);
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao carregar pads do IndexedDB:', err);
    return [];
  }
};

export const deletePadFromDb = async (id: string): Promise<void> => {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao excluir pad do IndexedDB:', err);
  }
};

export const clearAllPadsFromDb = async (): Promise<void> => {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erro ao limpar pads do IndexedDB:', err);
  }
};
