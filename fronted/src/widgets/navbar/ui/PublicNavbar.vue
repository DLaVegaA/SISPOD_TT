<script setup lang="ts">
import logoUrl from '@/shared/assets/logo_diente.png'
</script>
<template>
  <nav class="flex items-center justify-between px-8 py-4 bg-transparent absolute top-0 left-0 w-full z-50">
    <div class="flex items-center gap-2">
      <div class="text-white"> 
        <img :src="logoUrl" alt="SISPOD Logo" class="h-10 w-auto" />
      </div>
      <span class="text-xl font-bold text-white">Consultorio Gonzalez</span> </div>
    
    <div class="hidden md:flex items-center gap-8 font-medium">
      <a href="#" class="text-white border-b-2 border-white">Inicio</a>
      <a href="#" class="text-white/80 hover:text-white transition">Sobre Nosotros</a>
      <a href="#" class="text-white/80 hover:text-white transition">Servicios</a>
      <router-link to="/login" class="bg-white text-blue-900 px-7 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg shadow-blue-900/20 inline-block cursor-pointer">
        Iniciar Sesión
      </router-link>
    </div>
  </nav>
</template>