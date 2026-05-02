<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, X, FileText, ExternalLink, Download, ChevronDown, Loader2 } from 'lucide-vue-next'

// ── Types ─────────────────────────────────────────────────────────────────
interface Consentimiento {
  id: string
  pacienteNombre: string
  pacienteExpediente: string
  fecha: string
  citaProcedimiento: string
  archivoUrl: string
}

// ── State ─────────────────────────────────────────────────────────────────
const consentimientos = ref<Consentimiento[]>([])
const searchQuery = ref('')
const isLoading = ref(true)

// ── Computed ──────────────────────────────────────────────────────────────
const filteredConsentimientos = computed(() => {
  if (!searchQuery.value.trim()) return consentimientos.value
  const query = searchQuery.value.toLowerCase()
  return consentimientos.value.filter(
    (c) =>
      c.pacienteNombre.toLowerCase().includes(query) ||
      c.citaProcedimiento.toLowerCase().includes(query) ||
      c.pacienteExpediente.toLowerCase().includes(query),
  )
})

// ── Helpers ───────────────────────────────────────────────────────────────
function formatearFecha(fechaStr: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(fechaStr))
}

function formatearFechaCorta(fechaStr: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(fechaStr))
}

function formatearHora(fechaStr: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(fechaStr))
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
}

function clearSearch() {
  searchQuery.value = ''
}

// ── Data ──────────────────────────────────────────────────────────────────
async function fetchConsentimientos() {
  isLoading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 800))
    consentimientos.value = [
      {
        id: '1',
        pacienteNombre: 'María González López',
        pacienteExpediente: 'EXP-045',
        fecha: '2026-04-15T10:30:00',
        citaProcedimiento: 'Extracción de tercer molar (Cirugía)',
        archivoUrl: 'https://sistorage.blob.core.windows.net/consentimientos/maria_gonzalez_doc.pdf',
      },
      {
        id: '2',
        pacienteNombre: 'Carlos Ruiz Sánchez',
        pacienteExpediente: 'EXP-089',
        fecha: '2026-04-20T12:00:00',
        citaProcedimiento: 'Implante dental',
        archivoUrl: 'https://sistorage.blob.core.windows.net/consentimientos/carlos_ruiz_doc.pdf',
      },
      {
        id: '3',
        pacienteNombre: 'Ana Torres Villalobos',
        pacienteExpediente: 'EXP-112',
        fecha: '2026-04-22T09:15:00',
        citaProcedimiento: 'Endodoncia en pieza 36',
        archivoUrl: 'https://sistorage.blob.core.windows.net/consentimientos/ana_torres_doc.pdf',
      },
      {
        id: '4',
        pacienteNombre: 'Roberto Sánchez Medina',
        pacienteExpediente: 'EXP-133',
        fecha: '2026-04-28T11:00:00',
        citaProcedimiento: 'Colocación de puente fijo',
        archivoUrl: 'https://sistorage.blob.core.windows.net/consentimientos/roberto_sanchez_doc.pdf',
      },
      {
        id: '5',
        pacienteNombre: 'Jorge Ramírez García',
        pacienteExpediente: 'EXP-057',
        fecha: '2026-04-30T14:45:00',
        citaProcedimiento: 'Blanqueamiento dental ambulatorio',
        archivoUrl: 'https://sistorage.blob.core.windows.net/consentimientos/jorge_ramirez_doc.pdf',
      },
    ]
  } catch (error) {
    console.error('Error al cargar consentimientos:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchConsentimientos)
</script>

<template>
  <div class="fade-in max-w-7xl mx-auto pb-10">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <span class="text-muted/60">🏠</span>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Consentimientos</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Consentimientos Informados</h1>
        <p class="text-sm text-muted mt-1">Gestión y consulta de los documentos firmados por los pacientes.</p>
      </div>

      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95 self-start md:self-auto"
      >
        <FileText class="w-4 h-4" />
        Nuevo Consentimiento
      </button>
    </div>

    <!-- ── Stat cards ─────────────────────────────────────────────────── -->
    <section class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
        <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Total</p>
        <p class="text-3xl font-display font-semibold text-black">{{ consentimientos.length }}</p>
        <p class="text-xs text-muted">documentos registrados</p>
      </div>
      <div class="bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
        <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Resultados</p>
        <p class="text-3xl font-display font-semibold text-accent">{{ filteredConsentimientos.length }}</p>
        <p class="text-xs text-muted">en la búsqueda actual</p>
      </div>
      <div class="col-span-2 md:col-span-1 bg-card border border-border rounded-2xl p-4 flex flex-col gap-1">
        <p class="text-[10px] font-bold text-muted uppercase tracking-wider">Último registro</p>
        <p class="text-sm font-display font-semibold text-black">
          {{ consentimientos.length ? formatearFechaCorta(consentimientos[consentimientos.length - 1]?.fecha ?? '') : '—' }}
        </p>
        <p class="text-xs text-muted">fecha más reciente</p>
      </div>
    </section>

    <!-- ── Search bar ─────────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl p-4 mb-6">
      <div class="relative max-w-lg">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por paciente, expediente o procedimiento..."
          class="w-full pl-10 pr-9 py-2.5 bg-surface border border-border rounded-xl text-sm text-muted placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-muted/40 hover:text-muted/70"
          @click="clearSearch"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- ── Result count ───────────────────────────────────────────────── -->
    <p class="text-xs text-muted mb-3">
      {{ filteredConsentimientos.length }} consentimiento{{ filteredConsentimientos.length !== 1 ? 's' : '' }} encontrado{{ filteredConsentimientos.length !== 1 ? 's' : '' }}
      <span v-if="searchQuery">(filtrado)</span>
    </p>

    <!-- ── Table ─────────────────────────────────────────────────────── -->
    <div class="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">

      <!-- Table header (desktop) -->
      <div class="hidden md:grid grid-cols-[2fr_1.5fr_2fr_auto] gap-4 px-6 py-3 bg-surface/50 border-b border-border">
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Paciente</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Fecha de Firma</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest">Procedimiento</span>
        <span class="text-[10px] font-bold text-muted uppercase tracking-widest text-center">Documento</span>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="py-20 flex flex-col items-center gap-3 text-muted/50">
        <Loader2 class="w-8 h-8 animate-spin text-accent/50" />
        <p class="text-sm font-medium">Cargando consentimientos...</p>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="filteredConsentimientos.length === 0"
        class="py-20 text-center text-muted/50 flex flex-col items-center gap-3"
      >
        <FileText class="w-12 h-12 opacity-40" />
        <p class="text-sm font-medium">No se encontraron consentimientos</p>
        <p class="text-xs">Intenta con otros criterios de búsqueda</p>
      </div>

      <!-- Rows -->
      <div v-else>
        <div
          v-for="item in filteredConsentimientos"
          :key="item.id"
          class="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_2fr_auto] gap-3 md:gap-4 px-4 md:px-6 py-4 border-b border-border last:border-0 hover:bg-surface/30 transition-colors items-center"
        >

          <!-- Patient -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              {{ getInitials(item.pacienteNombre) }}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-black truncate">{{ item.pacienteNombre }}</p>
              <p class="text-[10px] text-muted font-mono">Exp: {{ item.pacienteExpediente }}</p>
            </div>
          </div>

          <!-- Date -->
          <div class="flex flex-col gap-0.5">
            <p class="text-sm font-semibold text-black">{{ formatearFechaCorta(item.fecha) }}</p>
            <p class="text-xs text-muted">{{ formatearHora(item.fecha) }}</p>
          </div>

          <!-- Procedure -->
          <div>
            <span class="inline-flex items-center gap-1.5 text-xs font-medium text-black bg-surface border border-border px-3 py-1.5 rounded-lg">
              <FileText class="w-3.5 h-3.5 text-accent shrink-0" />
              {{ item.citaProcedimiento }}
            </span>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 justify-start md:justify-center">
            <a
              :href="item.archivoUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1.5 px-3 py-2 bg-accent/10 border border-accent/20 text-accent rounded-xl text-xs font-bold hover:bg-accent hover:text-white transition-all"
              title="Ver documento PDF"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              Ver PDF
            </a>
            <a
              :href="item.archivoUrl"
              download
              class="p-2 rounded-xl text-muted hover:text-accent hover:bg-accent/5 border border-transparent hover:border-accent/20 transition-all"
              title="Descargar documento"
            >
              <Download class="w-4 h-4" />
            </a>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>