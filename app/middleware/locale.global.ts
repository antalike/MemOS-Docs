export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (import.meta.server) {
    return
  }

  if (to.path === from.path) {
    return
  }

  const { locale } = useNuxtApp().$i18n

  if (locale.value === 'en' && to.path.startsWith('/cn')) {
    console.log('navigateTo', 'en', locale.value, to.path, from.path)
    return navigateTo(to.path.replace('/cn', ''))
  }

  if (locale.value === 'cn' && !to.path.startsWith('/cn')) {
    console.log('navigateTo', 'cn', locale.value, to.path, from.path)
    return navigateTo(`/${locale.value}${to.path}`)
  }
})
