/**
 * IndexedDB 连接管理
 * 负责数据库初始化、版本管理、事务封装
 */
import { DB_NAME, DB_VERSION, STORE_NAME } from "../core/config.js";
import { ErrorCode, createError } from "../core/errors.js";
import { logger } from "../core/logger.js";

/** @type {IDBDatabase|null} */
let db = null;

/**
 * 打开/初始化数据库
 * @returns {Promise<{ success: boolean, data?: IDBDatabase, error?: object }>}
 */
export function openDB() {
  return new Promise((resolve) => {
    if (db) {
      return resolve({ success: true, data: db });
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const database = /** @type {IDBDatabase} */ (e.target.result);
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("visitor", "visitor", { unique: false });
        store.createIndex("branch", "branch", { unique: false });
        store.createIndex("date", "date", { unique: false });
        logger.info("db", "数据库结构初始化完成", { version: DB_VERSION });
      }
    };

    req.onsuccess = (e) => {
      db = /** @type {IDBDatabase} */ (e.target.result);
      logger.info("db", "数据库连接成功");
      resolve({ success: true, data: db });
    };

    req.onerror = (e) => {
      const err = (/** @type {IDBRequest} */ (e.target)).error;
      logger.error("db", "数据库打开失败", { error: err?.message });
      resolve(createError(ErrorCode.E_DB_OPEN_FAILED, err?.message));
    };
  });
}

/**
 * 执行数据库事务操作
 * @param {'readonly'|'readwrite'} mode
 * @param {(store: IDBObjectStore) => IDBRequest|void} fn
 * @returns {Promise<any>}
 */
export function dbTransaction(mode, fn) {
  if (!db) throw new Error("Database not initialized");

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = fn(store);

    if (result && result.onsuccess !== undefined) {
      result.onsuccess = (e) => resolve(e.target.result);
      result.onerror = (e) => reject(e.target.error);
    } else {
      tx.oncomplete = () => resolve(result);
      tx.onerror = (e) => reject((/** @type {IDBTransaction} */ (e.target)).error);
    }
  });
}

/**
 * 检查数据库是否已初始化
 * @returns {boolean}
 */
export function isDBReady() {
  return db !== null;
}
