/*
  The smallest IndexedDB wrapper the draft store needs: one object store of
  records keyed by string, read whole on start and written one record at a
  time. Blobs are stored as they are, which is why drafts use IndexedDB and
  not localStorage.

  One database per admin (`wsc-edit-<user id>`), so two people who share a
  browser never see each other's drafts.
*/

const STORE = 'drafts';

export interface DraftDb {
  all: () => Promise<Array<{ id: string; value: unknown }>>;
  put: (id: string, value: unknown) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

function done(req: IDBRequest | IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    if ('oncomplete' in req) {
      req.oncomplete = () => resolve();
      req.onerror = () => reject(req.error);
      req.onabort = () => reject(req.error);
    } else {
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    }
  });
}

export function openDraftDb(name: string): Promise<DraftDb> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(name, 1);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE);
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = (mode: IDBTransactionMode) => db.transaction(STORE, mode).objectStore(STORE);

      resolve({
        all: () =>
          new Promise((res, rej) => {
            const store = tx('readonly');
            const keys = store.getAllKeys();
            const values = store.getAll();
            values.onsuccess = () =>
              res(values.result.map((value, i) => ({ id: String(keys.result[i]), value })));
            values.onerror = () => rej(values.error);
          }),
        put: (id, value) => {
          const store = tx('readwrite');
          store.put(value, id);
          return done(store.transaction);
        },
        remove: (id) => {
          const store = tx('readwrite');
          store.delete(id);
          return done(store.transaction);
        },
        clear: () => {
          const store = tx('readwrite');
          store.clear();
          return done(store.transaction);
        },
      });
    };
  });
}

/** Used when IndexedDB is unavailable (a private window in some browsers): drafts live until reload. */
export const memoryDraftDb: DraftDb = {
  all: async () => [],
  put: async () => {},
  remove: async () => {},
  clear: async () => {},
};
