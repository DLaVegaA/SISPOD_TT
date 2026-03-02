<script setup lang="ts">
import { LoginForm } from '@/features/auth'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div class="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
      <div class="text-center mb-8">
        <h1 class="text-2xl font-black text-blue-900 leading-tight">Bienvenido de nuevo</h1>
        <p class="text-slate-500 mt-2">Ingresa tus credenciales para acceder al sistema</p>
      </div>
      
      <LoginForm />
      
      <div class="mt-8 text-center">
        <router-link to="/" class="text-sm text-blue-600 hover:underline font-medium">
          ← Volver al inicio
        </router-link>
      </div>
    </div>
  </div>
</template>