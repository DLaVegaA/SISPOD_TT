<script setup lang="ts">
import { PublicNavbar } from '@/widgets/navbar';
</script>

<template>
  <div class="min-h-screen font-sans text-gray-900">
    <PublicNavbar />

    <section id="inicio" class="relative min-h-150 flex flex-col text-white">
      <img src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80" 
           class="absolute inset-0 w-full h-full object-cover z-0" alt="Clinica Dental">
      
      <div class="absolute inset-0 z-10 bg-linear-to-r from-[#4382B599] via-slate-800/70"></div>
      
      <div class="relative z-20 w-full max-w-7xl mx-auto px-8 py-16 flex flex-col flex-1">
        <div class="text-left mt-auto md:mt-16">
          <h2 class="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-md text-white">
            Cuidamos tu sonrisa como <br> si fuera nuestra
          </h2>
        </div>

        <div class="mt-auto w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl text-left">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div class="flex flex-col items-start">
              <span class="text-4xl md:text-5xl font-bold drop-shadow-sm">+20</span>
              <span class="text-xs md:text-sm uppercase tracking-widest opacity-90 mt-2 font-medium text-blue-50">Años de experiencia</span>
            </div>
            <div class="flex flex-col items-start">
              <span class="text-4xl md:text-5xl font-bold drop-shadow-sm">95%</span>
              <span class="text-xs md:text-sm uppercase tracking-widest opacity-90 mt-2 font-medium text-blue-50">Pacientes satisfechos</span>
            </div>
            <div class="flex flex-col items-start">
              <span class="text-4xl md:text-5xl font-bold drop-shadow-sm">+1000</span>
              <span class="text-xs md:text-sm uppercase tracking-widest opacity-90 mt-2 font-medium text-blue-50">Pacientes atendidos<br>anualmente</span>
            </div>
            <div class="flex flex-col items-start">
              <span class="text-4xl md:text-5xl font-bold drop-shadow-sm">+3</span>
              <span class="text-xs md:text-sm uppercase tracking-widest opacity-90 mt-2 font-medium text-blue-50">Especialidades</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="sobre-nosotros" class="py-24 px-8 max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
      <div class="space-y-6">
        <span class="text-[#4382B5] font-black text-xl uppercase tracking-[0.2em]">Sobre Nosotros</span>
        <h3 class="text-4xl font-extrabold text-slate-800 leading-[1.1]">
          En Nuestra Clínica Dental Creemos Que Una Sonrisa Saludable Puede Transformar Vidas.
        </h3>
        <p class="text-base text-slate-600 leading-relaxed">
          Cada tratamiento que realizamos está guiado por un enfoque humano, cercano y sin prisas. Sabemos que ir al dentista puede generar ansiedad, por eso nos esforzamos en crear un ambiente tranquilo y de confianza desde el primer momento. Contamos con más de 10 años de experiencia en diversas especialidades como odontología general, estética, ortodoncia y atención infantil. Nuestro equipo se mantiene en constante formación y trabajamos con tecnología moderna para garantizar resultados precisos, seguros y duraderos. Más que pacientes, construimos relaciones a largo plazo basadas en el cuidado, la transparencia y el respeto.
        </p>
      </div>
      
      <div class="relative flex items-center justify-center">
        <!-- Blob azul decorativo -->
        <div class="absolute w-[480px] h-[480px] bg-blue-100 -z-10"
          style="border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; top: -20px; right: -30px;">
        </div>

          <!-- Imagen encima -->
        <img src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&q=80" 
          class="relative z-10 rounded-2xl shadow-2xl w-full max-w-md object-cover"
          alt="Equipo Dental">
      </div>
    </section>

    <section id="servicios" class="bg-slate-50 py-24 px-8">
      <div class="max-w-7xl mx-auto text-center mb-16">
        <h3 class="text-[#4382B5] font-bold uppercase tracking-widest mb-4 text-xl">Servicios</h3>
        <p class="text-4xl font-black text-slate-900">Para Tu Salud Dental</p>
      </div>
      
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div v-for="i in 6" :key="i" class="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all hover:-translate-y-2 group cursor-pointer">
          <div class="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <h4 class="text-lg font-bold text-slate-800 mb-3">Título De Servicio</h4>
          <p class="text-slate-500 text-sm leading-relaxed">Descripción breve del tratamiento dental que se ofrece para mejorar la salud del paciente.</p>
        </div>
      </div>
    </section>

    <footer class="py-12 text-center text-slate-400 border-t border-slate-100">
      <p class="font-medium">© 2026 Consultorio Gonzalez</p>
    </footer>
  </div>
</template>