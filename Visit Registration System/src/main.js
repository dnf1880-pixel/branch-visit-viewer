/**
 * 应用入口
 * 负责：初始化 → 认证检查 → 路由挂载 → 全局事件绑定
 */
import { openDB } from "./data/db.js";
import { isLoggedIn, healthCheck } from "./services/auth.js";
import { initToast, showToast } from "./ui/components/toast.js";
import { logger } from "./core/logger.js";
import { isDevelopment } from "./core/env.js";

// ===== 启动入口 =====
async function bootstrap() {
  logger.info("app", "系统启动中...", { env: isDevelopment() ? "development" : "production" });

  // 1. 初始化 Toast
  initToast();

  // 2. 健康检查
  if (!healthCheck()) {
    showToast("浏览器存储不可用，请检查设置", true);
    return;
  }

  // 3. 初始化数据库
  const dbResult = await openDB();
  if (!dbResult.success) {
    showToast(dbResult.error.message, true);
    return;
  }

  logger.info("app", "系统启动完成");
  showToast("系统就绪");
}

// ===== 全局错误捕获 =====
window.addEventListener("error", (e) => {
  logger.error("app", "未捕获错误", { message: e.message, filename: e.filename });
});

window.addEventListener("unhandledrejection", (e) => {
  logger.error("app", "未处理的 Promise 拒绝", { reason: e.reason?.message || e.reason });
});

// ===== 启动 =====
bootstrap();
