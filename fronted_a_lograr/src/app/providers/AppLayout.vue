<template>
  <div class="flex min-h-screen">
    <!-- Widget de navegación lateral -->
    <AppSidebar />

    <!-- Área de contenido principal con router-view -->
    <main class="ml-64 flex-1 p-8">
      <!-- RouterView con animación de transición entre páginas -->
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
// widgets — capa inferior ✅
import { AppSidebar } from "@/widgets/sidebar";
</script>

<style scoped>
.page-enter-active,
.page-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
