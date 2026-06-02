<script setup lang="ts">
import { LoginForm } from '@/features/auth'
import logoUrl from '@/shared/assets/logo_diente.png'
import { ROUTE_NAMES } from '@/shared/routes';
</script>

<template>
  <!-- Fondo con imagen de clínica -->
  <div class="min-h-screen flex items-center justify-center px-4 relative">
    <img 
      src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80"
      class="absolute inset-0 w-full h-full object-cover z-0"
      alt="Clínica Dental"
    />
    <!-- Overlay oscuro -->
    <div class="absolute inset-0 bg-black/40 z-10"></div>

    <!-- Botón regresar -->
    <router-link to="/"
      class="absolute top-6 left-6 z-30 flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition">
      ← Regresar
    </router-link>

    <!-- Card glassmorphism -->
    <div class="relative z-20 bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-10 w-full max-w-md">
      
      <!-- Logo y nombre -->
      <div class="flex flex-col items-center mb-6 gap-1">
        <div class="flex items-center gap-2">
          <img :src="logoUrl" alt="Logo" class="h-7 w-auto brightness-0 invert" />
          <span class="text-white font-semibold text-sm">Consultorio González</span>
        </div>
      </div>

      <!-- Título -->
      <h1 class="text-2xl font-bold text-white text-center mb-8">Inicio de Sesión</h1>

      <LoginForm />
    </div>

    <!-- Links legales -->
    <div class="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-6">
      <router-link
        :to="{ name: ROUTE_NAMES.PRIVACY_POLICY }"
        class="text-white/40 hover:text-white/70 text-xs transition-colors"
      >
        Aviso de Privacidad
      </router-link>
      <span class="text-white/20">·</span>
      <router-link
        :to="{ name: ROUTE_NAMES.TERMS_CONDITIONS }"
        class="text-white/40 hover:text-white/70 text-xs transition-colors"
      >
        Términos y Condiciones
      </router-link>
    </div>
  </div>
</template>