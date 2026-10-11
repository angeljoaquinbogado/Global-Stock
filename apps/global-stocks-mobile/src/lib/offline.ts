import * as SQLite from "expo-sqlite";
import type { Business, Product, SaleDraft } from "./data";

let openPromise: ReturnType<typeof SQLite.openDatabaseAsync> | null = null;

async function database() {
  if (!openPromise) {
    openPromise = SQLite.openDatabaseAsync("global-stocks-local.db");
  }
  const db = await openPromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS business_snapshots (
      user_id TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory_snapshots (
      user_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      cached_at TEXT NOT NULL,
      PRIMARY KEY (user_id, business_id)
    );
    CREATE TABLE IF NOT EXISTS offline_sale_drafts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      business_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export async function readCachedBusinesses(userId: string): Promise<Business[] | null> {
  const db = await database();
  const row = await db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM business_snapshots WHERE user_id = ?", userId
  );
  return row ? JSON.parse(row.payload) as Business[] : null;
}

export async function cacheBusinesses(userId: string, businesses: Business[]) {
  const db = await database();
  await db.runAsync(
    `INSERT INTO business_snapshots (user_id,payload,cached_at) VALUES (?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,cached_at=excluded.cached_at`,
    userId, JSON.stringify(businesses), new Date().toISOString()
  );
}

export async function readCachedProducts(userId: string, businessId: string) {
  const db = await database();
  const row = await db.getFirstAsync<{ payload: string; cached_at: string }>(
    "SELECT payload,cached_at FROM inventory_snapshots WHERE user_id = ? AND business_id = ?",
    userId, businessId
  );
  if (!row) return null;
  return { products: JSON.parse(row.payload) as Product[], cachedAt: row.cached_at };
}

export async function cacheProducts(userId: string, businessId: string, products: Product[]) {
  const db = await database();
  await db.runAsync(
    `INSERT INTO inventory_snapshots (user_id,business_id,payload,cached_at)
     VALUES (?,?,?,?)
     ON CONFLICT(user_id,business_id)
     DO UPDATE SET payload=excluded.payload,cached_at=excluded.cached_at`,
    userId, businessId, JSON.stringify(products), new Date().toISOString()
  );
}

export async function saveOfflineDraft(userId: string, draft: SaleDraft) {
  const db = await database();
  await db.runAsync(
    "INSERT INTO offline_sale_drafts (id,user_id,business_id,payload,created_at) VALUES (?,?,?,?,?)",
    draft.id, userId, draft.business_id, JSON.stringify(draft), draft.created_at
  );
}

export async function loadOfflineDrafts(userId: string, businessId: string): Promise<SaleDraft[]> {
  const db = await database();
  const rows = await db.getAllAsync<{ payload: string }>(
    "SELECT payload FROM offline_sale_drafts WHERE user_id = ? AND business_id = ? ORDER BY created_at DESC",
    userId, businessId
  );
  return rows.map((r) => JSON.parse(r.payload) as SaleDraft);
}

/** No implicit upload: stock, cash and payments must be committed atomically online. */
export const AUTOMATIC_SALE_SYNC_ENABLED = false;
