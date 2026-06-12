/**
 * Toast 提示组件
 * 统一消息反馈，2.5秒自动消失
 */
let toastEl = null;
let timer = null;

/**
 * 初始化 Toast 容器
 */
export function initToast() {
  if (toastEl) return;

  toastEl = document.createElement("div");
  toastEl.id = "toast";
  toastEl.style.cssText = `
    position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);
    background:var(--bg3,#1C1C36);border:1px solid var(--purple,#7B5CFF);
    color:var(--text,#E8E8F0);padding:10px 20px;border-radius:10px;
    font-size:.85rem;z-index:300;transition:transform .3s;pointer-events:none;
    font-family:PingFang SC,Microsoft YaHei,sans-serif;
  `;
  document.body.appendChild(toastEl);
}

/**
 * 显示提示
 * @param {string} message
 * @param {boolean} [isError=false]
 */
export function showToast(message, isError = false) {
  if (!toastEl) initToast();

  if (timer) clearTimeout(timer);

  toastEl.textContent = message;
  toastEl.style.borderColor = isError ? "var(--pink,#FF6B9D)" : "var(--purple,#7B5CFF)";
  // Force reflow
  void toastEl.offsetWidth;
  toastEl.style.transform = "translateX(-50%) translateY(0)";

  timer = setTimeout(() => {
    toastEl.style.transform = "translateX(-50%) translateY(-80px)";
  }, 2500);
}
