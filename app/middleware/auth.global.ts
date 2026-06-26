import { storeToRefs } from 'pinia'
import { hydrateAccessToken } from '~/utils/authToken'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  const {
    authenticated,
    currentUser,
    profileLoaded,
    menus,
  } = storeToRefs(authStore)

  const token = hydrateAccessToken()

  if (token.value) {
    authenticated.value = true

    if (!profileLoaded.value || !currentUser.value) {
      try {
        await authStore.fetchMe()
      } catch {
        return navigateTo('/login')
      }
    }
  }

  // Not found route
  if (!to.matched.length && to.name !== 'not-found') {
    return navigateTo('/not-found')
  }

  // Not logged in
  if (!token.value && to.name !== 'login' && to.name !== 'not-found') {
    return navigateTo('/login')
  }

  const allowedPaths = menus.value.map((m) => m.path)

  const firstAllowedRoute =
    allowedPaths.find((path) => path !== '/') ||
    allowedPaths[0]

  // Logged in and trying to access login page
  if (token.value && to.name === 'login') {
    return navigateTo(firstAllowedRoute || '/not-found')
  }

  if (token.value && to.path === '/') {
    const hasHomeAccess = allowedPaths.includes('/')

    if (!hasHomeAccess) {
      return navigateTo(firstAllowedRoute || '/not-found')
    }

    return
  }

  // Route permission check
  if (token.value && to.name !== 'login' && to.name !== 'not-found') {
    const canAccess = allowedPaths.some((path) => {
      return to.path === path || to.path.startsWith(path + '/')
    })

    if (!canAccess) {
      return navigateTo('/not-found')
    }
  }
})