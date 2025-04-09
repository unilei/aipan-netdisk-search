// 处理Socket.IO请求的中间件
export default defineEventHandler((event) => {
  // 检查请求是否是Socket.IO请求
  const url = getRequestURL(event)
  
  // 如果是WebSocket升级请求或Socket.IO请求，直接通过
  if (url.pathname.startsWith('/api/socket.io') || 
      event.node.req.headers.upgrade === 'websocket') {
    // 这是一个Socket.IO请求或WebSocket升级请求，让它通过
    return
  }
})
