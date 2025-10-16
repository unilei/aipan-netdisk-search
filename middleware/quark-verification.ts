// 检查网盘链接访问验证状态
export const checkQuarkVerification = async () => {
  // 只在客户端执行
  if (typeof window === 'undefined') return false;
  
  const stored = window.localStorage.getItem('quark_access_verification');
  if (!stored) return false;
  
  try {
    const data = JSON.parse(stored);
    const now = Date.now();
    
    // 获取配置的访问时长
    let accessDurationMinutes = 1440; // 默认24小时
    try {
      const configRes = await $fetch('/api/quark/setting') as any;
      if (configRes?.data?.accessDurationMinutes) {
        accessDurationMinutes = Number(configRes.data.accessDurationMinutes);
      }
    } catch (error) {
      console.warn('获取访问时长配置失败，使用默认值:', error);
    }
    
    // 判断使用哪种过期模式
    if (accessDurationMinutes === 1440) {
      // 默认24小时：使用每日过期模式（当天23:59过期）
      const today = new Date();
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0, 0, 0);
      
      if (now >= todayEnd.getTime() || now < data.timestamp) {
        window.localStorage.removeItem('quark_access_verification');
        return false;
      }
    } else {
      // 自定义时长：使用精确的分钟计算
      const expirationTime = data.timestamp + (accessDurationMinutes * 60 * 1000);
      
      if (now >= expirationTime || now < data.timestamp) {
        window.localStorage.removeItem('quark_access_verification');
        return false;
      }
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