<template>

  <Head>
    <script v-if="structuredData" type="application/ld+json" :key="structuredDataKey">
      {{ JSON.stringify(structuredData) }}
    </script>
  </Head>
</template>

<script setup>

const props = defineProps({
  type: {
    type: String,
    default: 'WebPage'
  },
  title: {
    type: String,
    default: undefined
  },
  description: {
    type: String,
    default: undefined
  },
  url: {
    type: String,
    default: undefined
  },
  image: {
    type: String,
    default: undefined
  },
  author: {
    type: String,
    default: undefined
  },
  datePublished: {
    type: String,
    default: undefined
  },
  dateModified: {
    type: String,
    default: undefined
  },
  keywords: {
    type: Array,
    default: undefined
  }
})

const structuredDataKey = computed(() => `structured-data-${props.type}-${Date.now()}`)

const structuredData = computed(() => {
  const baseData = {
    "@context": "https://schema.org",
    "@type": props.type,
    "name": props.title,
    "description": props.description,
    "url": props.url || "https://www.aipan.me"
  }

  if (props.type === 'WebSite') {
    return {
      ...baseData,
      "alternateName": "AIPAN.ME",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.aipan.me/search?keyword={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "AIPAN.ME",
        "url": "https://www.aipan.me"
      }
    }
  }

  if (props.type === 'Article') {
    return {
      ...baseData,
      "@type": "Article",
      "headline": props.title,
      "image": props.image,
      "author": {
        "@type": "Person",
        "name": props.author || "AIPAN.ME"
      },
      "publisher": {
        "@type": "Organization",
        "name": "AIPAN.ME",
        "url": "https://www.aipan.me"
      },
      "datePublished": props.datePublished,
      "dateModified": props.dateModified,
      "keywords": props.keywords?.join(', ')
    }
  }

  return baseData
})
</script>
