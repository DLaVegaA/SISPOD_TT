<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, computed } from 'vue'
import { useSessionStore } from '@/entities/session'
import { normalizeRole } from '@/shared/routes'
import { UiInput } from '@/shared/ui/UiInput'
import {
  Save, Loader2, MapPin, CheckCircle2, AlertCircle,
  Stethoscope, UserRound, Phone, Mail, Lock,
  Send, LinkIcon, Unlink, ExternalLink,
} from 'lucide-vue-next'

import { pacienteApi }  from '@/entities/perfilPaciente/api/perfilPacienteApi'
import { dentistaApi }  from '@/entities/dentista/api/dentistaApi'
import { asistenteApi } from '@/entities/asistente/api/asistenteApi'

// ── Session ───────────────────────────────────────────────────────────────────

const sessionStore = useSessionStore()
const role = computed(() => normalizeRole(sessionStore.role))

// ── Estado general del perfil ─────────────────────────────────────────────────

const isLoading  = ref(false)
const successMsg = ref<string | null>(null)
const errorMsg   = ref<string | null>(null)
const idEntidad  = ref<number | null>(null)
const tgLink = ref<string>('')

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  patient:   { label: 'Paciente',      color: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-200' },
  dentist:   { label: 'Dentista',      color: 'text-blue-800',    bg: 'bg-blue-100 border-blue-200' },
  assistant: { label: 'Asistente',     color: 'text-violet-800',  bg: 'bg-violet-100 border-violet-200' },
  admin:     { label: 'Administrador', color: 'text-amber-800',   bg: 'bg-amber-100 border-amber-200' },
}
const currentMeta = computed(() => roleMeta[role.value ?? ''] ?? { label: 'Usuario', color: 'text-gray-800', bg: 'bg-gray-100 border-gray-200' })

const formData = reactive({
  nombre: '', apellido_paterno: '', apellido_materno: '',
  telefono: '', correo: '', fecha_nacimiento: '',
  curp: '', cedula: '', genero: '',
  calle: '', num_ext: '', num_int: '',
  colonia: '', municipio: '', estado: '', codigo_postal: '',
})

const initials = computed(() =>
  ((formData.nombre?.[0] ?? '') + (formData.apellido_paterno?.[0] ?? '')).toUpperCase() || '?'
)
const fullName = computed(() =>
  [formData.nombre, formData.apellido_paterno, formData.apellido_materno].filter(Boolean).join(' ')
)

const camposEditables = computed(() => {
  if (role.value === 'patient')
    return ['nombre','apellido_paterno','apellido_materno','telefono','fecha_nacimiento',
            'genero','calle','num_ext','num_int','colonia','municipio','estado','codigo_postal']
  if (role.value === 'dentist')
    return ['nombre','apellido_paterno','apellido_materno','telefono','correo','cedula']
  if (role.value === 'assistant')
    return ['nombre','apellido_paterno','apellido_materno','telefono','correo']
  return []
})
const puedeEditar = (campo: string) => camposEditables.value.includes(campo)

const cargarPerfil = async () => {
  isLoading.value = true
  try {
    let data: any
    if (role.value === 'patient') {
      const res = await pacienteApi.obtenerMiPerfil() as any
      data = res.data ?? res; idEntidad.value = data.id_paciente ?? null
    } else if (role.value === 'dentist') {
      const res = await dentistaApi.obtenerMiPerfil() as any
      data = res.data ?? res; idEntidad.value = data.id_dentista ?? null
    } else if (role.value === 'assistant') {
      const res = await asistenteApi.obtenerMiPerfil() as any
      data = res.data ?? res; idEntidad.value = data.id_asistente ?? null
    } else { return }

    formData.nombre           = data.nombre ?? ''
    formData.apellido_paterno = data.apellido_paterno ?? ''
    formData.apellido_materno = data.apellido_materno ?? ''
    formData.telefono         = data.telefono ?? ''
    formData.correo           = data.correo ?? ''
    formData.genero           = data.genero ?? ''
    formData.curp             = data.curp ?? ''
    formData.cedula           = data.no_cedula ?? data.cedula ?? ''
    if (data.fecha_nacimiento)
      formData.fecha_nacimiento = new Date(data.fecha_nacimiento).toISOString().split('T')[0] ?? ''
    const dir = data.direccion ?? data.Direccion
    if (dir) {
      formData.calle         = dir.calle ?? ''; formData.num_ext = dir.num_ext ?? ''
      formData.num_int       = dir.num_int ?? ''; formData.colonia = dir.colonia ?? ''
      formData.municipio     = dir.municipio ?? ''; formData.estado = dir.estado ?? ''
      formData.codigo_postal = dir.codigo_postal ?? ''
    }
    if (sessionStore.user)
      Object.assign(sessionStore.user, { nombre: data.nombre, apellido_paterno: data.apellido_paterno })
  } catch {
    errorMsg.value = 'No se pudieron cargar los datos del perfil.'
  } finally {
    isLoading.value = false
  }
}

const handleUpdate = async () => {
  isLoading.value = true; successMsg.value = null; errorMsg.value = null
  try {
    if (role.value === 'patient') {
      await pacienteApi.actualizarPerfil(idEntidad.value!, formData)
    } else if (role.value === 'dentist') {
      await dentistaApi.actualizarPerfil(idEntidad.value!, {
        nombre: formData.nombre, apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno || '',
        telefono: formData.telefono, correo: formData.correo, cedula: formData.cedula,
      })
    } else if (role.value === 'assistant') {
      await asistenteApi.actualizarPerfil({
        nombre: formData.nombre, apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno || '',
        telefono: formData.telefono, correo: formData.correo,
      })
    }
    successMsg.value = '¡Perfil actualizado correctamente!'
    await cargarPerfil()
    setTimeout(() => { successMsg.value = null }, 3500)
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message ?? 'Ocurrió un error al guardar los cambios.'
  } finally {
    isLoading.value = false
  }
}

// ── Telegram ──────────────────────────────────────────────────────────────────

/** Estado de la vinculación */
type TgPhase = 'idle' | 'loading' | 'linked' | 'pending' | 'unlinking' | 'error'

const tgPhase        = ref<TgPhase>('idle')
const tgErrorMsg     = ref<string | null>(null)
const tgPollingTimer = ref<ReturnType<typeof setInterval> | null>(null)
const POLLING_MS     = 3000
const POLLING_MAX    = 20   // 20 × 3s = 60s máximo
const tgIsUnlinking = computed(() => tgPhase.value === 'unlinking')
const maxDate = new Date().toISOString().split('T')[0];

let pollingCount = 0

/** Consulta el estado y actualiza `tgPhase`. */
const consultarEstadoTelegram = async (): Promise<boolean> => {
  try {
    const res = await pacienteApi.telegramEstado() as any
    const vinculado: boolean = res?.vinculado ?? res?.data?.vinculado ?? false
    tgPhase.value = vinculado ? 'linked' : 'idle'
    return vinculado
  } catch {
    tgPhase.value = 'error'
    tgErrorMsg.value = 'No se pudo verificar el estado de Telegram.'
    return false
  }
}

/** Detiene el polling si está activo. */
const detenerPolling = () => {
  if (tgPollingTimer.value !== null) {
    clearInterval(tgPollingTimer.value)
    tgPollingTimer.value = null
    pollingCount = 0
  }
}

/**
 * Inicia el polling periódico que detecta cuándo el paciente completa
 * la vinculación desde el bot de Telegram.
 */
const iniciarPolling = () => {
  detenerPolling()
  pollingCount = 0
  tgPollingTimer.value = setInterval(async () => {
    pollingCount++
    const vinculado = await consultarEstadoTelegram()
    if (vinculado || pollingCount >= POLLING_MAX) {
      detenerPolling()
      if (!vinculado && pollingCount >= POLLING_MAX) {
        // Tiempo agotado sin vincular: volvemos a idle para que pueda reintentar
        tgPhase.value = 'idle'
      }
    }
  }, POLLING_MS)
}

/** Genera el token y abre el deep-link al bot. */
const handleVincular = async () => {
  tgPhase.value   = 'loading'
  tgErrorMsg.value = null
  tgLink.value     = ''
  try {
    const res = await pacienteApi.telegramGenerarToken() as any
    const link: string = res?.link ?? res?.data?.link ?? ''
    if (!link) throw new Error('El servidor no devolvió el link de vinculación.')

    tgLink.value  = link   // ← guarda el link
    tgPhase.value = 'pending'
    iniciarPolling()
  } catch (error: any) {
    tgPhase.value    = 'error'
    tgErrorMsg.value = error?.response?.data?.message ?? 'No se pudo generar el enlace de vinculación.'
  }
}

/** Solicita la desvinculación al backend. */
const handleDesvincular = async () => {
  tgPhase.value    = 'unlinking'
  tgErrorMsg.value = null
  try {
    await pacienteApi.telegramDesvincular()
    tgPhase.value = 'idle'
  } catch (error: any) {
    tgPhase.value    = 'error'
    tgErrorMsg.value = error?.response?.data?.message ?? 'No se pudo desvincular la cuenta de Telegram.'
  }
}

/** Permite al paciente verificar manualmente si ya vinculó. */
const handleReverificar = async () => {
  detenerPolling()
  tgPhase.value = 'loading'
  await consultarEstadoTelegram()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (sessionStore.status === 'unknown') await sessionStore.bootstrap()
  await cargarPerfil()
  if (role.value === 'patient') await consultarEstadoTelegram()
})

onUnmounted(() => {
  detenerPolling()
})
</script>

<template>
  <div class="fade-in pb-10">

    <!-- ── Breadcrumb + título ──────────────────────────────────────────── -->
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs text-muted/60 mb-2">
        <span>🏠</span><span>/</span>
        <span class="font-medium text-muted">Mi Perfil</span>
      </div>
      <h1 class="font-display text-3xl font-bold text-black">Mi Perfil</h1>
      <p class="text-sm text-muted mt-1">Consulta y actualiza tu información personal.</p>
    </div>

    <div class="max-w-3xl mx-auto">

    <!-- ── Hero card ─────────────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-3xl p-8 mb-6 shadow-sm flex flex-col items-center text-center gap-4">
      <div class="w-24 h-24 rounded-full bg-accent flex items-center justify-center shadow-sm shrink-0">
        <span class="text-3xl font-bold text-white font-display tracking-wide select-none">
          {{ initials }}
        </span>
      </div>
      <div class="flex flex-col items-center gap-2">
        <div class="flex items-center gap-2 flex-wrap justify-center">
          <h2 class="font-display text-xl font-bold text-black leading-tight">
            {{ fullName || '—' }}
          </h2>
          <span :class="['text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border', currentMeta.bg, currentMeta.color]">
            {{ currentMeta.label }}
          </span>
        </div>
        <p class="text-sm text-muted">{{ formData.correo || '—' }}</p>
      </div>
    </div>

    <!-- ── Alertas globales ───────────────────────────────────────────────── -->
    <div v-if="successMsg"
      class="flex items-center gap-3 mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ successMsg }}</span>
    </div>
    <div v-if="errorMsg"
      class="flex items-center gap-3 mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span>{{ errorMsg }}</span>
    </div>

    <!-- ── Datos personales ───────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-5">
      <div class="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-surface/60">
        <div class="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
          <UserRound class="w-3.5 h-3.5 text-accent" />
        </div>
        <h2 class="text-sm font-semibold text-black">Datos personales</h2>
      </div>
      <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">

        <UiInput v-model="formData.nombre"
          label="Nombre *" placeholder="Nombre(s)"
          :disabled="!puedeEditar('nombre')" />

        <UiInput v-model="formData.apellido_paterno"
          label="Apellido paterno *" placeholder="Apellido paterno"
          :disabled="!puedeEditar('apellido_paterno')" />

        <div class="relative">
          <UiInput v-model="formData.apellido_materno"
            label="Apellido materno" placeholder="Apellido materno (opcional)"
            :disabled="!puedeEditar('apellido_materno')" />
          <span class="absolute top-0 right-0 text-[10px] font-semibold text-muted/40 uppercase tracking-wider">
            opcional
          </span>
        </div>

        <UiInput v-model="formData.telefono"
          label="Teléfono *" placeholder="10 dígitos" type="tel"
          :disabled="!puedeEditar('telefono')" />

        <div class="relative">
          <UiInput v-model="formData.correo"
            label="Correo electrónico" placeholder="correo@ejemplo.com" type="email"
            :disabled="!puedeEditar('correo')" />
          <Lock v-if="!puedeEditar('correo')"
            class="absolute right-3 bottom-3 w-3.5 h-3.5 text-muted/40" />
        </div>

        <UiInput v-model="formData.fecha_nacimiento"
          label="Fecha de nacimiento" 
          type="date"
          :max="maxDate"
          :disabled="!puedeEditar('fecha_nacimiento')" />

        <div v-if="role === 'patient' || role === 'dentist'" class="relative">
          <UiInput v-model="formData.curp"
            label="CURP" placeholder="18 caracteres" :disabled="true" />
          <Lock class="absolute right-3 bottom-3 w-3.5 h-3.5 text-muted/40" />
        </div>

        <div v-if="role === 'patient'">
          <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Género
          </label>
          <select v-model="formData.genero"
            class="w-full border border-border rounded-xl py-2.5 px-3 text-sm text-black bg-surface focus:outline-none focus:border-accent transition-colors">
            <option value="">Seleccionar...</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="No especificado">Prefiero no decir</option>
          </select>
        </div>

      </div>
    </div>

    <!-- ── Datos profesionales — dentista ───────────────────────────── -->
    <div v-if="role === 'dentist'"
      class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-5">
      <div class="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-surface/60">
        <div class="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
          <Stethoscope class="w-3.5 h-3.5 text-accent" />
        </div>
        <h2 class="text-sm font-semibold text-black">Datos profesionales</h2>
      </div>
      <div class="p-5">
        <UiInput v-model="formData.cedula"
          label="Cédula profesional *" placeholder="No. de cédula" />
      </div>
    </div>

    <!-- ── Dirección — paciente ──────────────────────────────────────────── -->
    <div v-if="role === 'patient'"
      class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-5">
      <div class="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-surface/60">
        <div class="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
          <MapPin class="w-3.5 h-3.5 text-accent" />
        </div>
        <h2 class="text-sm font-semibold text-black">Dirección</h2>
      </div>
      <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <UiInput v-model="formData.calle"         label="Calle *"           placeholder="Nombre de la calle" />
        <UiInput v-model="formData.num_ext"        label="Núm. exterior *"   placeholder="Ej. 42" />
        <div class="relative">
          <UiInput v-model="formData.num_int"      label="Núm. interior"     placeholder="Ej. B" />
          <span class="absolute top-0 right-0 text-[10px] font-semibold text-muted/40 uppercase tracking-wider">
            opcional
          </span>
        </div>
        <UiInput v-model="formData.colonia"        label="Colonia *"         placeholder="Nombre de la colonia" />
        <UiInput v-model="formData.municipio"      label="Municipio *"       placeholder="Municipio o alcaldía" />
        <UiInput v-model="formData.estado"         label="Estado *"          placeholder="Estado de la república" />
        <UiInput v-model="formData.codigo_postal"  label="Código postal *"   placeholder="5 dígitos" />
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         ── Telegram — solo paciente ────────────────────────────────────────
         ══════════════════════════════════════════════════════════════════════ -->
    <div v-if="role === 'patient'"
      class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mb-5">

      <!-- Encabezado -->
      <div class="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-surface/60">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style="background-color: #e8f4fd;">
          <Send class="w-3.5 h-3.5" style="color: #2AABEE;" />
        </div>
        <h2 class="text-sm font-semibold text-black">Notificaciones vía Telegram</h2>
      </div>

      <div class="p-5">

        <!-- ── Cargando estado inicial ─── -->
        <div v-if="tgPhase === 'idle' && isLoading"
          class="flex items-center gap-3 text-sm text-muted">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Verificando estado...</span>
        </div>

        <!-- ── Vinculado ──────────────────────────────────────────────── -->
        <div v-else-if="tgPhase === 'linked'" class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-black">Cuenta vinculada</p>
              <p class="text-xs text-muted mt-0.5">
                Recibirás recordatorios de citas y seguimientos postoperatorios en Telegram.
              </p>
            </div>
          </div>
          <button
            @click="handleDesvincular"
            :disabled="tgIsUnlinking"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <Loader2 v-if="tgIsUnlinking" class="w-3.5 h-3.5 animate-spin" />
            <Unlink v-else class="w-3.5 h-3.5" />
            Desvincular
          </button>
        </div>

        <!-- ── Desvinculando ──────────────────────────────────────────── -->
        <div v-else-if="tgPhase === 'unlinking'"
          class="flex items-center gap-3 text-sm text-muted">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Desvinculando cuenta...</span>
        </div>

        <!-- ── Pendiente (link abierto, esperando al paciente) ────────── -->
        <div v-else-if="tgPhase === 'pending'" class="flex flex-col gap-4">
          <div class="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl">
            <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style="background-color: #d1edf9;">
              <Loader2 class="w-4 h-4 animate-spin" style="color: #2AABEE;" />
            </div>
            <div>
              <p class="text-sm font-semibold" style="color: #0e6fa8;">Esperando vinculación en Telegram</p>
              <p class="text-xs text-muted mt-1 leading-relaxed">
                Toca el botón para abrir el bot <strong>@ConsultorioGonzalez_bot</strong> en Telegram
                y presiona <strong>INICIAR</strong> para completar la vinculación.
              </p>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="handleReverificar"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-black hover:bg-accent-dim transition-colors">
              <CheckCircle2 class="w-3.5 h-3.5" />
              Ya vinculé mi cuenta
            </button>
            <a
              :href="tgLink"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-muted hover:bg-accent-dim transition-colors">
              <ExternalLink class="w-3.5 h-3.5" />
              Abrir Telegram
            </a>
          </div>
        </div>

        <!-- ── Cargando (generando token) ─────────────────────────────── -->
        <div v-else-if="tgPhase === 'loading'"
          class="flex items-center gap-3 text-sm text-muted">
          <Loader2 class="w-4 h-4 animate-spin" />
          <span>Generando enlace de vinculación...</span>
        </div>

        <!-- ── Error ──────────────────────────────────────────────────── -->
        <div v-else-if="tgPhase === 'error'" class="flex flex-col gap-3">
          <div class="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ tgErrorMsg }}</span>
          </div>
          <button
            @click="handleVincular"
            class="self-start inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-surface text-xs font-semibold text-black hover:bg-accent-dim transition-colors">
            <LinkIcon class="w-3.5 h-3.5" />
            Reintentar
          </button>
        </div>

        <!-- ── Idle — no vinculado ────────────────────────────────────── -->
        <div v-else class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 mt-0.5">
              <Send class="w-4 h-4 text-muted/60" />
            </div>
            <div>
              <p class="text-sm font-semibold text-black">Telegram no vinculado</p>
              <p class="text-xs text-muted mt-0.5">
                Vincula tu cuenta para recibir recordatorios de citas y cuestionarios postoperatorios directamente en Telegram.
              </p>
            </div>
          </div>
          <button
            @click="handleVincular"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors shrink-0 hover:opacity-90 active:scale-95"
            style="background-color: #2AABEE;">
            <LinkIcon class="w-3.5 h-3.5" />
            Vincular con Telegram
          </button>
        </div>

      </div>
    </div>
    <!-- ══ fin Telegram ═══════════════════════════════════════════════════════ -->

    <!-- ── Guardar ────────────────────────────────────────────────────────── -->
    <div class="flex justify-end">
      <button
        @click="handleUpdate"
        :disabled="isLoading"
        class="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
        <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
        <Save v-else class="w-4 h-4" />
        Guardar cambios
      </button>
    </div>

    </div>
  </div>
</template>