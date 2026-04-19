<template>
  <aside
    class="w-64 bg-surface border-r border-border flex flex-col fixed h-full z-20"
  >
    <!-- Logo -->
    <div class="px-6 py-6 border-b border-border">
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl bg-accent flex items-center justify-center"
        >
          <ShieldCheck class="w-5 h-5 text-black" />
        </div>
        <div>
          <p class="font-display font-bold text-sm tracking-wide text-black">
            Admin
          </p>
          <p class="text-xs text-muted">Panel de Control</p>
        </div>
      </div>
    </div>

    <!-- Navegación -->
    <nav class="flex-1 px-3 py-4 space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        custom
        v-slot="{ isActive, navigate }"
      >
        <button
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isActive
              ? 'bg-accent-dim text-accent'
              : 'text-muted hover:text-black hover:bg-ghost',
          ]"
          @click="navigate"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.label }}
        </button>
      </RouterLink>
    </nav>

    <!-- Usuario actual -->
    <div class="px-4 py-4 border-t border-border">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold"
        >
          SU
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">Superusuario</p>
          <p class="text-xs text-muted truncate">admin@sispod.com</p>
        </div>
        <LogOut
          class="w-4 h-4 text-muted hover:text-black cursor-pointer transition-colors"
        />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import { ShieldCheck, Users, Tag, BarChart2, LogOut } from "lucide-vue-next";
import { ROUTE_PATHS } from "@/shared/routes";

const navItems = [
  { to: ROUTE_PATHS.USERS, icon: Users, label: "Usuarios" },
  { to: ROUTE_PATHS.ROLES, icon: Tag, label: "Roles" },
  { to: ROUTE_PATHS.STATS, icon: BarChart2, label: "Estadísticas" },
];
</script>
