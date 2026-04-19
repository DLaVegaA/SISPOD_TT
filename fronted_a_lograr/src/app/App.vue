<template>
  <!-- AppLayout contiene el sidebar + <RouterView> -->
  <AppLayout />
</template>

<script setup lang="ts">
// app/providers — misma capa ✅
import AppLayout from './providers/AppLayout.vue'
</script>
