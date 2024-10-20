<template>
  <Header></Header>
  <div>
    <slot></slot>
  </div>
  <Footer></Footer>
</template>

<script setup>
import Footer from "~/components/layout/Footer.vue";
import Header from "~/components/layout/Header.vue";

</script>

<style scoped></style>
