export class IndexedDB {
  static dbName = 'hazelnutDB';

  static dbVersion = 1;

  static eventStore = 'events';

  static errorStore = 'errors';

  public static openDB(): void {
    // ignore DB for now
    // return new Promise<IDBDatabase>((resolve, reject) => {
    //   const request = indexedDB.open(IndexedDB.dbName, IndexedDB.dbVersion);
    //   request.onerror = event => {
    //     reject(`Error opening IndexedDB: ${event.target}`);
    //   };
    //   request.onsuccess = event => {
    //     resolve((event.target as IDBOpenDBRequest).result);
    //   };
    //   request.onupgradeneeded = event => {
    //     const db = (event.target as IDBOpenDBRequest).result;
    //     if (!db.objectStoreNames.contains(IndexedDB.eventStore)) {
    //       db.createObjectStore(IndexedDB.eventStore, {
    //         keyPath: "id",
    //         autoIncrement: true,
    //       });
    //     }
    //     if (!db.objectStoreNames.contains(IndexedDB.errorStore)) {
    //       db.createObjectStore(IndexedDB.errorStore, {
    //         keyPath: "id",
    //         autoIncrement: true,
    //       });
    //     }
    //   };
    // });
  }

  public static async save(storeName: string, data: any): Promise<void> {
    // ignore DB for now
    // const db = await IndexedDB.openDB();
    // return new Promise<void>((resolve, reject) => {
    //   const transaction = db.transaction([storeName], "readwrite");
    //   transaction.oncomplete = () => resolve();
    //   transaction.onerror = event =>
    //     reject(`Error saving data: ${event.target}`);
    //   const store = transaction.objectStore(storeName);
    //   store.add(data);
    // });
  }

  public static async getAll(storeName: string): Promise<void> {
    // ignore DB for now
    // const db = await IndexedDB.openDB();
    // return new Promise<any[]>((resolve, reject) => {
    //   const transaction = db.transaction([storeName], "readonly");
    //   transaction.onerror = event =>
    //     reject(`Error fetching data: ${event.target}`);
    //   const store = transaction.objectStore(storeName);
    //   const request = store.getAll();
    //   request.onsuccess = () => resolve(request.result);
    //   request.onerror = event => reject(`Error fetching data: ${event.target}`);
    // });
  }

  public static async delete(storeName: string, id: number): Promise<void> {
    // ignore DB for now
    // const db = await IndexedDB.openDB();
    // return new Promise<void>((resolve, reject) => {
    //   const transaction = db.transaction([storeName], "readwrite");
    //   transaction.oncomplete = () => resolve();
    //   transaction.onerror = event =>
    //     reject(`Error deleting data: ${event.target}`);
    //   const store = transaction.objectStore(storeName);
    //   store.delete(id);
    // });
  }
}
