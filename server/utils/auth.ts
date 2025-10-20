/**
 * 验证管理员权限
 * @param event - Nuxt 事件对象
 * @returns 返回管理员用户信息
 * @throws 如果用户未登录或不是管理员，抛出错误
 */
export async function requireAdmin(event: any) {
  const user = event.context.user;
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '请先登录'
    });
  }
  
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: '需要管理员权限'
    });
  }
  
  return user;
}

/**
 * 验证用户已登录
 * @param event - Nuxt 事件对象
 * @returns 返回用户信息
 * @throws 如果用户未登录，抛出错误
 */
export async function requireAuth(event: any) {
  const user = event.context.user;
  
  if (!user || !user.userId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '请先登录'
    });
  }
  
  return user;
}
