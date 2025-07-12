import type { ApiResponse, UserInfo } from "~/types/api";

export default defineNuxtRouteMiddleware(async (to) => {
    // 确保在客户端执行
    if (process.server) {
        return;
    }

    const token = useCookie("token");

    // 检查是否有token
    if (!token.value) {
        return navigateTo("/login");
    }

    try {
        // 通过API验证token和用户角色
        const response = await $fetch<ApiResponse<UserInfo>>('/api/user/info', {
            headers: {
                'Authorization': `Bearer ${token.value}`
            }
        });

        if (!response || response.code !== 200) {
            console.error('Admin middleware error:', response?.msg || 'Unknown error');
            return navigateTo("/login");
        }

        return navigateTo("/drama");
    } catch (error: any) {
        console.error('Admin middleware error:', error?.message || error);
        return navigateTo("/login");
    }
});