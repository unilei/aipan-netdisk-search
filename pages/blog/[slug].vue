<script setup>
import { marked } from "marked";
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from "vue";
import { format } from "date-fns";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { sanitizeHtml } from "~/utils/sanitize";

const route = useRoute();
const slug = computed(() => String(route.params.slug || ""));
const mounted = ref(false);
const showToc = ref(false);
const activeHeading = ref("");
const headings = ref([]);
const showShareMenu = ref(false);
const copySuccess = ref(false);

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  langPrefix: "hljs language-",
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (__) { }
    }
    return hljs.highlightAuto(code).value;
  },
});

const { data: blog, pending: loading } = await useAsyncData(
  "blog-detail",
  async () => {
    if (!slug.value) {
      throw createError({
        statusCode: 404,
        statusMessage: "文章不存在",
      });
    }

    const res = await $fetch(`/api/blog/posts/${slug.value}`, {
      method: "GET",
    });

    if (!res?.data) {
      throw createError({
        statusCode: 404,
        statusMessage: "文章不存在",
      });
    }

    return res.data;
  },
  {
    watch: [slug],
  }
);

const stripMarkdown = (content) => {
  if (!content) return "";

  return content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[#>*_~`-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
  const seed = encodeURIComponent(String(post?.slug || slug.value || post?.id || "aipan-blog"));
  return `https://picsum.photos/seed/${seed}/960/540`;
};

const articleCoverUrl = computed(() => {
  return getContentImageUrl(blog.value?.content) || getFallbackThumbnailUrl(blog.value);
});

const articleDescription = computed(() => {
  const plainText = stripMarkdown(blog.value?.content);
  if (!plainText) return "爱盼博客 - 分享技术、生活和见解";
  return plainText.length > 150 ? `${plainText.slice(0, 150)}...` : plainText;
});

const categoryNames = computed(() => {
  return blog.value?.categories?.map((item) => item.category?.name).filter(Boolean) || [];
});

const handleCoverError = (event) => {
  if (event.target.dataset.fallbackApplied === "true") return;
  event.target.dataset.fallbackApplied = "true";
  event.target.src = getFallbackThumbnailUrl(blog.value);
};

// SEO配置
useHead({
  title: computed(() =>
    blog.value?.title ? `${blog.value.title} | AIPAN.ME 博客` : "AIPAN.ME 博客"
  ),
  meta: [
    {
      name: "description",
      content: computed(() => articleDescription.value),
    },
    {
      name: "keywords",
      content: computed(() => {
        const keywords = ["博客", "AIPAN.ME"];
        if (blog.value?.categories) {
          keywords.push(...blog.value.categories.map((c) => c.category.name));
        }
        if (blog.value?.title) {
          keywords.push(blog.value.title);
        }
        return keywords.join(",");
      }),
    },
    // Open Graph / Facebook
    { property: "og:type", content: "article" },
    {
      property: "og:title",
      content: computed(() =>
        blog.value?.title
          ? `${blog.value.title} | AIPAN.ME 博客`
          : "AIPAN.ME 博客"
      ),
    },
    {
      property: "og:description",
      content: computed(() => articleDescription.value),
    },
    {
      property: "og:image",
      content: computed(() => articleCoverUrl.value),
    },
    {
      property: "og:url",
      content: computed(() => `https://www.aipan.me/blog/${route.params.slug}`),
    },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: computed(() =>
        blog.value?.title
          ? `${blog.value.title} | AIPAN.ME 博客`
          : "AIPAN.ME 博客"
      ),
    },
    {
      name: "twitter:description",
      content: computed(() => articleDescription.value),
    },
    {
      name: "twitter:image",
      content: computed(() => articleCoverUrl.value),
    },
    // 其他重要的meta标签
    { name: "robots", content: "index,follow" },
    {
      name: "author",
      content: computed(() => blog.value?.creator?.username || "AIPAN.ME"),
    },
    {
      name: "article:published_time",
      content: computed(
        () => blog.value?.createdAt || new Date().toISOString()
      ),
    },
    {
      name: "article:modified_time",
      content: computed(
        () =>
          blog.value?.updatedAt ||
          blog.value?.createdAt ||
          new Date().toISOString()
      ),
    },
    {
      name: "article:section",
      content: computed(
        () => blog.value?.categories?.[0]?.category.name || "未分类"
      ),
    },
  ],
  link: [
    {
      rel: "canonical",
      href: computed(() => `https://www.aipan.me/blog/${route.params.slug}`),
    },
  ],
  // 添加结构化数据
  script: [
    {
      type: "application/ld+json",
      children: computed(() => {
        if (!blog.value) return "{}";
        return JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: blog.value.title,
          description: articleDescription.value,
          image: articleCoverUrl.value,
          author: {
            "@type": "Person",
            name: blog.value.creator?.username || "AIPAN.ME",
          },
          publisher: {
            "@type": "Organization",
            name: "AIPAN.ME",
            logo: {
              "@type": "ImageObject",
              url: "https://www.aipan.me/logo.png",
            },
          },
          datePublished: blog.value.createdAt,
          dateModified: blog.value.updatedAt || blog.value.createdAt,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://www.aipan.me/blog/${route.params.slug}`,
          },
        });
      }),
    },
  ],
});

// Computed property to safely parse the blog content
const parsedContent = computed(() => {
  if (!blog.value?.content) return "";
  return sanitizeHtml(marked.parse(blog.value.content));
});

// 预计阅读时间
const readingTime = computed(() => {
  const text = stripMarkdown(blog.value?.content);
  if (!text) return 1;

  const cjkChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const words = text.match(/[A-Za-z0-9]+/g)?.length || 0;
  return Math.max(1, Math.ceil((cjkChars + words) / 400));
});

// 生成唯一ID
const generateId = (text) => {
  return text
    .toLowerCase()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// 解析HTML并提取标题
const parseHeadings = () => {
  if (!mounted.value) return [];

  const article = document.querySelector(".markdown-body");
  if (!article) return [];

  const headingElements = article.querySelectorAll("h2, h3");
  const headings = [];

  headingElements.forEach((heading) => {
    // 为标题生成ID（如果没有的话）
    if (!heading.id) {
      heading.id = generateId(heading.textContent);
    }

    headings.push({
      id: heading.id,
      text: heading.textContent,
      level: heading.tagName.toLowerCase(),
      top: heading.offsetTop,
    });
  });

  return headings;
};

// 更新活动标题
const updateActiveHeading = () => {
  const scrollPosition = window.scrollY;
  const offset = 150; // 调整偏移量以提前高亮

  // 找到第一个顶部位置大于当前滚动位置的标题
  let active = null;
  for (let i = headings.value.length - 1; i >= 0; i--) {
    if (scrollPosition + offset >= headings.value[i].top) {
      active = headings.value[i].id;
      break;
    }
  }

  // 如果没有找到活动标题，且页面接近顶部，选择第一个标题
  if (!active && scrollPosition < 100 && headings.value.length > 0) {
    active = headings.value[0].id;
  }

  activeHeading.value = active;
};

// 防抖函数
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(null, args), delay);
  };
};

// 初始化目录
const initToc = () => {
  if (!mounted.value) return;

  // 等待DOM更新完成
  nextTick(() => {
    // 确保内容已经加载
    if (!loading.value && blog.value?.content) {
      headings.value = parseHeadings();
      updateActiveHeading();
    }
  });
};

// 滚动处理
const handleScroll = debounce(() => {
  updateActiveHeading();
}, 100);

// 平滑滚动到指定标题
const scrollToHeading = (headingId) => {
  const element = document.getElementById(headingId);
  if (element) {
    const offset = 100;
    const top = element.offsetTop - offset;
    window.scrollTo({
      top,
      behavior: "smooth",
    });

    // 在移动端点击目录项后关闭目录
    if (window.innerWidth < 1024) {
      showToc.value = false;
    }
  }
};

const formatDate = (date) => {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd");
};

// 复制链接
const copyLink = async () => {
  try {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  } catch (err) {
    // 降级方案
    const textArea = document.createElement('textarea');
    textArea.value = window.location.href;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  }
};

// 社交媒体分享
const shareToSocial = (platform) => {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(blog.value?.title || "");
  const text = encodeURIComponent(
    `Check out this article: ${blog.value?.title}`
  );

  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    weibo: `http://service.weibo.com/share/share.php?url=${url}&title=${title}`,
  };

  window.open(shareUrls[platform], "_blank", "width=600,height=400");
};

// 监听内容变化
watch(
  [() => parsedContent.value, () => mounted.value],
  () => {
    if (mounted.value) {
      initToc();
    }
  },
  { immediate: true }
);

// 监听窗口大小变化
let resizeTimeout;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    headings.value = parseHeadings();
    updateActiveHeading();
  }, 200);
};

onMounted(() => {
  mounted.value = true;
  // 添加事件监听
  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleResize, { passive: true });

  // 初始化目录
  initToc();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
  window.removeEventListener("resize", handleResize);
  clearTimeout(resizeTimeout);
});
</script>

<template>
  <main class="min-h-screen bg-[#f8fafc] text-slate-950 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
    <nav class="sticky top-0 z-40 bg-[#f8fafc]/90 backdrop-blur dark:bg-slate-950/85">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div class="flex min-w-0 items-center gap-3">
          <NuxtLink
            to="/blog"
            class="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
          >
            <i class="fa-solid fa-chevron-left mr-1.5 text-[11px]"></i>
            返回博客
          </NuxtLink>
          <span class="hidden truncate text-xs text-slate-400 md:block">
            {{ blog?.title || "文章详情" }}
          </span>
        </div>

        <ClientOnly>
          <div class="flex items-center gap-1.5">
            <CommonReportButton
              v-if="blog?.id"
              content-type="post"
              :content-id="blog.id"
              :content-title="blog.title"
            />

            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300 lg:hidden"
              @click="showToc = !showToc"
            >
              <i class="fa-solid fa-list-ul text-sm"></i>
            </button>

            <div class="relative">
              <button
                class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                @click="showShareMenu = !showShareMenu"
              >
                <i class="fa-solid fa-share-nodes text-sm"></i>
              </button>

              <Transition name="share-menu">
                <div
                  v-show="showShareMenu"
                  class="absolute right-0 mt-2 w-48 rounded-lg bg-white py-1.5 text-sm dark:bg-slate-900"
                >
                  <button
                    class="flex w-full items-center px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                    @click="copyLink"
                  >
                    <i class="fa-regular fa-copy mr-2 w-4 text-center"></i>
                    {{ copySuccess ? "已复制" : "复制链接" }}
                  </button>
                  <button
                    class="flex w-full items-center px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                    @click="shareToSocial('twitter')"
                  >
                    <i class="fa-brands fa-x-twitter mr-2 w-4 text-center"></i>
                    分享到 X
                  </button>
                  <button
                    class="flex w-full items-center px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                    @click="shareToSocial('facebook')"
                  >
                    <i class="fa-brands fa-facebook-f mr-2 w-4 text-center"></i>
                    分享到 Facebook
                  </button>
                  <button
                    class="flex w-full items-center px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                    @click="shareToSocial('linkedin')"
                  >
                    <i class="fa-brands fa-linkedin-in mr-2 w-4 text-center"></i>
                    分享到 LinkedIn
                  </button>
                  <button
                    class="flex w-full items-center px-3 py-2 text-left text-xs text-slate-600 transition hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                    @click="shareToSocial('weibo')"
                  >
                    <i class="fa-brands fa-weibo mr-2 w-4 text-center"></i>
                    分享到微博
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </ClientOnly>
      </div>
    </nav>

    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div v-if="loading" class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
          <div class="aspect-[16/9] animate-pulse bg-slate-100 dark:bg-white/10"></div>
          <div class="space-y-4 p-5 sm:p-7">
            <div class="h-5 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-white/10"></div>
            <div class="h-3 w-1/2 animate-pulse rounded bg-slate-100 dark:bg-white/10"></div>
            <div class="space-y-3 pt-4">
              <div class="h-3 animate-pulse rounded bg-slate-100 dark:bg-white/10"></div>
              <div class="h-3 w-5/6 animate-pulse rounded bg-slate-100 dark:bg-white/10"></div>
              <div class="h-3 w-4/6 animate-pulse rounded bg-slate-100 dark:bg-white/10"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div class="min-w-0">
          <article class="overflow-hidden rounded-lg bg-white dark:bg-white/10">
            <div class="aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-900/60">
              <img
                :src="articleCoverUrl"
                :alt="blog?.title || '文章封面'"
                class="h-full w-full object-cover"
                @error="handleCoverError"
              />
            </div>

            <header class="px-5 py-6 sm:px-7">
              <div v-if="categoryNames.length" class="mb-3 flex flex-wrap gap-1.5">
                <span
                  v-for="category in categoryNames"
                  :key="category"
                  class="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300"
                >
                  {{ category }}
                </span>
              </div>

              <h1 class="max-w-3xl text-xl font-semibold leading-8 text-slate-950 dark:text-white sm:text-2xl sm:leading-9">
                {{ blog?.title }}
              </h1>

              <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
                <span class="inline-flex items-center">
                  <i class="fa-regular fa-calendar mr-1.5"></i>
                  {{ formatDate(blog?.createdAt) }}
                </span>
                <span class="inline-flex items-center">
                  <i class="fa-regular fa-clock mr-1.5"></i>
                  {{ readingTime }} 分钟阅读
                </span>
                <span v-if="blog?.creator?.username" class="inline-flex items-center">
                  <i class="fa-regular fa-user mr-1.5"></i>
                  {{ blog.creator.username }}
                </span>
              </div>
            </header>

            <div class="px-5 pb-7 sm:px-7">
              <div class="markdown-body max-w-none" v-html="parsedContent"></div>
            </div>

            <footer class="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 px-5 py-4 text-xs text-slate-500 dark:bg-white/5 dark:text-slate-400 sm:px-7">
              <span>感谢阅读</span>
              <ClientOnly>
                <button
                  class="inline-flex items-center rounded-lg px-3 py-1.5 font-medium text-slate-600 transition hover:bg-white hover:text-blue-600 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-blue-300"
                  @click="copyLink"
                >
                  <i class="fa-regular fa-copy mr-1.5"></i>
                  {{ copySuccess ? "已复制" : "复制链接" }}
                </button>
              </ClientOnly>
            </footer>
          </article>

          <section class="mt-6 rounded-lg bg-white dark:bg-white/10">
            <div class="px-5 pt-5 sm:px-7">
              <h2 class="text-sm font-semibold text-slate-950 dark:text-white">
                <i class="fa-regular fa-comments mr-2 text-blue-600"></i>
                评论讨论
              </h2>
            </div>
            <div class="p-5 sm:p-7">
              <CommentList v-if="blog?.id" :post-id="blog.id" />
            </div>
          </section>
        </div>

        <ClientOnly>
          <aside class="hidden lg:block">
            <div class="sticky top-20">
              <nav v-if="headings.length > 0" class="rounded-lg bg-white/70 p-4 dark:bg-white/10">
                <h2 class="mb-3 text-xs font-semibold text-slate-900 dark:text-white">目录</h2>
                <ul class="space-y-1">
                  <li
                    v-for="heading in headings"
                    :key="heading.id"
                    :class="heading.level === 'h3' ? 'pl-3' : ''"
                  >
                    <a
                      href="#"
                      :class="[
                        'block rounded-md px-2 py-1.5 text-xs leading-5 transition hover:bg-white hover:text-blue-600 dark:hover:bg-white/10 dark:hover:text-blue-300',
                        activeHeading === heading.id
                          ? 'bg-white font-medium text-blue-600 dark:bg-white/10 dark:text-blue-300'
                          : 'text-slate-500 dark:text-slate-400',
                      ]"
                      @click.prevent="scrollToHeading(heading.id)"
                    >
                      {{ heading.text }}
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </aside>
        </ClientOnly>
      </div>
    </section>

    <ClientOnly>
      <Teleport to="body">
        <div v-show="showToc" class="fixed inset-0 z-50 lg:hidden">
          <div class="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" @click="showToc = false"></div>
          <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div class="h-full w-screen max-w-sm bg-white dark:bg-slate-950">
              <div class="flex items-center justify-between px-5 py-4">
                <h2 class="text-sm font-semibold text-slate-950 dark:text-white">目录</h2>
                <button
                  class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  @click="showToc = false"
                >
                  <i class="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
              <nav v-if="headings.length > 0" class="px-5 pb-6">
                <ul class="space-y-1">
                  <li
                    v-for="heading in headings"
                    :key="heading.id"
                    :class="heading.level === 'h3' ? 'pl-3' : ''"
                  >
                    <a
                      href="#"
                      :class="[
                        'block rounded-md px-2 py-2 text-sm leading-5 transition hover:bg-slate-50 hover:text-blue-600 dark:hover:bg-white/10 dark:hover:text-blue-300',
                        activeHeading === heading.id
                          ? 'bg-slate-50 font-medium text-blue-600 dark:bg-white/10 dark:text-blue-300'
                          : 'text-slate-500 dark:text-slate-400',
                      ]"
                      @click.prevent="scrollToHeading(heading.id)"
                    >
                      {{ heading.text }}
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </Teleport>
    </ClientOnly>
  </main>
</template>

<style>
@import "tailwindcss" reference;

.markdown-body {
  color: #334155;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial,
    sans-serif;
  font-size: 14px;
  line-height: 1.85;
  overflow-wrap: anywhere;
}

.dark .markdown-body {
  color: #cbd5e1;
}

.markdown-body > *:first-child {
  margin-top: 0;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
  color: #0f172a;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 12px;
  margin-top: 28px;
  scroll-margin-top: 96px;
}

.dark .markdown-body h1,
.dark .markdown-body h2,
.dark .markdown-body h3,
.dark .markdown-body h4,
.dark .markdown-body h5,
.dark .markdown-body h6 {
  color: #f8fafc;
}

.markdown-body h1 {
  font-size: 1.5rem;
}

.markdown-body h2 {
  font-size: 1.25rem;
}

.markdown-body h3 {
  font-size: 1.05rem;
}

.markdown-body p,
.markdown-body ul,
.markdown-body ol {
  margin-bottom: 14px;
}

.markdown-body ul,
.markdown-body ol {
  padding-left: 1.35rem;
}

.markdown-body li {
  margin: 0.25rem 0;
}

.markdown-body a {
  color: #2563eb;
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

.dark .markdown-body a {
  color: #60a5fa;
}

.markdown-body pre {
  background: #0f172a;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.6;
  margin: 20px 0;
  overflow: auto;
  padding: 16px;
}

.dark .markdown-body pre {
  background: #020617;
}

.markdown-body code {
  background: rgba(15, 23, 42, 0.06);
  border-radius: 6px;
  font-size: 86%;
  padding: 0.15em 0.35em;
}

.dark .markdown-body code {
  background: rgba(255, 255, 255, 0.12);
}

.markdown-body pre code {
  background: transparent;
  border-radius: 0;
  color: inherit;
  padding: 0;
}

.markdown-body blockquote {
  border-left: 2px solid #2563eb;
  color: #64748b;
  margin: 18px 0;
  padding-left: 1rem;
}

.dark .markdown-body blockquote {
  color: #94a3b8;
}

.markdown-body table {
  border-collapse: collapse;
  display: block;
  font-size: 13px;
  margin: 18px 0;
  overflow: auto;
  width: 100%;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #e2e8f0;
  padding: 8px 12px;
}

.dark .markdown-body table th,
.dark .markdown-body table td {
  border-color: rgba(255, 255, 255, 0.14);
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f8fafc;
}

.dark .markdown-body table tr:nth-child(2n) {
  background-color: rgba(255, 255, 255, 0.05);
}

.markdown-body img {
  border-radius: 8px;
  height: auto;
  margin: 20px 0;
  max-width: 100%;
}

.markdown-body hr {
  background-color: #e2e8f0;
  border: 0;
  height: 1px;
  margin: 24px 0;
}

.dark .markdown-body hr {
  background-color: rgba(255, 255, 255, 0.14);
}

.hljs {
  background: transparent !important;
  padding: 0 !important;
}

.markdown-body pre::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.markdown-body pre::-webkit-scrollbar-track {
  background: transparent;
}

.markdown-body pre::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.45);
  border-radius: 4px;
}

.share-menu-enter-active,
.share-menu-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.share-menu-enter-from,
.share-menu-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
