<script setup lang="ts">
import RecoverPasswordForm from '@/features/auth/ui/RecoverPasswordForm.vue' // O impórtalo desde '@/features/auth' si lo agregaste al index.ts
import logoUrl from '@/shared/assets/logo_diente.png'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 relative">
    <img 
      src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80"
      class="absolute inset-0 w-full h-full object-cover z-0"
      alt="Clínica Dental"
    />
    <div class="absolute inset-0 bg-black/40 z-10"></div>

    <router-link to="/login"
      class="absolute top-6 left-6 z-30 flex items-center gap-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl text-sm font-medium transition">
      ← Regresar al Login
    </router-link>

    <div class="relative z-20 bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl p-10 w-full max-w-md">
      
      <div class="flex flex-col items-center mb-6 gap-1">
        <div class="flex items-center gap-2">
          <img :src="logoUrl" alt="Logo" class="h-7 w-auto brightness-0 invert" />
          <span class="text-white font-semibold text-sm">Consultorio Gonzalez</span>
        </div>
      </div>

      <h1 class="text-2xl font-bold text-white text-center mb-6">Recuperar Contraseña</h1>

      <RecoverPasswordForm />
    </div>
  </div>
</template>