<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useSessionStore } from '@/entities/session'
import { normalizeRole } from '@/shared/routes'
import { UiInput } from '@/shared/ui/UiInput'
import {
  Save, Loader2, MapPin, CheckCircle2, AlertCircle,
  Stethoscope, UserRound, Phone, Mail, Lock,
} from 'lucide-vue-next'

import { pacienteApi }  from '@/entities/perfilPaciente/api/perfilPacienteApi'
import { dentistaApi }  from '@/entities/dentista/api/dentistaApi'
import { asistenteApi } from '@/entities/asistente/api/asistenteApi'

const sessionStore = useSessionStore()
const role = computed(() => normalizeRole(sessionStore.role))

const isLoading  = ref(false)
const successMsg = ref<string | null>(null)
const errorMsg   = ref<string | null>(null)
const idEntidad  = ref<number | null>(null)

const roleMeta: Record<string, { label: string; color: string; bg: string }> = {
  patient:   { label: 'Paciente',      color: 'text-emerald-800', bg: 'bg-emerald-100 border-emerald-200' },
  dentist:   { label: 'Dentista',      color: 'text-blue-800',    bg: 'bg-blue-100 border-blue-200' },
  assistant: { label: 'Asistente',     color: 'text-violet-800',  bg: 'bg-violet-100 border-violet-200' },
  admin:     { label: 'Administrador', color: 'text-amber-800',   bg: 'bg-amber-100 border-amber-200' },
}
const currentMeta = computed(() => roleMeta[role.value ?? ''] ?? roleMeta['admin'])

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
      const res = await pacienteApi.obtenerMiPerfil()
      data = res.data ?? res; idEntidad.value = data.id_paciente ?? null
    } else if (role.value === 'dentist') {
      const res = await dentistaApi.obtenerMiPerfil()
      data = res.data ?? res; idEntidad.value = data.id_dentista ?? null
    } else if (role.value === 'assistant') {
      const res = await asistenteApi.obtenerMiPerfil()
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
      formData.calle = dir.calle ?? ''; formData.num_ext = dir.num_ext ?? ''
      formData.num_int = dir.num_int ?? ''; formData.colonia = dir.colonia ?? ''
      formData.municipio = dir.municipio ?? ''; formData.estado = dir.estado ?? ''
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
        apellido_materno: formData.apellido_materno || null,
        telefono: formData.telefono, correo: formData.correo, cedula: formData.cedula,
      })
    } else if (role.value === 'assistant') {
      await asistenteApi.actualizarPerfil({
        nombre: formData.nombre, apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno || null,
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

onMounted(async () => {
  if (sessionStore.status === 'unknown') await sessionStore.bootstrap()
  await cargarPerfil()
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

      <!-- Avatar grande -->
      <div class="w-24 h-24 rounded-full bg-accent flex items-center justify-center shadow-sm shrink-0">
        <span class="text-3xl font-bold text-white font-display tracking-wide select-none">
          {{ initials }}
        </span>
      </div>

      <!-- Nombre + badge -->
      <div class="flex flex-col items-center gap-2">
        <div class="flex items-center gap-2 flex-wrap justify-center">
          <h2 class="font-display text-xl font-bold text-black leading-tight">
            {{ fullName || '—' }}
          </h2>
          <span
            :class="['text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border', currentMeta.bg, currentMeta.color]"
          >
            {{ currentMeta.label }}
          </span>
        </div>

        <!-- Contacto -->
        <div class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-1">
          <span class="flex items-center gap-1.5 text-xs text-muted/70">
            <Mail class="w-3.5 h-3.5 shrink-0" />
            {{ formData.correo || '—' }}
          </span>
          <span v-if="formData.telefono" class="flex items-center gap-1.5 text-xs text-muted/70">
            <Phone class="w-3.5 h-3.5 shrink-0" />
            {{ formData.telefono }}
          </span>
        </div>
      </div>
    </div>

    <!-- Skeleton mientras carga -->
    <div v-if="isLoading && !formData.nombre" class="space-y-4 animate-pulse">
      <div class="h-48 bg-surface rounded-2xl" />
      <div class="h-24 bg-surface rounded-2xl" />
    </div>

    <form v-else @submit.prevent="handleUpdate" class="space-y-5">

      <!-- ── Datos personales ──────────────────────────────────────────── -->
      <div class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
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
            label="Fecha de nacimiento" type="date"
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
        class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
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

      <!-- ── Dirección — paciente ──────────────────────────────────────── -->
      <div v-if="role === 'patient'"
        class="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div class="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-surface/60">
          <div class="w-7 h-7 rounded-lg bg-accent-dim flex items-center justify-center shrink-0">
            <MapPin class="w-3.5 h-3.5 text-accent" />
          </div>
          <h2 class="text-sm font-semibold text-black">Dirección</h2>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <UiInput v-model="formData.calle"        label="Calle *"                placeholder="Nombre de la calle" />
          <UiInput v-model="formData.num_ext"       label="Núm. exterior *"        placeholder="Ej. 42" />
          <div class="relative">
            <UiInput v-model="formData.num_int"     label="Núm. interior"          placeholder="Ej. 3B" />
            <span class="absolute top-0 right-0 text-[10px] font-semibold text-muted/40 uppercase tracking-wider">opcional</span>
          </div>
          <UiInput v-model="formData.colonia"       label="Colonia *"              placeholder="Colonia" />
          <UiInput v-model="formData.municipio"     label="Municipio / Alcaldía *" placeholder="Municipio" />
          <UiInput v-model="formData.estado"        label="Estado *"               placeholder="Estado" />
          <UiInput v-model="formData.codigo_postal" label="Código postal *"        placeholder="5 dígitos" />
        </div>
      </div>

      <!-- ── Alertas ───────────────────────────────────────────────────── -->
      <div v-if="successMsg"
        class="flex items-center gap-2.5 text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl">
        <CheckCircle2 class="w-4 h-4 shrink-0 text-emerald-600" />
        {{ successMsg }}
      </div>
      <div v-if="errorMsg"
        class="flex items-center gap-2.5 text-sm font-medium text-red-800 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
        <AlertCircle class="w-4 h-4 shrink-0 text-red-600" />
        {{ errorMsg }}
      </div>

      <!-- ── Footer ────────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between pt-1">
        <p class="text-xs text-muted/50">Los campos con * son obligatorios</p>
        <button type="submit" :disabled="isLoading"
          class="flex items-center gap-2 bg-ink/65 hover:bg-ink/80 text-text-secondary px-5 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm">
          <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
          <Save v-else class="w-4 h-4" />
          {{ isLoading ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </form>

    </div><!-- /max-w-3xl -->
  </div>
</template>

<style scoped>
.fade-in { animation: fadeIn 0.25s ease; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>