import { defineStore } from 'pinia';

interface PointsBreakdown {
    permanentPoints: number;
    temporaryPoints: number;
    effectivePoints: number;
    nextExpiringAt?: string | Date | null;
}

export interface UserState {
    isAuthenticated: boolean;
    token: string | null;
    user: {
        id?: number;
        username?: string;
        email?: string;
        role?: string;
        avatarStyle?: string;
        points?: number;
        permanentPoints?: number;
        temporaryPoints?: number;
        effectivePoints?: number;
        nextExpiringAt?: string | Date | null;
        pointsBreakdown?: PointsBreakdown;
        isVerified?: boolean;
        emailVerificationRequired?: boolean;
    } | null;
}

interface UserResponse {
    code: number;
    msg: string;
    data?: {
        id: number;
        username: string;
        email: string;
        role: string;
        avatarStyle?: string;
        points?: number;
        permanentPoints?: number;
        temporaryPoints?: number;
        effectivePoints?: number;
        nextExpiringAt?: string | Date | null;
        pointsBreakdown?: PointsBreakdown;
        isVerified?: boolean;
        emailVerificationRequired?: boolean;
    };
    error?: unknown;
}

export const useUserStore = defineStore('user', {
    state: (): UserState => ({
        isAuthenticated: false,
        token: null,
        user: null,
    }),

    getters: {
        loggedIn: (state) => state.isAuthenticated,
        isAdmin: (state) => state.user?.role === 'admin',
        userAvatar: (state) => {
            if (!state.user?.username) return '';
            return `https://api.dicebear.com/7.x/${state.user?.avatarStyle || 'avataaars'}/svg?seed=${encodeURIComponent(state.user.username)}`;
        }
    },

    actions: {
        setUser(userData: any, token: string) {
            // 先清除旧数据，确保完全替换
            this.clearUser();

            // 设置新的用户数据
            this.user = userData;
            this.token = token;
            this.isAuthenticated = true;
            const tokenCookie = useCookie('token');
            tokenCookie.value = token;

            // 强制触发持久化存储更新
            this.$patch({
                user: userData,
                token: token,
                isAuthenticated: true
            });
        },

        clearUser() {
            // 清除状态
            this.user = null;
            this.token = null;
            this.isAuthenticated = false;

            // 清除cookie
            const tokenCookie = useCookie('token');
            tokenCookie.value = null;

            // 强制清除持久化存储
            this.$patch({
                user: null,
                token: null,
                isAuthenticated: false
            });

            // 清除浏览器存储（作为备用）
            if (import.meta.client) {
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
            }
        },

        async fetchUser() {
            try {
                const tokenCookie = useCookie('token');
                if (!tokenCookie.value) {
                    this.clearUser();
                    return;
                }

                const res = await $fetch<UserResponse>('/api/user/info', {
                    headers: {
                        'Authorization': `Bearer ${tokenCookie.value}`
                    }
                });

                if (res && res.code === 200 && res.data) {
                    // 强制更新用户信息
                    this.$patch({
                        user: res.data,
                        token: tokenCookie.value,
                        isAuthenticated: true
                    });
                } else {
                    this.clearUser();
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                this.clearUser();
            }
        },

        // 强制刷新用户信息（用于切换账号后）
        async forceRefreshUser() {
            const tokenCookie = useCookie('token');
            if (!tokenCookie.value) {
                this.clearUser();
                return false;
            }

            try {
                const res = await $fetch<UserResponse>('/api/user/info', {
                    headers: {
                        'Authorization': `Bearer ${tokenCookie.value}`
                    }
                });

                if (res && res.code === 200 && res.data) {
                    // 只更新用户数据，不清除token
                    this.$patch({
                        user: res.data,
                        isAuthenticated: true
                    });
                    return true;
                } else {
                    console.warn('Failed to refresh user info: Invalid response');
                    return false;
                }
            } catch (error) {
                console.error('Error force refreshing user info:', error);
                return false;
            }
        },

        // 安全的强制刷新方法（登录后使用，失败时不清除用户状态）
        async safeRefreshUser() {
            const tokenCookie = useCookie('token');
            if (!tokenCookie.value) {
                return false;
            }

            try {
                const res = await $fetch<UserResponse>('/api/user/info', {
                    headers: {
                        'Authorization': `Bearer ${tokenCookie.value}`
                    }
                });

                if (res && res.code === 200 && res.data) {
                    // 只更新用户数据，保持认证状态
                    this.user = res.data;
                    return true;
                } else {
                    console.warn('Failed to refresh user info: Invalid response');
                    return false;
                }
            } catch (error) {
                console.error('Error refreshing user info:', error);
                return false;
            }
        }
    },

    persist: true
}); 
