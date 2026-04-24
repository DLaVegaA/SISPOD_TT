<template>
  <div class="flex min-h-screen">
    <AppSideBar v-if="isAuth" />
    <main :class="isAuth ? 'flex-1 p-8 ml-64' : 'flex-1'">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { AppSideBar } from '@/widgets/sidebar'
import { ref } from 'vue'
const isAuth = ref(true)
</script>
