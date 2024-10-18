<script setup>
const error = useError()

</script>
<template>
    <div class="text-center bg-gray-100 flex flex-col items-center justify-center min-h-screen">
        <h1 class="text-9xl font-bold text-gray-600">{{ error.statusCode }}</h1>
        <p class="mt-4 text-2xl text-gray-700">{{ error.message }}</p>

        <a href="/"
            class="mt-6 inline-block px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition duration-300">返回首页</a>
    </div>
</template>
