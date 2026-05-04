import { useUserStore } from '~/stores/user';
import { useCookie } from '#imports';
import { computed } from 'vue';

export const useAuth = () => {
    const userStore = useUserStore();

    const logout = () => {
        userStore.clearUser();
        return navigateTo('/login');
    };

    const getToken = () => {
        return useCookie('token').value;
    };

    const user = computed(() => {
        return userStore.user;
    });

    return {
        logout,
        getToken,
        user
    };
};