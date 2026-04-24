<script setup>
import { latestReleaseNote, releaseNotes } from "~/utils/releaseNotes.js";

definePageMeta({
  layout: "netdisk",
});

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
  <main class="min-h-[calc(100vh-70px)] overflow-hidden bg-[#f6f2e8] pt-24 text-slate-950 dark:bg-slate-950 dark:text-white">
    <section class="relative mx-auto max-w-6xl px-4 pb-16">
      <div class="absolute -right-24 top-8 h-72 w-72 rounded-full bg-amber-300/40 blur-3xl dark:bg-cyan-500/20"></div>
      <div class="absolute -left-16 top-52 h-64 w-64 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-500/20"></div>

      <div class="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
        <div>
          <p class="mb-4 inline-flex rounded-full border border-slate-900/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-slate-300">
            Release Notes
          </p>
          <h1 class="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            网站发布日志
          </h1>
          <p class="mt-5 max-w-2xl text-base leading-8 text-slate-700 dark:text-slate-300 md:text-lg">
            这里记录爱盼近期新增的功能、后台能力和搜索体验变化。你可以快速了解哪些功能已经上线，以及这些更新对用户投稿、搜索和通知流程的影响。
          </p>
        </div>

        <div class="rounded-[2rem] border border-slate-900/10 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20 dark:border-white/10 dark:bg-white/10">
          <div class="flex items-center justify-between gap-4">
            <span class="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-slate-950">
              最新发布
            </span>
            <span class="text-sm text-slate-300">{{ latestReleaseNote.date }}</span>
          </div>
          <h2 class="mt-5 text-2xl font-black">{{ latestReleaseNote.title }}</h2>
          <p class="mt-3 text-sm leading-7 text-slate-300">{{ latestReleaseNote.summary }}</p>
          <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-2xl bg-white/10 p-4">
              <p class="text-slate-400">版本</p>
              <p class="mt-1 font-bold">{{ latestReleaseNote.version }}</p>
            </div>
            <div class="rounded-2xl bg-white/10 p-4">
              <p class="text-slate-400">分类</p>
              <p class="mt-1 font-bold">{{ latestReleaseNote.category }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="relative mt-12 space-y-5">
        <article
          v-for="(note, index) in releaseNotes"
          :key="note.version"
          class="group grid gap-5 rounded-[1.75rem] border border-slate-900/10 bg-white/80 p-5 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/10 md:grid-cols-[180px_1fr]"
        >
          <div class="flex flex-row items-center justify-between gap-3 md:flex-col md:items-start md:justify-start">
            <div>
              <p class="text-sm font-bold text-slate-500 dark:text-slate-400">{{ note.date }}</p>
              <p class="mt-1 text-lg font-black">{{ note.version }}</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              :class="index === 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'"
            >
              {{ note.category }}
            </span>
          </div>

          <div>
            <h2 class="text-2xl font-black tracking-tight">{{ note.title }}</h2>
            <p class="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{{ note.summary }}</p>
            <ul class="mt-5 grid gap-3 md:grid-cols-2">
              <li
                v-for="highlight in note.highlights"
                :key="highlight"
                class="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
              >
                <i class="fa-solid fa-check mt-1 text-emerald-500"></i>
                <span>{{ highlight }}</span>
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
