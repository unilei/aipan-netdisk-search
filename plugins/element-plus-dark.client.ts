export default defineNuxtPlugin((nuxtApp) => {
  const colorMode = useColorMode()

  // 监听颜色模式变化，同步到 html 元素的 class
  watch(
    () => colorMode.value,
    (newMode) => {
      if (process.client) {
        const html = document.documentElement
        if (newMode === 'dark') {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
      }
    },
    { immediate: true }
  )

  // 初始化时设置
  if (process.client) {
    const html = document.documentElement
    if (colorMode.value === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }
})
