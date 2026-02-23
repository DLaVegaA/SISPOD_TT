<script setup lang="ts">
import { PublicNavbar } from '@/widgets/navbar';
</script>

<template>
  <div class="min-h-screen font-sans text-gray-900">
    <PublicNavbar />

    <section class="relative h-125 flex items-center justify-center text-white text-center">
      <div class="absolute inset-0 bg-blue-900/60 z-10"></div>
      <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80" 
           class="absolute inset-0 w-full h-full object-cover" alt="Clinica Dental">
      
      <div class="relative z-20 px-4">
        <h2 class="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight">
          Cuidamos tu sonrisa como <br> si fuera nuestra
        </h2>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div class="flex flex-col items-center">
            <span class="text-4xl font-bold">+20</span>
            <span class="text-xs uppercase tracking-widest opacity-80 mt-2">Años de experiencia</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-4xl font-bold">95%</span>
            <span class="text-xs uppercase tracking-widest opacity-80 mt-2">Pacientes satisfechos</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-4xl font-bold">+1000</span>
            <span class="text-xs uppercase tracking-widest opacity-80 mt-2">Pacientes atendidos</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-4xl font-bold">+3</span>
            <span class="text-xs uppercase tracking-widest opacity-80 mt-2">Especialidades</span>
          </div>
        </div>
      </div>
    </section>

    <section class="py-24 px-8 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <div class="space-y-6">
        <span class="text-blue-600 font-black text-sm uppercase tracking-[0.2em]">Sobre Nosotros</span>
        <h3 class="text-4xl font-extrabold text-slate-800 leading-[1.1]">
          En Nuestra Clínica Dental Una Sonrisa Saludable Transforma Vidas.
        </h3>
        <p class="text-lg text-slate-600 leading-relaxed">
          Cada tratamiento que realizamos está guiado por un enfoque integral, 
          utilizando la mejor tecnología para asegurar tu bienestar.
        </p>
      </div>
      <div class="relative group">
        <div class="absolute -inset-1 bg-linear-to-r from-blue-600 to-cyan-400 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <img src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80" 
             class="relative rounded-2xl shadow-2xl" alt="Equipo Dental">
      </div>
    </section>

    <section class="bg-slate-50 py-24 px-8">
      <div class="max-w-7xl mx-auto text-center mb-16">
        <h3 class="text-blue-600 font-bold uppercase tracking-widest mb-4">Servicios</h3>
        <p class="text-4xl font-black text-slate-900">Para Tu Salud Dental</p>
      </div>
      
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div v-for="i in 3" :key="i" class="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all hover:-translate-y-2 group">
          <div class="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
          </div>
          <h4 class="text-xl font-bold text-slate-800 mb-4">Título De Servicio</h4>
          <p class="text-slate-500 line-clamp-3">Descripción breve del tratamiento dental que se ofrece para mejorar la salud del paciente.</p>
        </div>
      </div>
    </section>

    <footer class="py-12 text-center text-slate-400 border-t border-slate-100">
      <p class="font-medium">© 2026 Consultorio Gonzalez</p>
    </footer>
  </div>
</template>