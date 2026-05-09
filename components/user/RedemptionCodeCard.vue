<template>
  <article class="flex min-h-[220px] flex-col rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-emerald-700">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-4">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xl text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200">
          <i class="fa-solid fa-ticket"></i>
        </div>
        <div class="min-w-0">
          <h3 class="m-0 text-base font-semibold leading-6 text-gray-950 dark:text-white">兑换码</h3>
          <p class="m-0 mt-1 max-w-[360px] text-sm leading-6 text-gray-500 dark:text-gray-400">
            输入活动兑换码，成功后积分会自动进入账号。
          </p>
        </div>
      </div>
      <span class="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
        可兑换
      </span>
    </div>

    <form class="mt-auto flex flex-col gap-3 pt-5" @submit.prevent="redeemCode">
      <label class="sr-only" for="redemption-code-input">兑换码</label>
      <input
        id="redemption-code-input"
        v-model="code"
        class="min-h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm tracking-normal text-gray-950 outline-none transition-colors placeholder:font-sans placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900/40"
        :disabled="redeeming"
        maxlength="64"
        autocomplete="off"
        placeholder="输入兑换码"
        @input="normalizeCodeInput"
      />
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-sm leading-6 text-gray-500 dark:text-gray-400">
          兑换码不区分大小写，兑换后不可重复使用。
        </div>
        <button
          class="inline-flex min-h-10 min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          :disabled="redeeming || !normalizedCode"
        >
          <i :class="redeeming ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'"></i>
          {{ redeeming ? '兑换中' : '立即兑换' }}
        </button>
      </div>
    </form>
  </article>
</template>

<script setup>
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";

const emit = defineEmits(["redeemed"]);

const code = ref("");
const redeeming = ref(false);
const normalizedCode = computed(() =>
  String(code.value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, ""),
);

const normalizeCodeInput = () => {
  code.value = String(code.value || "").toUpperCase();
};

const redeemCode = async () => {
  if (!normalizedCode.value || redeeming.value) return;

  redeeming.value = true;
  try {
    const response = await $fetch("/api/user/points/redemption-codes/redeem", {
      method: "POST",
      body: {
        code: code.value,
      },
      headers: {
        Authorization: `Bearer ${useCookie("token").value}`,
      },
    });

    if (response.code === 200 && response.data?.granted) {
      const points = Number(response.data.points || 0);
      ElMessage.success(`兑换成功，获得 ${points} 积分`);
      code.value = "";
      emit("redeemed", response.data);
      return;
    }

    ElMessage.info(response.msg || "兑换码暂不可用");
  } catch (error) {
    ElMessage.error(error?.data?.message || "兑换失败，请检查兑换码");
  } finally {
    redeeming.value = false;
  }
};
</script>
