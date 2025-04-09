// 处理所有Socket.IO请求的API路由
export default defineEventHandler((event) => {
  // 这个路由会捕获所有 /api/socket.io/* 请求
  // Socket.IO服务器会自动处理这些请求，所以这里不需要做任何事情
  return
})
