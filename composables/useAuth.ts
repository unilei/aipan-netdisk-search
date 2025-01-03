export const useAuth = () => {
    const logout = () => {
        const token = useCookie('token');
        token.value = null;
        return navigateTo('/login');
    };

    return {
        logout
    };
}; 