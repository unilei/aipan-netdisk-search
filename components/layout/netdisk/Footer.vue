<script setup>
const router = useRouter();
const donate = () => {
  router.push({ path: "/donate" });
};
</script>
<template>
  <div class="bg-gray-50 dark:text-white py-4 dark:bg-slate-800 space-y-1">
    <div class="flex flex-row items-center justify-center gap-3">
      <client-only>
        <a class="" href="https://github.com/unilei/aipan-netdisk-search">
          <img
            class="w-8 h-8"
            src="@/assets/skill-icons--github-dark.svg"
            alt="github"
          />
        </a>
        <el-button link color="#ffffff" @click="donate()">
          <img class="w-8 h-8" src="@/assets/donation/dashang.svg" alt="打赏" />
        </el-button>
      </client-only>
    </div>
    <p class="text-center text-sm">
      © 2024 AIPAN.ME 爱盼 - 资源随心，娱乐无限
    </p>
    <p class="text-center text-sm">
      声明：本站内容皆来自网络公开资源。本站不储存、复制、传播任何文件，不做任何盈利，仅作个人公益学习，请勿非法&商业传播，如有侵权，请及时
      <a
        class="text-blue-500 underline"
        href="mailto:ahagwybwqs@gmail.com"
        title="点击留言"
      >
        留言
      </a>
      告知删除。
    </p>
  </div>
</template>
<style scoped></style>
