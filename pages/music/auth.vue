<template>
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
        <div class="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
            <div class="flex flex-row items-center justify-center gap-3 mb-8">
                <a href="/">
                    <img class="w-[40px] h-[40px]" src="@/assets/my-logo.png" alt="logo" />
                </a>
                <h1 class="text-2xl font-bold text-center">音乐搜索验证</h1>
            </div>

            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">请输入访问密码</label>
                    <input type="password" v-model="password" @keyup.enter="handleSubmit"
                        class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="请输入密码" />
                </div>

                <div v-if="error" class="text-red-500 text-sm">
                    {{ error }}
                </div>

                <button @click="handleSubmit"
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                    验证
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { MUSIC_PAGE_PASSWORD } from '~/server/utils/constants'
import { simpleEncode } from "~/utils/index.js"

const password = ref('')
const error = ref('')

const handleSubmit = () => {
    if (!password.value) {
        error.value = '请输入密码'
        return
    }

    if (password.value !== MUSIC_PAGE_PASSWORD) {
        error.value = '密码错误'
        return
    }

    // Set encoded password in cookie
    const musicAuth = useCookie('music-auth')
    musicAuth.value = simpleEncode(password.value)

    // Redirect to music page
    navigateTo('/music')
}
</script>