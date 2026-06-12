/**
 * 认证服务
 * 处理用户登录/登出/会话管理
 */
import { logger } from "../core/logger.js";
import { ErrorCode, createError } from "../core/errors.js";

const STORAGE_KEY = "vr_login";
const LOGIN_OVERLAY_ID = "loginOverlay";

/** @type {{ name: string, empNo: string }|null} */
let currentUser = null;

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
  if (currentUser) return true;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      return true;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return false;
}

/**
 * 获取当前用户
 * @returns {{ name: string, empNo: string }|null}
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * 登录
 * @param {string} name
 * @param {string} empNo
 * @returns {{ success: boolean, error?: object }}
 */
export function login(name, empNo) {
  if (!name || !empNo) {
    return createError(ErrorCode.E_AUTH_INVALID);
  }

  currentUser = { name: name.trim(), empNo: empNo.trim() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
  logger.info("auth", "用户登录成功", { user: currentUser.name });

  return { success: true, data: currentUser };
}

/**
 * 登出
 */
export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  const prevUser = currentUser?.name;
  currentUser = null;
  logger.info("auth", "用户已登出", { user: prevUser });
}

/**
 * 健康检查：验证 localStorage 可用
 * @returns {boolean}
 */
export function healthCheck() {
  try {
    localStorage.setItem("_health", "1");
    localStorage.removeItem("_health");
    return true;
  } catch {
    return false;
  }
}
