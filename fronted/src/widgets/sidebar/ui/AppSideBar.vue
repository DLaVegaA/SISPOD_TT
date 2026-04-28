<template>
  <aside class="w-64 bg-surface border-r border-border flex flex-col fixed h-full z-20">
    <!-- Logo -->
    <div class="p-6 border-b border-border">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 flex justify-center items-center rounded-xl bg-accent">
          <ShieldCheck class="w-5 h-5 text-black" />
        </div>
        <div>
          <p class="font-display font-bold text-sm tracking-wide text-black">{{ roleLabel }}</p>
          <p class="text-xs text-muted">Panel de Control</p>
        </div>
      </div>
    </div>
    <!-- Navgacion -->
    <nav class="flex-1 px-3 py-4 space-y-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        custom
        v-slot="{ isActive, navigate }"
      >
        <button
          :class="[
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            isActive ? 'bg-accent-dim text-accent' : 'text-muted hover:text-black hover:bg-ghost',
          ]"
          @click="navigate"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.label }}
        </button>
      </RouterLink>
    </nav>
    <!-- Usuario actual -->
    <div class="p-4 border-t border-border">
      <div class="flex items-center gap-3">
        <div
          class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold"
        >
          {{ userInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ userName }}</p>
          <p class="text-xs text-muted truncate">{{ userEmail }}</p>
        </div>
        <button
          type="button"
          class="h-7 w-7 inline-flex items-center justify-center text-muted hover:text-black cursor-pointer transition-colors"
          @click="handleLogout"
          aria-label="Cerrar sesión"
        >
          <LogOut class="h-4 w-4" />
        </button>
      </div>
    </div>
  </aside>
</template>
<script lang="ts" setup>
import { useSessionStore } from '@/entities/session'
import {
  BarChart2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Tag,
  Users,
  UserRound,
} from 'lucide-vue-next'
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ROUTE_NAMES, ROUTE_PATHS } from '@/shared/routes'

const sessionStore = useSessionStore()
const router = useRouter()

const currentUserId = computed(() => {
  // 👈 Le ponemos "as any" para que TypeScript no se queje de propiedades nuevas
  const u = sessionStore.user as any; 
  return String(u?.id ?? u?.id_usuario ?? u?.id_paciente ?? 0);
})

const navItems = computed(() => {
  const params = { id: currentUserId.value }

  switch (sessionStore.role) {
    case 'admin':
      return [
        {
          key: 'admin-users',
          to: { name: ROUTE_NAMES.ADMIN_USERS, params },
          icon: Users,
          label: 'Usuarios',
        },
        {
          key: 'admin-roles',
          to: { name: ROUTE_NAMES.ADMIN_ROLES, params },
          icon: Tag,
          label: 'Roles',
        },
        {
          key: 'admin-stats',
          to: { name: ROUTE_NAMES.ADMIN_STATS, params },
          icon: BarChart2,
          label: 'Estadísticas',
        },
      ]
    case 'dentist':
      return [
        {
          key: 'dentist-home',
          to: { name: ROUTE_NAMES.DENTIST_HOME, params },
          icon: LayoutDashboard,
          label: 'Inicio',
        },
        {
          key: 'dentist-calendar',
          to: { name: ROUTE_NAMES.DENTIST_CALENDAR, params },
          icon: CalendarDays,
          label: 'Calendario',
        },
        {
          key: 'dentist-patients',
          to: { name: ROUTE_NAMES.DENTIST_PATIENTS, params },
          icon: Users,
          label: 'Pacientes',
        },
        {
          key: 'dentist-history',
          to: { name: ROUTE_NAMES.DENTIST_CLINICAL_HISTORY, params },
          icon: FileText,
          label: 'Historial',
        },
      ]
    case 'patient':
      return [
        {
          key: 'patient-home',
          to: { name: ROUTE_NAMES.PATIENT_HOME, params },
          icon: LayoutDashboard,
          label: 'Inicio',
        },
        {
          key: 'patient-profile',
          to: { name: ROUTE_NAMES.PATIENT_PROFILE, params },
          icon: UserRound,
          label: 'Perfil',
        },
        {
          key: 'patient-appointments',
          to: { name: ROUTE_NAMES.PATIENT_APPOINTMENT, params },
          icon: CalendarDays,
          label: 'Citas',
        },
      ]
    case 'assistant':
      return [
        {
          key: 'assistant-home',
          to: { name: ROUTE_NAMES.ASSISTANT_HOME, params },
          icon: UserRound,
          label: 'Inicio',
        },
      ]
    default:
      return []
  }
})

const userName = computed(() => {
  // 👈 Le ponemos "as any" aquí también
  const u = sessionStore.user as any; 
  if (!u) return 'Usuario';
  
  if (u.nombre && u.apellido_paterno) {
    return `${u.nombre} ${u.apellido_paterno}`;
  }
  
  return u.name ?? u.nombre ?? 'Usuario';
})

const userEmail = computed(
  () => sessionStore.user?.correo ?? sessionStore.user?.email ?? 'sin-correo',
)

const roleLabel = computed(() => {
  const labelByRole: Record<string, string> = {
    admin: 'ADMINISTRADOR',
    dentist: 'DENTISTA',
    patient: 'PACIENTE',
    assistant: 'ASISTENTE',
  }

  return labelByRole[sessionStore.role ?? ''] ?? 'USUARIO'
})

const userInitials = computed(() => {
  // Ahora cortamos el userName que ya viene limpio y validado
  const nameToSplit = userName.value === 'Usuario' ? 'US' : userName.value;
  const [first = '', second = ''] = nameToSplit.trim().split(/\s+/);
  
  // Si hay un segundo nombre/apellido, tomamos la primera letra, si no, tomamos la segunda letra del primer nombre
  const secondChar = second ? second.charAt(0) : first.charAt(1);
  const joined = `${first.charAt(0)}${secondChar}`.toUpperCase();

  return joined || 'US';
})

const handleLogout = async () => {
  await sessionStore.logout()
  await router.push(ROUTE_PATHS.LOGIN)
}
</script>
