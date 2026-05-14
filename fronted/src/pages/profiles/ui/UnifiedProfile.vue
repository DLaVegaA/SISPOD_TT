<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useSessionStore } from '@/entities/session'
import { normalizeRole } from '@/shared/routes'
import { UiInput } from '@/shared/ui/UiInput'
import {
  User,
  Mail,
  Shield,
  Save,
  Loader2,
  Info,
  MapPin,
  CheckCircle2,
  AlertCircle,
  BadgeCheck
} from 'lucide-vue-next'

// Importa las APIs necesarias (ajusta las rutas según tu proyecto para dentista/asistente)
import { pacienteApi } from '@/entities/perfilPaciente/api/perfilPacienteApi'
// import { dentistaApi } from '@/entities/dentista/api/dentistaApi' 
// import { asistenteApi } from '@/entities/asistente/api/asistenteApi'

const sessionStore = useSessionStore()
const role = computed(() => normalizeRole(sessionStore.role))

const isLoading = ref(false)
const successMsg = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const idUsuarioActual = ref<number | null>(null)

// Diccionario para mostrar el nombre del rol en la UI
const roleLabels: Record<string, string> = {
  patient: 'Paciente',
  dentist: 'Dentista',
  assistant: 'Asistente',
  admin: 'Administrador'
}
const displayRole = computed(() => roleLabels[role.value || ''] || 'Usuario')

// Unificamos todos los campos posibles en el formData
const formData = reactive({
  nombre: '',
  apellido_paterno: '',
  apellido_materno: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: '',
  curp: '',          // Exclusivo o principal en paciente
  cedula: '',        // Exclusivo de dentista
  genero: '',
  calle: '',
  num_ext: '',
  num_int: '',
  colonia: '',
  municipio: '',
  estado: '',
  codigo_postal: '',
})

// FUNCIÓN DINÁMICA: Pide los datos frescos dependiendo del rol
const cargarPerfilFresco = async () => {
  try {
    let res: any

    // 1. Llamar a la API correcta según el rol
    if (role.value === 'patient') {
      res = await pacienteApi.obtenerMiPerfil()
    } else if (role.value === 'dentist') {
      // res = await dentistaApi.obtenerMiPerfil()
      res = { data: sessionStore.user } // Fallback temporal mientras conectas la API real
    } else {
      // res = await asistenteApi.obtenerMiPerfil()
      res = { data: sessionStore.user } // Fallback temporal
    }

    const data = res.data || res

    idUsuarioActual.value = data.id_paciente || data.id_dentista || data.id || null

    // 2. Mapear datos comunes
    formData.nombre = data.nombre || ''
    formData.apellido_paterno = data.apellido_paterno || ''
    formData.apellido_materno = data.apellido_materno || ''
    formData.telefono = data.telefono || ''
    formData.correo = data.correo || data.email || ''
    formData.genero = data.genero || ''
    
    // 3. Mapear datos específicos
    formData.curp = data.curp || ''
    formData.cedula = data.cedula || data.noCedula || ''

    // 4. Formatear Fecha
    if (data.fecha_nacimiento) {
      const partesFecha = new Date(data.fecha_nacimiento).toISOString().split('T')
      formData.fecha_nacimiento = partesFecha[0] || ''
    } else {
      formData.fecha_nacimiento = ''
    }

    // 5. Dirección (Asumiendo que todos comparten la misma estructura de dirección)
    const dir = data.direccion || data.Direccion
    if (dir) {
      formData.calle = dir.calle || ''
      formData.num_ext = dir.num_ext || ''
      formData.num_int = dir.num_int || ''
      formData.colonia = dir.colonia || ''
      formData.municipio = dir.municipio || ''
      formData.estado = dir.estado || ''
      formData.codigo_postal = dir.codigo_postal || ''
    }

    // Actualizamos el store manual para el Sidebar
    if (sessionStore.user) {
      Object.assign(sessionStore.user, data)
    }
  } catch (error) {
    console.error('Error al cargar datos frescos del backend:', error)
  }
}

onMounted(async () => {
  if (sessionStore.status === 'unknown') {
    await sessionStore.bootstrap()
  }
  await cargarPerfilFresco()
})

const handleUpdate = async () => {
  if (!idUsuarioActual.value) {
    errorMsg.value = 'No se encontró el identificador del usuario.'
    return
  }

  isLoading.value = true
  successMsg.value = null
  errorMsg.value = null

  try {
    // Petición dinámica de actualización según rol
    if (role.value === 'patient') {
      await pacienteApi.actualizarPerfil(idUsuarioActual.value, formData)
    } else if (role.value === 'dentist') {
      // await dentistaApi.actualizarPerfil(idUsuarioActual.value, formData)
    } else {
      // await asistenteApi.actualizarPerfil(idUsuarioActual.value, formData)
    }

    successMsg.value = '¡Perfil actualizado correctamente!'
    await cargarPerfilFresco()

    setTimeout(() => {
      successMsg.value = null
    }, 3000)
  } catch (error: any) {
    console.error('Error actualizando perfil:', error)
    errorMsg.value = error.response?.data?.message || 'Ocurrió un error al guardar los cambios.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="fade-in max-w-6xl mx-auto pb-10">
    <div class="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Perfil</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Configuración de Perfil</h1>
        <p class="text-sm text-muted mt-1">Gestiona tu información personal y datos de contacto.</p>
      </div>
    </div>

    <div class="mt-6">
      <Transition name="fade">
        <div v-if="successMsg" class="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-2xl text-sm font-medium mb-4">
          <CheckCircle2 class="w-4 h-4 shrink-0" />
          {{ successMsg }}
        </div>
      </Transition>

      <Transition name="fade">
        <div v-if="errorMsg" class="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-400/30 text-red-600 rounded-2xl text-sm font-medium mb-4">
          <AlertCircle class="w-4 h-4 shrink-0" />
          {{ errorMsg }}
        </div>
      </Transition>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <aside class="lg:col-span-1">
        <div class="bg-card border border-border rounded-2xl p-6 text-center shadow-sm flex flex-col items-center">
          <div class="w-24 h-24 bg-accent-dim text-accent rounded-3xl flex items-center justify-center mb-5 text-3xl font-display font-extrabold shadow-sm">
            {{ formData.nombre.charAt(0) || 'U' }}{{ formData.apellido_paterno.charAt(0) || '' }}
          </div>
          <h3 class="font-display text-lg font-bold text-black">
            {{ formData.nombre }} {{ formData.apellido_paterno }}
          </h3>
          <p class="text-sm text-muted mt-1">{{ formData.correo }}</p>

          <div class="w-full mt-6 pt-6 border-t border-border flex flex-col gap-3">
            <div class="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
              <div class="flex items-center gap-2">
                <Shield class="w-4 h-4 text-accent" />
                <span class="text-xs font-bold text-black">Rol del Sistema</span>
              </div>
              <span class="px-2.5 py-1 bg-accent/10 text-accent text-[10px] font-bold rounded-md uppercase tracking-wide">
                {{ displayRole }}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <section class="lg:col-span-2">
        <form @submit.prevent="handleUpdate" class="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-10">
          
          <div>
            <div class="flex items-center gap-2 mb-6">
              <div class="w-8 h-8 rounded-xl bg-accent-dim flex items-center justify-center">
                <User class="w-4 h-4 text-accent" />
              </div>
              <h3 class="font-display font-bold text-black text-base">Información Básica</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UiInput v-model="formData.nombre" label="Nombre(s) *" variant="primary" />
              <UiInput v-model="formData.apellido_paterno" label="Primer Apellido *" variant="primary" />
              <UiInput v-model="formData.apellido_materno" label="Segundo Apellido *" variant="primary" />
              <UiInput v-model="formData.fecha_nacimiento" label="Fecha de Nacimiento *" type="date" variant="primary" />
            </div>
          </div>

          <div class="h-px bg-border w-full"></div>

          <div>
            <div class="flex items-center gap-2 mb-6">
              <div class="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <MapPin class="w-4 h-4 text-emerald-600" />
              </div>
              <h3 class="font-display font-bold text-black text-base">Dirección de Residencia</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-2">
                <UiInput v-model="formData.calle" label="Calle *" variant="primary" placeholder="Ej. Av. Politécnico Nacional" />
              </div>
              <UiInput v-model="formData.codigo_postal" label="Código Postal *" variant="primary" maxlength="5" />
              <UiInput v-model="formData.num_ext" label="Num. Exterior *" variant="primary" />
              <UiInput v-model="formData.num_int" label="Num. Interior (Opcional)" variant="primary" />
              <UiInput v-model="formData.colonia" label="Colonia *" variant="primary" />
              <UiInput v-model="formData.estado" label="Estado *" variant="primary" />
              <div class="md:col-span-2">
                <UiInput v-model="formData.municipio" label="Municipio / Alcaldía *" variant="primary" />
              </div>
            </div>
          </div>

          <div class="h-px bg-border w-full"></div>

          <div>
            <div class="flex items-center gap-2 mb-6">
              <div class="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Mail class="w-4 h-4 text-indigo-600" />
              </div>
              <h3 class="font-display font-bold text-black text-base">Identificación y Contacto</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <UiInput
                v-if="role === 'patient'"
                v-model="formData.curp"
                label="CURP *"
                variant="primary"
                disabled
                title="El CURP no es editable"
              />

              <UiInput
                v-if="role === 'dentist'"
                v-model="formData.cedula"
                label="Cédula Profesional *"
                variant="primary"
              />

              <UiInput v-model="formData.telefono" label="Teléfono *" variant="primary" maxlength="10" />
              
              <div class="md:col-span-2 space-y-3">
                <UiInput v-model="formData.correo" label="Correo Electrónico *" variant="primary" disabled />
                <div class="flex items-start gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <Info class="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p class="text-xs text-blue-700/80 leading-relaxed font-medium">
                    Para cambios en datos de identidad principales o correo electrónico, acuda a recepción o contacte al administrador.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 flex justify-end">
            <button
              type="submit"
              :disabled="isLoading"
              class="bg-accent text-white px-8 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              <Save v-else class="w-4 h-4" />
              {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>