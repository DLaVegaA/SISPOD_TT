<script setup lang="ts">
import { ref } from 'vue'
import logoUrl from '@/shared/assets/logo_diente.png'

const isOpen = ref(false)
</script>

<template>
  <nav class="absolute top-0 left-0 w-full z-50">
    <!-- Barra principal -->
    <div class="flex items-center justify-between px-8 py-4">
      <!-- Logo -->
      <div class="flex items-center gap-2">
        <img :src="logoUrl" alt="SISPOD Logo" class="h-10 w-auto" />
        <span class="text-xl font-bold text-white">Consultorio<br>Gonzalez</span>
      </div>

      <!-- Links desktop -->
      <div class="hidden md:flex items-center gap-8 font-medium">
        <a href="#inicio" class="text-white border-b-2 border-white">Inicio</a>
        <a href="#sobre-nosotros" class="text-white/80 hover:text-white transition">Sobre Nosotros</a>
        <a href="#servicios" class="text-white/80 hover:text-white transition">Servicios</a>
        <router-link to="/login" class="bg-[#4382b59d] text-white px-7 py-2.5 rounded-xl font-bold hover:bg-[#3a6d9c] transition shadow-lg shadow-blue-900/20 inline-block cursor-pointer">
          Iniciar Sesión
        </router-link>
      </div>

      <!-- Botón hamburguesa (móvil) -->
      <button class="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition"
              @click="isOpen = !isOpen">
        <svg v-if="!isOpen" xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Menú móvil desplegable -->
    <div v-if="isOpen"
         class="md:hidden mx-4 mb-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
      <div class="flex flex-col p-4 gap-1">
        <a href="#inicio" class="text-white font-semibold px-4 py-3 rounded-xl bg-white/10">Inicio</a>
        <a href="#sobre-nosotros" class="text-white/80 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition">Sobre Nosotros</a>
        <a href="#servicios" class="text-white/80 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl transition">Servicios</a>
        <router-link to="/login"
                     class="mt-2 bg-[#4382b59d] text-white px-4 py-3 rounded-xl font-bold hover:bg-[#3a6d9c] transition text-center"
                     @click="isOpen = false">
          Iniciar Sesión
        </router-link>
      </div>
    </div>
  </nav>
</template>