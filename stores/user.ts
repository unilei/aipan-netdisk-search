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

interface UserSessionOptions {
    force?: boolean;
    maxAgeMs?: number;
    refreshInBackground?: boolean;
    clearOnFailure?: boolean;
}

const USER_SESSION_FRESHNESS_MS = 60 * 1000;
let pendingUserInfoRequest: Promise<boolean> | null = null;
let pendingUserInfoToken: string | null = null;
let lastUserInfoLoadedAt = 0;
let lastUserInfoToken: string | null = null;

const hasPointSnapshot = (user: UserState["user"]) => {
    return user?.points !== undefined && user?.points !== null;
};

const resetSessionCacheState = () => {
    pendingUserInfoRequest = null;
    pendingUserInfoToken = null;
    lastUserInfoLoadedAt = 0;
    lastUserInfoToken = null;
};

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
            pendingUserInfoRequest = null;
            pendingUserInfoToken = null;
            lastUserInfoToken = token;
            lastUserInfoLoadedAt = hasPointSnapshot(userData) ? Date.now() : 0;

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
            resetSessionCacheState();

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

        async refreshUserInfo(options: { clearOnFailure?: boolean } = {}) {
            const tokenCookie = useCookie('token');
            const requestToken = tokenCookie.value;
            const shouldClearOnFailure = options.clearOnFailure !== false;

            if (!requestToken) {
                if (shouldClearOnFailure) {
                    this.clearUser();
                }
                return false;
            }

            if (pendingUserInfoRequest && pendingUserInfoToken === requestToken) {
                return pendingUserInfoRequest;
            }

            pendingUserInfoToken = requestToken;
            pendingUserInfoRequest = $fetch('/api/user/info', {
                headers: {
                    'Authorization': `Bearer ${requestToken}`
                }
            })
                .then((res) => {
                    const response = res as UserResponse;

                    if (useCookie('token').value !== requestToken) {
                        return false;
                    }

                    if (response && response.code === 200 && response.data) {
                        this.$patch({
                            user: response.data,
                            token: requestToken,
                            isAuthenticated: true
                        });
                        lastUserInfoToken = requestToken;
                        lastUserInfoLoadedAt = Date.now();
                        return true;
                    }

                    if (shouldClearOnFailure) {
                        this.clearUser();
                    } else {
                        console.warn('Failed to refresh user info: Invalid response');
                    }
                    return false;
                })
                .catch((error) => {
                    console.error('Error refreshing user info:', error);
                    if (shouldClearOnFailure) {
                        this.clearUser();
                    }
                    return false;
                })
                .finally(() => {
                    if (pendingUserInfoToken === requestToken) {
                        pendingUserInfoRequest = null;
                        pendingUserInfoToken = null;
                    }
                });

            return pendingUserInfoRequest;
        },

        async ensureUserSession(options: UserSessionOptions = {}) {
            const tokenCookie = useCookie('token');
            const token = tokenCookie.value;

            if (!token) {
                if (this.isAuthenticated || this.token || this.user) {
                    this.clearUser();
                }
                return false;
            }

            const maxAgeMs = options.maxAgeMs ?? USER_SESSION_FRESHNESS_MS;
            const hasCachedSession =
                this.isAuthenticated &&
                this.token === token &&
                Boolean(this.user) &&
                hasPointSnapshot(this.user);
            const hasFreshSession =
                hasCachedSession &&
                lastUserInfoToken === token &&
                Date.now() - lastUserInfoLoadedAt <= maxAgeMs;

            if (hasCachedSession && !options.force) {
                if (
                    !hasFreshSession &&
                    options.refreshInBackground !== false &&
                    import.meta.client
                ) {
                    void this.refreshUserInfo({ clearOnFailure: false });
                }

                return true;
            }

            return this.refreshUserInfo({
                clearOnFailure: options.clearOnFailure !== false
            });
        },

        async fetchUser() {
            return this.refreshUserInfo({ clearOnFailure: true });
        },

        // 强制刷新用户信息（用于切换账号后）
        async forceRefreshUser() {
            return this.refreshUserInfo({ clearOnFailure: false });
        },

        // 安全的强制刷新方法（登录后使用，失败时不清除用户状态）
        async safeRefreshUser() {
            return this.refreshUserInfo({ clearOnFailure: false });
        }
    },

    persist: true
}); 
