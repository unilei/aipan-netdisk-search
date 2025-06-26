<script setup>
const props = defineProps({
  tagsData,
});

const emit = defineEmits(["change"]);

const handleChange = (id) => {
  emit("change", id);
};
</script>

<template>
  <ul class="grid grid-cols-5 gap-3">
    <li
      class="bg-white px-[14px] py-[6px] cursor-pointer hover:scale-105 rounded-[6px] transition duration-300 ease-in-out"
      v-for="(item, i) in tagsData" :key="i" @click="handleChange(item.id)">
      <span class="text-[14px] font-inter font-[600]">{{ item.name }}</span>
    </li>
  </ul>
</template>

<style scoped></style>
