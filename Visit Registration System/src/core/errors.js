/**
 * 统一错误码体系
 * 所有模块抛出的错误必须使用本标准错误码
 */

/** @enum {string} 错误码 */
export const ErrorCode = {
  // 身份认证
  E_AUTH_INVALID: "E_AUTH_INVALID",
  // 数据库
  E_DB_OPEN_FAILED: "E_DB_OPEN_FAILED",
  E_DB_WRITE_FAILED: "E_DB_WRITE_FAILED",
  E_DB_READ_FAILED: "E_DB_READ_FAILED",
  E_DB_DELETE_FAILED: "E_DB_DELETE_FAILED",
  // 定位/地图
  E_GEO_NOT_SUPPORTED: "E_GEO_NOT_SUPPORTED",
  E_GEO_PERMISSION_DENIED: "E_GEO_PERMISSION_DENIED",
  E_GEO_TIMEOUT: "E_GEO_TIMEOUT",
  E_GEO_REVERSE_FAILED: "E_GEO_REVERSE_FAILED",
  // 导入导出
  E_IMPORT_FORMAT: "E_IMPORT_FORMAT",
  E_IMPORT_PARSE: "E_IMPORT_PARSE",
  E_EXPORT_NO_DATA: "E_EXPORT_NO_DATA",
  // 表单校验
  E_VALIDATION_PHONE: "E_VALIDATION_PHONE",
  E_VALIDATION_BRANCH: "E_VALIDATION_BRANCH",
  E_VALIDATION_DATE: "E_VALIDATION_DATE",
};

/** 错误码 → 用户提示映射 */
const ERROR_MESSAGES = {
  [ErrorCode.E_AUTH_INVALID]: "请输入姓名和工号",
  [ErrorCode.E_DB_OPEN_FAILED]: "浏览器不支持数据存储，请更换浏览器",
  [ErrorCode.E_DB_WRITE_FAILED]: "保存失败，请重试",
  [ErrorCode.E_DB_READ_FAILED]: "数据读取失败，请刷新页面",
  [ErrorCode.E_DB_DELETE_FAILED]: "删除失败，请重试",
  [ErrorCode.E_GEO_NOT_SUPPORTED]: "当前浏览器不支持定位功能",
  [ErrorCode.E_GEO_PERMISSION_DENIED]: "定位权限被拒绝，请手动输入地址",
  [ErrorCode.E_GEO_TIMEOUT]: "定位超时，请检查网络后重试",
  [ErrorCode.E_GEO_REVERSE_FAILED]: "地址解析失败，已填入坐标",
  [ErrorCode.E_IMPORT_FORMAT]: "文件格式不正确，请选择 .xlsx/.xls/.csv",
  [ErrorCode.E_IMPORT_PARSE]: "文件解析失败，请检查文件内容",
  [ErrorCode.E_EXPORT_NO_DATA]: "暂无可导出的记录",
  [ErrorCode.E_VALIDATION_PHONE]: "手机号格式不正确",
  [ErrorCode.E_VALIDATION_BRANCH]: "请选择网点",
  [ErrorCode.E_VALIDATION_DATE]: "请选择拜访日期",
};

/**
 * 创建标准错误结果
 * @param {string} code 错误码
 * @param {string} [detail] 技术细节
 * @returns {{ success: false, error: { code: string, message: string, detail?: string } }}
 */
export function createError(code, detail) {
  return {
    success: false,
    error: {
      code,
      message: ERROR_MESSAGES[code] || "未知错误",
      ...(detail ? { detail } : {}),
    },
  };
}

/**
 * 获取用户可读的错误消息
 * @param {string} code
 * @returns {string}
 */
export function getUserMessage(code) {
  return ERROR_MESSAGES[code] || "操作失败，请重试";
}
