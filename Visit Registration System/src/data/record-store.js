/**
 * 拜访记录 CRUD 操作
 * 数据层：只负责 IndexedDB 读写，不做业务校验
 */
import { openDB, dbTransaction, isDBReady } from "./db.js";
import { STORE_NAME } from "../core/config.js";
import { ErrorCode, createError } from "../core/errors.js";
import { logger } from "../core/logger.js";

/**
 * 获取所有记录
 * @returns {Promise<{ success: boolean, data?: object[], error?: object }>}
 */
export async function getAllRecords() {
  try {
    if (!isDBReady()) await openDB();
    const records = await dbTransaction("readonly", (store) => store.getAll());
    return { success: true, data: records || [] };
  } catch (err) {
    logger.error("record-store", "读取记录失败", { error: err.message });
    return createError(ErrorCode.E_DB_READ_FAILED, err.message);
  }
}

/**
 * 新增记录
 * @param {object} record
 * @returns {Promise<{ success: boolean, data?: string, error?: object }>}
 */
export async function addRecord(record) {
  try {
    if (!isDBReady()) await openDB();
    await dbTransaction("readwrite", (store) => store.add(record));
    logger.info("record-store", "记录新增成功", { id: record.id });
    return { success: true, data: record.id };
  } catch (err) {
    logger.error("record-store", "新增记录失败", { error: err.message });
    return createError(ErrorCode.E_DB_WRITE_FAILED, err.message);
  }
}

/**
 * 更新记录
 * @param {object} record
 * @returns {Promise<{ success: boolean, error?: object }>}
 */
export async function updateRecord(record) {
  try {
    if (!isDBReady()) await openDB();
    await dbTransaction("readwrite", (store) => store.put(record));
    logger.info("record-store", "记录更新成功", { id: record.id });
    return { success: true };
  } catch (err) {
    logger.error("record-store", "更新记录失败", { error: err.message });
    return createError(ErrorCode.E_DB_WRITE_FAILED, err.message);
  }
}

/**
 * 删除记录
 * @param {string} id
 * @returns {Promise<{ success: boolean, error?: object }>}
 */
export async function deleteRecord(id) {
  try {
    if (!isDBReady()) await openDB();
    await dbTransaction("readwrite", (store) => store.delete(id));
    logger.info("record-store", "记录删除成功", { id });
    return { success: true };
  } catch (err) {
    logger.error("record-store", "删除记录失败", { error: err.message });
    return createError(ErrorCode.E_DB_DELETE_FAILED, err.message);
  }
}
