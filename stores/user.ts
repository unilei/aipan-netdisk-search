import { defineStore } from 'pinia';

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
            this.user = userData;
            this.token = token;
            this.isAuthenticated = true;
            const tokenCookie = useCookie('token');
            tokenCookie.value = token;
        },

        clearUser() {
            this.user = null;
            this.token = null;
            this.isAuthenticated = false;
            const tokenCookie = useCookie('token');
            tokenCookie.value = null;
        },

        async fetchUser() {
            try {
                const tokenCookie = useCookie('token');
                if (!tokenCookie.value) {
                    this.isAuthenticated = false;
                    return;
                }

                const res = await $fetch<UserResponse>('/api/user/info', {
                    headers: {
                        'Authorization': `Bearer ${tokenCookie.value}`
                    }
                });

                if (res && res.code === 200 && res.data) {
                    this.user = res.data;
                    this.token = tokenCookie.value;
                    this.isAuthenticated = true;
                } else {
                    this.clearUser();
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                this.clearUser();
            }
        }
    },

    persist: true
}); 