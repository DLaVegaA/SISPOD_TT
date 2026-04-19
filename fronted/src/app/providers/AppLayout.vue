<template>
  <div class="flex min-h-screen">
    <AppSideBar />
    <main class="flex-1 p-8 ml-64">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { AppSideBar } from '@/widgets/sidebar'
</script>
