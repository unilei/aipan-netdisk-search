import { simpleDecode } from '~/utils/index.js'
import { MUSIC_PAGE_PASSWORD } from '~/server/utils/constants'

export default defineNuxtRouteMiddleware((to, from) => {
    // Only check password for music page
    if (!to.path.startsWith('/music')) {
        return
    }

    // Don't check the auth page itself
    if (to.path === '/music/auth') {
        return
    }

    const musicAuth = useCookie('music-auth')

    // If no auth cookie, redirect to password page
    if (!musicAuth.value) {
        return navigateTo('/music/auth')
    }

    // Verify password
    const decoded = simpleDecode(musicAuth.value)
    if (!decoded || decoded !== MUSIC_PAGE_PASSWORD) {
        return navigateTo('/music/auth')
    }
}) 