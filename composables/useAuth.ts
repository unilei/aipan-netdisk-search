import { useUserStore } from '~/stores/user';

export const useAuth = () => {
    const userStore = useUserStore();

    const logout = () => {
        userStore.clearUser();
        return navigateTo('/login');
    };

    return {
        logout
    };
}; 