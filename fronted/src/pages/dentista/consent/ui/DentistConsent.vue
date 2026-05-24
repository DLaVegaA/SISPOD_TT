<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  X,
  FileText,
  ExternalLink,
  Loader2,
  FileBadge,
  CalendarDays,
  ShieldCheck,
  UploadCloud,
  File as FileIcon,
  Trash2,
} from 'lucide-vue-next'
import { consentimientoApi } from '@/entities/consentimiento' // Ajusta tu alias
import type { ConsentimientoVista, CitaOpcion } from '@/entities/consentimiento'

// ── State ─────────────────────────────────────────────────────────────────
const consentimientos = ref<ConsentimientoVista[]>([])

const searchQuery = ref('')
const isLoading = ref(true)
const route = useRoute()
const citaSeleccionada = ref<string>('')

// ── Dropzone State ────────────────────────────────────────────────────────
const isUploadModalOpen = ref(false)
const isDragging = ref(false)
const isUploading = ref(false)
const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const citasDisponibles = ref<CitaOpcion[]>([])

// ── Computed ──────────────────────────────────────────────────────────────
const filteredConsentimientos = computed(() => {
  const q = searchQuery.value.toLowerCase().trim() // Quitamos espacios extras
  if (!q) return consentimientos.value

  return consentimientos.value.filter((c) => {
    return (
      c.pacienteNombre.toLowerCase().includes(q) ||
      c.citaProcedimiento.toLowerCase().includes(q) ||
      // Convertimos a string por si el expediente viene como número de la DB
      String(c.pacienteExpediente).toLowerCase().includes(q)
    )
  })
})

// ── Helpers Vista ─────────────────────────────────────────────────────────
function formatearFechaLarga(fechaStr: string): string {
  if (!fechaStr) return ''
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(fechaStr))
}

function formatearHora(fechaStr: string): string {
  if (!fechaStr) return ''
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(fechaStr))
}

function getInitials(name: string): string {
  if (!name) return ''
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
}

const CARD_ACCENTS = [
  {
    dot: 'bg-accent',
    ring: 'ring-accent/20',
    avatar: 'bg-accent/10 text-accent border-accent/20',
    tag: 'bg-accent/10 text-accent',
  },
  {
    dot: 'bg-indigo-400',
    ring: 'ring-indigo-400/20',
    avatar: 'bg-indigo-500/10 text-indigo-600 border-indigo-400/20',
    tag: 'bg-indigo-500/10 text-indigo-600',
  },
  {
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-400/20',
    avatar: 'bg-emerald-500/10 text-emerald-600 border-emerald-400/20',
    tag: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    dot: 'bg-amber-400',
    ring: 'ring-amber-400/20',
    avatar: 'bg-amber-500/10 text-amber-600 border-amber-400/20',
    tag: 'bg-amber-500/10 text-amber-600',
  },
]
function accentFor(index: number) {
  return CARD_ACCENTS[index % CARD_ACCENTS.length]!
}
function clearSearch() {
  searchQuery.value = ''
}

// ── API Calls ─────────────────────────────────────────────────────────────
async function fetchConsentimientos() {
  isLoading.value = true
  try {
    consentimientos.value = await consentimientoApi.getAll()
  } catch (error) {
    console.error('Error al cargar:', error)
  } finally {
    isLoading.value = false
  }
}

async function fetchCitasDisponibles() {
  try {
    // Llamamos a la API de forma limpia
    citasDisponibles.value = await consentimientoApi.getCitasDisponibles()
  } catch (error) {
    console.error('Error al cargar citas disponibles:', error)
  }
}

// ── Dropzone Logic ────────────────────────────────────────────────────────
function openModal() {
  isUploadModalOpen.value = true
  fetchCitasDisponibles()
}
function closeModal() {
  isUploadModalOpen.value = false
  selectedFile.value = null
  isDragging.value = false
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const fileManual = target.files?.[0]
  if (fileManual) {
    validateAndSetFile(fileManual)
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const files = event.dataTransfer?.files
  const fileDrop = files?.[0]
  if (fileDrop) {
    validateAndSetFile(fileDrop)
  }
}

function validateAndSetFile(file: File) {
  if (file.type !== 'application/pdf') {
    alert('Por favor, selecciona un archivo PDF.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    // Límite de 5MB
    alert('El archivo es demasiado grande. Máximo 5MB.')
    return
  }
  selectedFile.value = file
}

function removeFile() {
  selectedFile.value = null
}

async function submitFile() {
  if (!selectedFile.value) return
  if (!citaSeleccionada.value) {
    alert('Por favor, selecciona una cita primero.')
    return
  }

  isUploading.value = true
  try {
    // Mandamos el archivo y el id_cita exacto que seleccionó el dentista
    await consentimientoApi.upload(selectedFile.value, citaSeleccionada.value)

    closeModal()
    // Limpiamos el selector para la próxima vez
    citaSeleccionada.value = ''
    await fetchConsentimientos()
  } catch (error) {
    console.error('Error al subir:', error)
    alert('Hubo un error al subir el archivo.')
  } finally {
    isUploading.value = false
  }
}

async function abrirDocumento(idCita: number) {
  if (!idCita) return

  try {
    // Pedimos la URL temporal al backend
    const urlTemporal = await consentimientoApi.getUrlDocumento(idCita)

    if (urlTemporal) {
      // Abrimos la URL en una nueva pestaña
      window.open(urlTemporal, '_blank')
    } else {
      alert('No se recibió la URL del documento.')
    }
  } catch (error) {
    console.error('Error al abrir el documento:', error)
    alert('No se pudo generar el enlace del documento.')
  }
}

async function eliminarDocumento(idCita: number) {
  if (!idCita) return

  // Pedimos confirmación al usuario
  const confirmado = confirm(
    '¿Estás seguro de que deseas eliminar este consentimiento? Esta acción no se puede deshacer.',
  )

  if (!confirmado) return

  try {
    // Llamamos a la API para eliminar
    await consentimientoApi.delete(idCita)

    // Recargamos la lista para que desaparezca la tarjeta
    await fetchConsentimientos()
  } catch (error) {
    console.error('Error al eliminar:', error)
    alert('Hubo un error al eliminar el documento.')
  }
}

onMounted(fetchConsentimientos)
</script>

<template>
  <div class="fade-in mx-auto pb-10">
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Consentimientos</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Consentimientos Informados</h1>
        <p class="text-sm text-muted mt-1">
          Documentos firmados por los pacientes antes de cada procedimiento.
        </p>
      </div>

      <button
        @click="openModal"
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 self-start md:self-auto"
      >
        <FileText class="w-4 h-4" />
        Nuevo Consentimiento
      </button>
    </div>

    <!-- ── Search + count row ─────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div class="relative max-w-md w-full">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por paciente, expediente o procedimiento..."
          class="w-full pl-10 pr-9 py-2.5 bg-card border border-border rounded-2xl text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70"
          @click="clearSearch"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center gap-3 shrink-0">
        <div
          class="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-2xl shadow-sm"
        >
          <ShieldCheck class="w-4 h-4 text-accent" />
          <span class="text-sm font-bold text-black">{{ consentimientos.length }}</span>
          <span class="text-xs text-muted">documentos</span>
        </div>
        <div
          v-if="searchQuery"
          class="flex items-center gap-2 px-4 py-2 bg-accent/5 border border-accent/20 rounded-2xl"
        >
          <span class="text-sm font-bold text-accent">{{ filteredConsentimientos.length }}</span>
          <span class="text-xs text-accent/70">resultados</span>
        </div>
      </div>
    </div>

    <!-- ── Loading ────────────────────────────────────────────────────── -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-32 gap-3 text-muted/50"
    >
      <Loader2 class="w-10 h-10 animate-spin text-accent/50" />
      <p class="text-sm font-medium">Cargando consentimientos...</p>
    </div>

    <!-- ── Empty state ────────────────────────────────────────────────── -->
    <div
      v-else-if="filteredConsentimientos.length === 0"
      class="flex flex-col items-center justify-center py-32 gap-3 text-muted/40"
    >
      <FileBadge class="w-14 h-14" />
      <p class="text-sm font-medium">No se encontraron consentimientos</p>
      <p class="text-xs">Intenta con otros términos de búsqueda</p>
    </div>

    <!-- ── Document grid ──────────────────────────────────────────────── -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="(item, index) in filteredConsentimientos"
        :key="item.id"
        class="group bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col"
      >
        <!-- Document preview area -->
        <div
          class="relative bg-surface/60 px-6 pt-7 pb-5 border-b border-border flex items-end gap-4"
        >
          <!-- Colored dot accent -->
          <div :class="['absolute top-4 right-4 w-2 h-2 rounded-full', accentFor(index).dot]" />

          <!-- PDF icon mock -->
          <div class="relative shrink-0">
            <div
              class="w-14 h-16 bg-card border border-border rounded-xl flex items-center justify-center shadow-sm"
            >
              <FileText class="w-7 h-7 text-muted/40" />
            </div>
            <!-- PDF badge -->
            <span
              class="absolute -bottom-2 -right-2 text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-md tracking-wider"
              >PDF</span
            >
          </div>

          <!-- Patient info -->
          <div class="min-w-0 pb-1">
            <div
              :class="[
                'w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-xs mb-2',
                accentFor(index).avatar,
              ]"
            >
              {{ getInitials(item.pacienteNombre) }}
            </div>
            <p class="text-sm font-bold text-black leading-tight truncate">
              {{ item.pacienteNombre }}
            </p>
            <p class="text-[10px] text-muted font-mono mt-0.5">{{ item.pacienteExpediente }}</p>
          </div>
        </div>

        <!-- Card body -->
        <div class="px-5 py-4 flex flex-col gap-3 flex-1">
          <!-- Procedure -->
          <div>
            <p class="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
              Procedimiento
            </p>
            <p class="text-sm font-semibold text-black leading-snug">
              {{ item.citaProcedimiento }}
            </p>
          </div>

          <!-- Date + time row -->
          <div class="flex items-center gap-4 pt-1 border-t border-border">
            <div class="flex items-center gap-1.5 text-xs text-muted">
              <CalendarDays class="w-3.5 h-3.5 shrink-0" />
              <span>{{ formatearFechaLarga(item.fecha) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-muted -mt-1.5">
            <span :class="['w-3.5 h-3.5 shrink-0']" />
            <span class="font-medium">{{ formatearHora(item.fecha) }}</span>
          </div>
        </div>

        <!-- Card actions -->
        <div class="px-5 py-3.5 border-t border-border bg-surface/40 flex items-center gap-2">
          <button
            @click="abrirDocumento(item.idCita)"
            class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent text-white rounded-xl text-xs font-bold hover:bg-accent/90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm shadow-accent/20 cursor-pointer"
          >
            <ExternalLink class="w-3.5 h-3.5" />
            Ver Documento
          </button>

          <button
            @click="eliminarDocumento(item.idCita)"
            class="p-2.5 rounded-xl border border-border text-muted hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer"
            title="Eliminar Consentimiento"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="isUploadModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm fade-in"
    >
      <div
        class="bg-card w-full max-w-lg rounded-3xl shadow-xl border border-border overflow-hidden flex flex-col"
      >
        <!-- Header Modal -->
        <div
          class="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/40"
        >
          <h2 class="text-lg font-bold text-black">Subir Consentimiento</h2>
          <button
            @click="closeModal"
            class="p-2 rounded-xl text-muted hover:bg-black/5 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Body Modal -->
        <div class="p-6 flex flex-col gap-4">
          <!-- Selector de Cita -->
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-bold text-black">Seleccionar Cita</label>
            <select
              v-model="citaSeleccionada"
              class="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              <option value="" disabled>Selecciona la cita del paciente...</option>

              <!-- ESTE ES EL CICLO QUE CONSTRUYE LAS CITAS REALES -->
              <option v-for="cita in citasDisponibles" :key="cita.id_cita" :value="cita.id_cita">
                Cita #{{ cita.id_cita }} - {{ cita.pacienteNombre }} ({{ cita.procedimiento }} -
                {{ cita.fecha }})
              </option>
            </select>
          </div>

          <!-- Zona Drag & Drop -->
          <div
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @click="!selectedFile && triggerFileInput()"
            :class="[
              'relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl transition-all duration-200',
              selectedFile
                ? 'border-border bg-surface/30 cursor-default'
                : 'cursor-pointer hover:bg-accent/5 hover:border-accent/50',
              isDragging
                ? 'border-accent bg-accent/10 scale-[1.02]'
                : 'border-border bg-surface/50',
            ]"
          >
            <input
              type="file"
              ref="fileInputRef"
              class="hidden"
              accept="application/pdf"
              @change="handleFileSelect"
            />
            <!-- Estado 1: Sin archivo -->
            <template v-if="!selectedFile">
              <div class="p-4 bg-card rounded-full shadow-sm mb-3 text-accent">
                <UploadCloud class="w-8 h-8" />
              </div>
              <p class="text-sm font-bold text-black">Haz clic o arrastra un PDF aquí</p>
              <p class="text-xs text-muted mt-1">Tamaño máximo: 5MB</p>
            </template>

            <!-- Estado 2: Archivo seleccionado -->
            <template v-else>
              <div class="absolute inset-0 p-4 flex flex-col">
                <div class="flex-1 flex items-center justify-center gap-3">
                  <div
                    class="w-12 h-14 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20 text-red-500"
                  >
                    <FileIcon class="w-6 h-6" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-bold text-black truncate pr-4">{{
                      selectedFile.name
                    }}</span>
                    <span class="text-xs text-muted"
                      >{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span
                    >
                  </div>
                </div>
                <button
                  @click.stop="removeFile"
                  class="mx-auto mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 class="w-3.5 h-3.5" /> Quitar archivo
                </button>
              </div>
            </template>
          </div>
        </div>

        <!-- Footer Modal -->
        <div class="px-6 py-4 border-t border-border bg-surface/40 flex justify-end gap-3">
          <button
            @click="closeModal"
            class="px-5 py-2.5 rounded-xl text-sm font-bold text-muted hover:text-black hover:bg-black/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            @click="submitFile"
            :disabled="!selectedFile || isUploading"
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin" />
            {{ isUploading ? 'Subiendo...' : 'Subir Documento' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
