<script setup>
import { format } from "date-fns";

useSeoMeta({
  title: "AIPAN博客 - 技术分享与生活感悟平台 | 编程技术·开发经验·生活随笔",
  description:
    "AIPAN博客是一个优质的内容分享平台，汇聚技术文章、编程教程、开发经验、生活感悟等多样化内容。用户可以在这里发布博客文章，分享知识和见解，与社区成员交流学习。",
  keywords: "AIPAN博客,技术博客,编程教程,开发经验,技术分享,生活感悟,博客平台,内容创作,知识分享",
  ogTitle: "AIPAN博客 - 技术分享与生活感悟平台",
  ogDescription: "AIPAN博客汇聚技术文章、编程教程、开发经验、生活感悟等优质内容，与社区成员交流学习。",
  twitterTitle: "AIPAN博客 - 技术分享与生活感悟平台",
  twitterDescription: "优质内容分享平台！技术文章、编程教程、开发经验、生活感悟，与社区交流学习！",
});

useHead({
  meta: [
    {
      name: "keywords",
      content: "AIPAN博客,技术博客,编程教程,开发经验,技术分享,生活感悟",
    },
    { property: "og:type", content: "website" },
    { property: "og:title", content: "AIPAN.ME 博客 - 分享技术、生活和见解" },
    {
      property: "og:description",
      content:
        "爱盼博客是一个分享技术、生活和见解的平台。在这里，你可以找到关于编程、技术趋势、生活感悟等多样化的优质内容。",
    },
    { property: "og:image", content: "https://www.aipan.me/default-og-image.png" },
    { property: "og:url", content: "https://www.aipan.me/blog" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "AIPAN.ME 博客 - 分享技术、生活和见解" },
    {
      name: "twitter:description",
      content:
        "爱盼博客是一个分享技术、生活和见解的平台。在这里，你可以找到关于编程、技术趋势、生活感悟等多样化的优质内容。",
    },
    { name: "twitter:image", content: "https://www.aipan.me/default-og-image.png" },
    { name: "robots", content: "index,follow" },
    { name: "author", content: "AIPAN.ME" },
  ],
  link: [{ rel: "canonical", href: "https://www.aipan.me/blog" }],
  script: [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "AIPAN.ME 博客",
        description: "爱盼博客是一个分享技术、生活和见解的平台。",
        url: "https://www.aipan.me/blog",
        publisher: {
          "@type": "Organization",
          name: "AIPAN.ME",
          logo: {
            "@type": "ImageObject",
            url: "https://www.aipan.me/logo.png",
          },
        },
      }),
    },
  ],
});

const page = ref(1);
const pageSize = ref(12);
const categoryId = ref(undefined);

const buildPostsQuery = () => {
  const queryJson = {
    page: page.value,
    pageSize: pageSize.value,
  };

  if (categoryId.value) {
    queryJson.categoryId = categoryId.value;
  }

  return queryJson;
};

const { data: categoriesResponse } = await useAsyncData("blog-categories", async () => {
  return await $fetch("/api/blog/category/get", {
    method: "GET",
  });
});

const categoriesData = computed(() => categoriesResponse.value?.data || []);

const {
  data: postsResponse,
  pending: loading,
} = await useAsyncData(
  "blog-posts",
  async () => {
    return await $fetch("/api/blog/posts/get", {
      method: "GET",
      query: buildPostsQuery(),
    });
  },
  {
    watch: [page, pageSize, categoryId],
  }
);

const postsData = computed(() => postsResponse.value?.posts || []);
const totalCount = computed(() => postsResponse.value?.totalCount || 0);
const selectedCategoryName = computed(() => {
  if (!categoryId.value) return "全部文章";
  return categoriesData.value.find((category) => category.id === categoryId.value)?.name || "当前分类";
});

const formatDate = (date) => {
  if (!date) return "";

  try {
    return format(new Date(date), "yyyy-MM-dd");
  } catch (_) {
    return "";
  }
};

const getCategoryNames = (post) => {
  return post?.categories?.map((item) => item.category?.name).filter(Boolean) || [];
};

const stripMarkdown = (content) => {
  if (!content) return "";

  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_~`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getExcerpt = (content, length = 96) => {
  const text = stripMarkdown(content);

  if (!text) return "这篇文章暂时没有摘要，点击阅读全文。";
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

const getReadingMinutes = (content) => {
  const text = stripMarkdown(content);
  if (!text) return 1;

  const cjkChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const words = text.match(/[A-Za-z0-9]+/g)?.length || 0;
  return Math.max(1, Math.ceil((cjkChars + words) / 400));
};

const normalizeImageUrl = (url) => {
  if (!url) return "";

  const value = url.trim();
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/") || /^https?:\/\//i.test(value)) return value;
  return "";
};

const getContentImageUrl = (content) => {
  if (!content) return "";

  const markdownImage = content.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/);
  if (markdownImage?.[1]) {
    return normalizeImageUrl(markdownImage[1]);
  }

  const htmlImage = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlImage?.[1]) {
    return normalizeImageUrl(htmlImage[1]);
  }

  return "";
};

const getFallbackThumbnailUrl = (post) => {
  const seed = encodeURIComponent(String(post?.slug || post?.id || "aipan-blog"));
  return `https://picsum.photos/seed/${seed}/640/360`;
};

const getThumbnailUrl = (post) => {
  return getContentImageUrl(post?.content) || getFallbackThumbnailUrl(post);
};

const handleThumbnailError = (event, post) => {
  if (event.target.dataset.fallbackApplied === "true") return;
  event.target.dataset.fallbackApplied = "true";
  event.target.src = getFallbackThumbnailUrl(post);
};

const handleCurrentChange = (val) => {
  page.value = val;
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  page.value = 1;
};

const handleSelectCategory = (val) => {
  categoryId.value = val;
  page.value = 1;
};
</script>

<template>
  <main class="min-h-[calc(100vh-140px)] bg-[#f8fafc] text-slate-950 dark:bg-slate-950 dark:text-white">
    <section class="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            class="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="[
              categoryId === undefined
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-600 hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300',
            ]"
            @click="handleSelectCategory(undefined)"
          >
            全部文章
          </button>
          <button
            v-for="category in categoriesData"
            :key="category.id"
            class="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="[
              categoryId === category.id
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-600 hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300',
            ]"
            @click="handleSelectCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>

        <div class="flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span>{{ selectedCategoryName }} · {{ totalCount }} 篇</span>
          <NuxtLink
            to="/user/posts/list"
            class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            <i class="fa-solid fa-pen-to-square mr-1.5"></i>
            写文章
          </NuxtLink>
        </div>
      </div>

      <div v-if="loading" class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="item in 6"
          :key="item"
          class="h-56 animate-pulse rounded-lg bg-white dark:bg-white/10"
        ></div>
      </div>

      <div v-else-if="postsData.length === 0" class="mt-8 rounded-lg bg-white p-10 text-center dark:bg-white/10">
        <i class="fa-regular fa-file-lines text-3xl text-slate-300 dark:text-slate-600"></i>
        <h2 class="mt-4 text-base font-semibold text-slate-900 dark:text-white">暂无文章</h2>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">该分类下还没有发布内容。</p>
      </div>

      <div v-else class="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="post in postsData"
          :key="post.id"
          :to="`/blog/${post.slug}`"
          class="group overflow-hidden rounded-lg bg-white transition hover:-translate-y-0.5 dark:bg-white/10"
        >
          <article class="flex h-full flex-col">
            <div class="aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-900/60">
              <img
                :src="getThumbnailUrl(post)"
                :alt="post.title"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                loading="lazy"
                @error="handleThumbnailError($event, post)"
              />
            </div>

            <div class="flex flex-1 flex-col p-4">
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="category in getCategoryNames(post).slice(0, 2)"
                  :key="category"
                  class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300"
                >
                  {{ category }}
                </span>
              </div>

              <h2 class="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-950 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-300">
                {{ post.title }}
              </h2>
              <p class="mt-2 line-clamp-3 flex-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {{ getExcerpt(post.content, 88) }}
              </p>

              <div class="mt-4 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                <span>{{ formatDate(post.createdAt) }}</span>
                <span>{{ getReadingMinutes(post.content) }} 分钟阅读</span>
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>

      <div v-if="!loading && totalCount > 0" class="mt-8 flex justify-center">
        <div class="rounded-lg bg-white/70 p-2 dark:bg-white/10">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[12, 24, 36]"
            :background="true"
            layout="prev, pager, next, sizes"
            :total="totalCount"
            class="pagination-custom"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled).is-active) {
  background: rgb(37 99 235);
  border-color: rgb(37 99 235);
  color: white;
}

:deep(.el-pagination.is-background .el-pager li) {
  border-radius: 8px;
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  border-radius: 8px;
}

@media (max-width: 640px) {
  :deep(.el-pagination__sizes) {
    display: none;
  }
}
</style>
