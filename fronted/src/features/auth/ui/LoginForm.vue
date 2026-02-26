<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// import { loginRequest } from '../api/authApi'; // Descomentar cuando el back funcione

const router = useRouter();
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMsg = ref('');

const handleSubmit = async () => {
  isLoading.value = true;
  errorMsg.value = '';
  
  try {
    console.log('Enviando a validación...');
    // Simulación de espera de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Aquí iría la llamada real:
    // const data = await loginRequest({ correo: email.value, password: password.value });
    
    // Si el login es exitoso, mandamos al actor a su dashboard
    // Por ahora, mandémoslo al home
    router.push('/'); 
  } catch (err) {
    errorMsg.value = 'Credenciales incorrectas. Intenta de nuevo.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5 w-full">
    <div v-if="errorMsg" class="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
      {{ errorMsg }}
    </div>

    <div>
      <label class="block text-sm font-semibold text-slate-700 mb-2">Correo de la clínica</label>
      <input 
        v-model="email"
        type="email" 
        class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
        placeholder="nombre@consultorio.com"
        :disabled="isLoading"
        required
      />
    </div>

    <div>
      <label class="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
      <input 
        v-model="password"
        type="password" 
        class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50 focus:bg-white"
        placeholder="••••••••"
        :disabled="isLoading"
        required
      />
    </div>

    <button 
      type="submit" 
      :disabled="isLoading"
      class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex justify-center items-center gap-2 disabled:opacity-50"
    >
      <span v-if="isLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
      {{ isLoading ? 'Validando...' : 'Entrar al Sistema' }}
    </button>
  </form>
</template>