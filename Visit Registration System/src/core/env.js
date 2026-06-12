/**
 * 环境变量读取模块
 * 优先级：window.__APP_CONFIG__ > .env 默认值
 */
const DEFAULTS = {
  TMAP_WEBSERVICE_KEY: "",
  SHEETJS_CDN: "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js",
  LOG_LEVEL: "info",
  APP_ENV: "development",
};

/** @type {Record<string, string>} */
let _config = null;

/**
 * 获取所有环境变量
 * @returns {Record<string, string>}
 */
export function getEnv() {
  if (_config) return _config;
  _config = { ...DEFAULTS, ...(window.__APP_CONFIG__ || {}) };
  return _config;
}

/**
 * 获取单个环境变量
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function getEnvValue(key, fallback = "") {
  const env = getEnv();
  return env[key] ?? fallback;
}

/**
 * 是否为开发环境
 * @returns {boolean}
 */
export function isDevelopment() {
  return getEnvValue("APP_ENV") === "development";
}
