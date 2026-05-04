export default defineNuxtPlugin(() => {
  const route = useRoute()

  useHead({
    link: computed(() => [
      { rel: 'canonical', href: `https://www.aipan.me${route.path}` }
    ])
  })
})
