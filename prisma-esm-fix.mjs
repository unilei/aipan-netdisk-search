/**
 * Prisma ES Module 修复脚本
 *
 * 这个脚本解决了在 ES Module 环境中使用 Prisma 时的 __dirname 问题
 * 在 Node.js 的 ES Module 中，__dirname 和 __filename 不可用
 * 这个脚本提供了一个全局的 polyfill
 */

import { fileURLToPath } from "url";
import { dirname } from "path";
import { createRequire } from "module";

// 为 ES Module 环境创建 __dirname 和 __filename 的 polyfill
if (typeof global.__filename === "undefined") {
  global.__filename = fileURLToPath(import.meta.url);
}

if (typeof global.__dirname === "undefined") {
  global.__dirname = dirname(global.__filename);
}

// 为 ES Module 环境创建 require 函数
if (typeof global.require === "undefined") {
  global.require = createRequire(import.meta.url);
}

console.log("[Prisma ESM Fix] 已加载 ES Module 环境修复");
