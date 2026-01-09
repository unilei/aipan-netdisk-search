import { simpleDecode } from '~/utils/index.js'
export default defineNuxtRouteMiddleware(async (to, from) => {
    // Only check password for music page
    if (!to.path.startsWith('/music')) {
        return
    }

    // Don't check the auth page itself
    if (to.path === '/music/auth') {
        return
    }

    try {
        // Get current password and enabled status from database
        const response = await $fetch('/api/music/password')
        const { password: currentPassword, enabled } = (response as any).data || {}

        // If music verification is disabled, skip authentication
        if (!enabled) {
            return
        }

        const musicAuth = useCookie('music-auth')

        // If no auth cookie, redirect to password page
        if (!musicAuth.value) {
            return navigateTo('/music/auth')
        }

        // Verify password
        const decoded = simpleDecode(musicAuth.value)
        if (!decoded || decoded !== (currentPassword || 'aipan.me2026')) {
            return navigateTo('/music/auth')
        }
    } catch (error) {
        console.error('Failed to verify music password:', error)
        return navigateTo('/music/auth')
    }
})