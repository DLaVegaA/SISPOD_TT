<script setup lang="ts">
import axios from 'axios';
import { ref } from 'vue';
import { recoverPasswordRequest } from '../api/authApi'; // Ya importamos la función

const email = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const handleSubmit = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  
  try {    
    // Llamada a tu API real
    await recoverPasswordRequest({ correo: email.value });
    
    // Si la petición es exitosa (código 200), mostramos el mensaje
    successMsg.value = 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';
    email.value = ''; // Limpiamos el input
    
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // Tomamos el mensaje de error que mande tu backend (ej. res.status(404).json({ message: '...' }))
      errorMsg.value = err.response?.data?.message || 'Ocurrió un error al intentar enviar el correo.';
    } else {
      errorMsg.value = 'Ocurrió un error inesperado. Intenta de nuevo.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4 w-full">

    <div v-if="successMsg" class="p-3 bg-green-500/20 text-white text-sm rounded-xl border border-green-400/30 backdrop-blur-sm">
      {{ successMsg }}
    </div>

    <div v-if="errorMsg" class="p-3 bg-red-500/20 text-white text-sm rounded-xl border border-red-400/30 backdrop-blur-sm">
      {{ errorMsg }}
    </div>

    <p class="text-white/80 text-sm text-center mb-4">
      Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
    </p>

    <div class="relative">
      <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
      </span>
      <input 
        v-model="email"
        type="email"
        placeholder="correo electrónico"
        :disabled="isLoading || !!successMsg"
        required
        class="w-full pl-10 pr-4 py-3 bg-white/80 border border-white/50 rounded-xl text-slate-700 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
      />
    </div>

    <button 
      type="submit"
      :disabled="isLoading || !!successMsg"
      class="w-full bg-[#4382b59d] hover:bg-[#3a6d9c] text-white py-3 rounded-xl font-bold transition shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 mt-4"
    >
      <span v-if="isLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      {{ isLoading ? 'Enviando...' : 'Enviar instrucciones' }}
    </button>
  </form>
</template>