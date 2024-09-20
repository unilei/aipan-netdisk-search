<script setup>
import Header from "~/components/layout/netdisk/Header.vue";
import Footer from "~/components/layout/netdisk/Footer.vue";
</script>
<template>
    <div>
        <Header></Header>
        <div>
            <slot></slot>
        </div>
        <Footer></Footer>
    </div>
</template>
<style scoped></style>