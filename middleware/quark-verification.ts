// 检查网盘链接访问验证状态
export const checkQuarkVerification = () => {
  // 只在客户端执行
  if (typeof window === 'undefined') return false;
  
  const stored = window.localStorage.getItem('quark_access_verification');
  if (!stored) return false;
  
  try {
    const data = JSON.parse(stored);
    const now = Date.now();
    
    // 检查是否过期（每日23:59过期）
    const today = new Date();
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
    
    if (now >= todayEnd.getTime() || now < data.timestamp) {
      window.localStorage.removeItem('quark_access_verification');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('解析验证状态失败:', error);
    window.localStorage.removeItem('quark_access_verification');
    return false;
  }
};

// 网盘链接访问验证中间件（已废弃路径验证）
export default defineNuxtRouteMiddleware((to) => {
  // 此中间件已不再用于路径验证
  // 现在使用 checkQuarkVerification 函数进行网盘链接访问验证
  return;
});