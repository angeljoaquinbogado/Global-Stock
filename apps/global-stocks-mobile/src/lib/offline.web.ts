import type { Business, Product, SaleDraft } from "./data";

/** IndexedDB parity for Expo's SQLite snapshots. This browser cache is only
 * for offline browsing and *drafts*. Payments, stock and sales always require
 * a fresh authenticated online transaction.
 */
const DB_NAME = "global-stock-web-offline";
const DB_VERSION = 1;
type StoreName = "businesses" | "products" | "drafts";
type RecordRow = { key: string; userId: string; businessId?: string; value: unknown; cachedAt: string };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB unavailable")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of ["businesses", "products", "drafts"]) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Could not open offline data"));
  });
}
async function transaction<T>(storeName: StoreName, mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const req = work(tx.objectStore(storeName));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("Offline cache unavailable"));
      tx.onerror = () => reject(tx.error || new Error("Offline cache transaction failed"));
    });
  } finally { db.close(); }
}
const key = (userId: string, businessId?: string) => businessId ? userId + ":" + businessId : userId;

export async function readCachedBusinesses(userId: string): Promise<Business[] | null> {
  const row = await transaction<RecordRow | undefined>("businesses", "readonly", store => store.get(key(userId)));
  return Array.isArray(row?.value) ? row.value as Business[] : null;
}
export async function cacheBusinesses(userId: string, businesses: Business[]): Promise<void> {
  await transaction("businesses", "readwrite", store => store.put({
    key: key(userId), userId, cachedAt: new Date().toISOString(), value: businesses
  } satisfies RecordRow));
}
export async function readCachedProducts(userId: string, businessId: string): Promise<{ products: Product[]; cachedAt: string } | null> {
  const row = await transaction<RecordRow | undefined>("products", "readonly", store => store.get(key(userId, businessId)));
  return Array.isArray(row?.value) ? { products: row.value as Product[], cachedAt: row.cachedAt } : null;
}
export async function cacheProducts(userId: string, businessId: string, products: Product[]): Promise<void> {
  await transaction("products", "readwrite", store => store.put({
    key: key(userId,businessId), userId, businessId, value: products, cachedAt: new Date().toISOString()
  } satisfies RecordRow));
}
export async function saveOfflineDraft(userId: string, draft: SaleDraft): Promise<void> {
  await transaction("drafts", "readwrite", store => store.put({
    key: key(userId, draft.id), userId, businessId: draft.business_id, value: draft, cachedAt: draft.created_at
  } satisfies RecordRow));
}
export async function loadOfflineDrafts(userId: string, businessId: string): Promise<SaleDraft[]> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("drafts", "readonly").objectStore("drafts").getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve((request.result as RecordRow[])
        .filter(row => row.userId === userId && row.businessId === businessId)
        .map(row => row.value as SaleDraft)
        .sort((a,b) => b.created_at.localeCompare(a.created_at)));
    });
  } finally { db.close(); }
}
export async function purgeLocalAccountData(userId: string): Promise<void> {
  if (!userId) throw new Error("Invalid user");
  const db = await openDb();
  try {
    // All three deletes complete under one IndexedDB transaction.
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(["businesses", "products", "drafts"], "readwrite");
      for (const name of ["businesses","products","drafts"] as StoreName[]) {
        const store = tx.objectStore(name);
        const cursor = store.openCursor();
        cursor.onsuccess = () => {
          const item = cursor.result;
          if (!item) return;
          if ((item.value as RecordRow).userId === userId) item.delete();
          item.continue();
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}
export const AUTOMATIC_SALE_SYNC_ENABLED = false;
