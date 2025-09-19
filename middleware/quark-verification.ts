export default defineNuxtRouteMiddleware((to) => {
  // 只在客户端执行
  if (process.server) return;
  
  // 只对指定页面进行验证
  const protectedRoutes = ['/search', '/ai-search'];
  if (!protectedRoutes.includes(to.path)) return;
  
  // 检查localStorage中的验证状态
  if (typeof window === 'undefined') return;
  
  const stored = window.localStorage.getItem('quark_access_verification');
  if (!stored) {
    // 构建重定向URL，保留原始URL的所有参数
    const redirectUrl = `/quark-verification?redirect=${encodeURIComponent(to.fullPath)}`;
    return navigateTo(redirectUrl);
  }
  
  try {
    const data = JSON.parse(stored);
    const now = Date.now();
    
    // 检查是否过期（24小时）
    if (now - data.timestamp > 24 * 60 * 60 * 1000) {
      window.localStorage.removeItem('quark_access_verification');
      // 构建重定向URL，保留原始URL的所有参数
      const redirectUrl = `/quark-verification?redirect=${encodeURIComponent(to.fullPath)}`;
      return navigateTo(redirectUrl);
    }
    
    // 验证状态有效，允许访问
  } catch (error) {
    console.error('解析验证状态失败:', error);
    window.localStorage.removeItem('quark_access_verification');
    // 构建重定向URL，保留原始URL的所有参数
    const redirectUrl = `/quark-verification?redirect=${encodeURIComponent(to.fullPath)}`;
    return navigateTo(redirectUrl);
  }
});