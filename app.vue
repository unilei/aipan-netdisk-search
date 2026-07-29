<template>
  <NuxtLayout>
    <NuxtPage></NuxtPage>
    <!-- Cookie同意横幅 -->
    <CommonCookieConsent />
  </NuxtLayout>
</template>
<style>
body {
  background-color: #fcfcfd;
  padding: 0;
  margin: 0 auto;
  transition: background-color 0.3s ease;
}

html.dark body {
  background-color: #111827;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  margin: 0;
  padding: 0;
}

</style>
