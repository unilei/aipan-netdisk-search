<script setup>
definePageMeta({
  layout: "netdisk",
});

const RELEASE_SEEN_STORAGE_KEY = "aipan:last-seen-release";

const { data, pending, error, refresh } = await useFetch("/api/releases", {
  default: () => ({
    success: false,
    data: {
      notes: [],
      latest: null,
      latestIdentity: "",
      source: "static",
    },
  }),
});

const releaseNotes = computed(() => data.value?.data?.notes || []);
const latestReleaseNote = computed(() => data.value?.data?.latest || releaseNotes.value[0] || null);
const latestIdentity = computed(() => data.value?.data?.latestIdentity || "");

watch(
  latestIdentity,
  (identity) => {
    if (process.client && identity) {
      localStorage.setItem(RELEASE_SEEN_STORAGE_KEY, identity);
      window.dispatchEvent(new CustomEvent("aipan:release-seen", { detail: identity }));
    }
  },
  { immediate: true }
);

useHead({
  title: "发布日志 - AIPAN.ME",
  meta: [
    {
      name: "description",
      content:
        "查看 AIPAN.ME 最新功能发布、用户投稿自动审核、搜索体验和后台管理更新记录。",
    },
    {
      name: "keywords",
      content: "AIPAN.ME发布日志,功能更新,用户投稿,自动审核,ES搜索",
    },
  ],
});
</script>

<template>
  <main class="min-h-[calc(100vh-70px)] bg-[#f8fafc] pt-24 text-slate-950 dark:bg-slate-950 dark:text-white">
    <section class="mx-auto max-w-6xl px-4 pb-16">
      <div class="grid gap-6 border-b border-slate-200 pb-8 dark:border-white/10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-300">
            Release Notes
          </p>
          <h1 class="mt-3 text-4xl font-black tracking-tight md:text-5xl">网站发布日志</h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            这里记录爱盼近期上线的功能、体验优化和后台能力调整，方便你快速了解网站发生了哪些变化。
          </p>
        </div>
        <button
          class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200"
          :disabled="pending"
          @click="refresh()"
        >
          <i class="fa-solid fa-rotate-right mr-2"></i>
          刷新
        </button>
      </div>

      <div v-if="pending" class="mt-8 space-y-4">
        <div v-for="item in 3" :key="item" class="h-36 animate-pulse rounded-xl bg-white shadow-sm dark:bg-white/10"></div>
      </div>

      <div
        v-else-if="error"
        class="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-400/30 dark:bg-red-950/30 dark:text-red-200"
      >
        <p class="font-bold">发布日志加载失败</p>
        <p class="mt-1 text-sm">请稍后刷新页面重试。</p>
      </div>

      <div v-else-if="releaseNotes.length === 0" class="mt-8 rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/10">
        <i class="fa-solid fa-bullhorn text-3xl text-slate-400"></i>
        <p class="mt-4 text-lg font-bold">暂无发布日志</p>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">后台发布后会显示在这里。</p>
      </div>

      <template v-else>
        <section
          v-if="latestReleaseNote"
          class="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/10"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">最新发布</span>
              <span
                v-if="latestReleaseNote.isImportant"
                class="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-400/20 dark:text-amber-200"
              >
                重要更新
              </span>
            </div>
            <span class="text-sm text-slate-500 dark:text-slate-400">{{ latestReleaseNote.date }}</span>
          </div>
          <h2 class="mt-4 text-2xl font-black">{{ latestReleaseNote.title }}</h2>
          <p class="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ latestReleaseNote.summary }}</p>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/40">
              <p class="text-xs text-slate-500 dark:text-slate-400">版本</p>
              <p class="mt-1 font-bold">{{ latestReleaseNote.version }}</p>
            </div>
            <div class="rounded-lg bg-slate-50 p-4 dark:bg-slate-950/40">
              <p class="text-xs text-slate-500 dark:text-slate-400">分类</p>
              <p class="mt-1 font-bold">{{ latestReleaseNote.category }}</p>
            </div>
          </div>
        </section>

        <section class="mt-8 space-y-4">
          <article
            v-for="note in releaseNotes"
            :key="note.version"
            class="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:hover:border-blue-300/40 md:grid-cols-[170px_1fr]"
          >
            <div class="flex flex-row items-center justify-between gap-3 md:flex-col md:items-start md:justify-start">
              <div>
                <p class="text-sm font-semibold text-slate-500 dark:text-slate-400">{{ note.date }}</p>
                <p class="mt-1 text-lg font-black">{{ note.version }}</p>
              </div>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                {{ note.category }}
              </span>
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-2xl font-black tracking-tight">{{ note.title }}</h2>
                <span
                  v-if="note.isImportant"
                  class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-400/20 dark:text-amber-200"
                >
                  重要
                </span>
              </div>
              <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ note.summary }}</p>
              <ul class="mt-5 grid gap-3 md:grid-cols-2">
                <li
                  v-for="highlight in note.highlights"
                  :key="highlight"
                  class="flex gap-3 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                >
                  <i class="fa-solid fa-check mt-1 text-emerald-500"></i>
                  <span>{{ highlight }}</span>
                </li>
              </ul>
            </div>
          </article>
        </section>
      </template>
    </section>
  </main>
</template>
