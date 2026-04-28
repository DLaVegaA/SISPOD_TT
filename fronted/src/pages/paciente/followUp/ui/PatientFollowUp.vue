<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  HeartPulse, ShieldAlert, CheckCircle2, 
  Info, Clock, FileText, AlertCircle, Send
} from 'lucide-vue-next'

// Simulamos los datos que vendrán de tu API
const isLoading = ref(false)
const isSubmitting = ref(false)
const successMsg = ref<string | null>(null)

// Datos del seguimiento activo
const seguimiento = ref({
  estado: 'Activo',
  diasRestantes: 5,
  indicaciones: '1. Mantener la gasa mordida por 45 minutos.\n2. No consumir alimentos calientes o irritantes por 3 días.\n3. Aplicar hielo en la zona afectada en intervalos de 15 minutos.\n4. Tomar Ketorolaco 10mg cada 8 horas en caso de dolor.',
  nivelAlerta: 'Ninguna',
  fechaInicio: '2026-04-28'
})

// Estado del cuestionario diario
const cuestionarioHoy = ref({
  respondido: false,
  dolor: 0, // Escala 1-10
  sangrado: false,
  inflamacion: false,
  comentarios: ''
})

const handleEnviarCuestionario = async () => {
  isSubmitting.value = true
  
  try {
    // Aquí irá tu llamada a seguimientoApi.enviarRespuestas(...)
    await new Promise(resolve => setTimeout(resolve, 1200)) // Simulación
    
    cuestionarioHoy.value.respondido = true
    successMsg.value = 'Tus síntomas de hoy han sido registrados. Tu dentista ha sido notificado.'
    
    setTimeout(() => { successMsg.value = null }, 4000)
  } catch (error) {
    console.error('Error enviando cuestionario:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fade-in max-w-7xl mx-auto pb-10">
    
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Seguimiento</span>
        </div>
        <h1 class="font-display text-2xl font-extrabold text-black">Cuidados Postoperatorios</h1>
        <p class="text-sm text-muted mt-1">Sigue tus indicaciones y reporta tus síntomas diariamente.</p>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="successMsg" class="mb-6 flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl text-sm font-medium">
        <CheckCircle2 class="w-4 h-4 shrink-0" />
        {{ successMsg }}
      </div>
    </Transition>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <aside class="lg:col-span-1 space-y-6">
        <div class="bg-card border border-border rounded-3xl p-6 shadow-sm text-center">
          <div class="w-20 h-20 bg-accent-dim text-accent rounded-full flex items-center justify-center mx-auto mb-4 border-[4px] border-surface">
            <HeartPulse class="w-8 h-8" />
          </div>
          <h2 class="font-display text-lg font-bold text-black mb-1">Estado de Recuperación</h2>
          
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-wide mt-2">
            <CheckCircle2 class="w-3.5 h-3.5" />
            {{ seguimiento.estado }}
          </div>

          <div class="mt-6 pt-6 border-t border-border flex justify-between text-left">
            <div>
              <p class="text-[10px] text-muted font-bold uppercase tracking-wider">Días Restantes</p>
              <p class="text-xl font-bold text-black">{{ seguimiento.diasRestantes }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] text-muted font-bold uppercase tracking-wider">Nivel de Alerta</p>
              <p class="text-sm font-bold text-emerald-600 flex items-center justify-end gap-1">
                {{ seguimiento.nivelAlerta }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-blue-50/50 border border-blue-100 rounded-3xl p-5">
          <div class="flex items-start gap-3">
            <Info class="w-5 h-5 text-blue-500 shrink-0" />
            <p class="text-xs text-blue-800 leading-relaxed font-medium">
              Tu dentista está monitoreando tu progreso. Si presentas dolor insoportable o hemorragia, acude inmediatamente a la clínica.
            </p>
          </div>
        </div>
      </aside>

      <section class="lg:col-span-2 space-y-6">
        
        <div class="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-xl bg-accent-dim flex items-center justify-center">
              <FileText class="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 class="font-display font-bold text-black text-lg">Indicaciones Médicas</h3>
              <p class="text-xs text-muted">Sigue estas instrucciones al pie de la letra</p>
            </div>
          </div>
          
          <div class="bg-surface rounded-2xl p-5 border border-border">
            <p class="text-sm text-black leading-loose whitespace-pre-line font-medium">
              {{ seguimiento.indicaciones }}
            </p>
          </div>
        </div>

        <div class="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <ShieldAlert class="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 class="font-display font-bold text-black text-lg">Bitácora de Hoy</h3>
                <p class="text-xs text-muted">Requerido para tu evaluación diaria</p>
              </div>
            </div>
            
            <span v-if="cuestionarioHoy.respondido" class="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <CheckCircle2 class="w-4 h-4" />
              Completado
            </span>
          </div>

          <div v-if="cuestionarioHoy.respondido" class="text-center py-8">
            <CheckCircle2 class="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p class="text-sm font-bold text-black">¡Gracias por tu reporte!</p>
            <p class="text-xs text-muted mt-1">Vuelve mañana para continuar tu seguimiento.</p>
          </div>

          <form v-else @submit.prevent="handleEnviarCuestionario" class="space-y-6">
            
            <div>
              <label class="block text-xs font-bold text-muted uppercase mb-3">Nivel de dolor (0 = Sin dolor, 10 = Máximo dolor)</label>
              <input 
                type="range" 
                min="0" max="10" 
                v-model="cuestionarioHoy.dolor"
                class="w-full accent-accent"
              />
              <div class="flex justify-between text-xs font-bold text-black mt-2">
                <span>0</span>
                <span class="text-accent">{{ cuestionarioHoy.dolor }}</span>
                <span>10</span>
              </div>
            </div>

            <div class="h-px bg-border w-full"></div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="flex items-center justify-between p-4 bg-surface border border-border rounded-xl cursor-pointer hover:border-accent/50 transition-colors">
                <span class="text-sm font-bold text-black">¿Presentas sangrado abundante?</span>
                <input type="checkbox" v-model="cuestionarioHoy.sangrado" class="w-5 h-5 accent-accent rounded" />
              </label>

              <label class="flex items-center justify-between p-4 bg-surface border border-border rounded-xl cursor-pointer hover:border-accent/50 transition-colors">
                <span class="text-sm font-bold text-black">¿Tienes inflamación severa?</span>
                <input type="checkbox" v-model="cuestionarioHoy.inflamacion" class="w-5 h-5 accent-accent rounded" />
              </label>
            </div>

            <div>
              <label class="block text-xs font-bold text-muted uppercase mb-2">Comentarios adicionales (Opcional)</label>
              <textarea 
                v-model="cuestionarioHoy.comentarios"
                rows="3"
                placeholder="¿Sientes algo fuera de lo normal?"
                class="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"
              ></textarea>
            </div>

            <div class="pt-2 flex justify-end">
              <button 
                type="submit" 
                :disabled="isSubmitting"
                class="bg-accent text-white px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                <Send v-if="!isSubmitting" class="w-4 h-4" />
                <Clock v-else class="w-4 h-4 animate-spin" />
                {{ isSubmitting ? 'Enviando...' : 'Enviar Reporte' }}
              </button>
            </div>
          </form>

        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>