/**
 * 统一日志工具
 * 格式：[时间] [级别] [模块] 消息 {详情}
 */
import { getEnvValue, isDevelopment } from "./env.js";

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * @param {string} level
 * @param {string} module
 * @param {string} message
 * @param {object} [data]
 */
function log(level, module, message, data) {
  const currentLevel = LOG_LEVELS[getEnvValue("LOG_LEVEL", "info")];
  if (LOG_LEVELS[level] < currentLevel) return;

  const time = new Date().toISOString();
  const prefix = `[${time}] [${level.toUpperCase()}] [${module}]`;

  if (level === "error") {
    console.error(prefix, message, data || "");
  } else if (level === "warn") {
    console.warn(prefix, message, data || "");
  } else {
    // Production only show errors
    if (isDevelopment() || level === "error") {
      console.log(prefix, message, data || "");
    }
  }
}

export const logger = {
  debug(module, message, data) { log("debug", module, message, data); },
  info(module, message, data)  { log("info", module, message, data); },
  warn(module, message, data)  { log("warn", module, message, data); },
  error(module, message, data) { log("error", module, message, data); },
};
