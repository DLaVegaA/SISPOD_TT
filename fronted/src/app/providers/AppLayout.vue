<template>
  <div class="flex min-h-screen">
    <AppSideBar v-if="isAuth" />
    <main :class="isAuth ? 'flex-1 p-8 ml-64' : 'flex-1'">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useSessionStore } from '@/entities/session'
import { AppSideBar } from '@/widgets/sidebar'
import { computed } from 'vue'

const sessionStore = useSessionStore()
const isAuth = computed(() => sessionStore.isAuthenticated)
</script>
