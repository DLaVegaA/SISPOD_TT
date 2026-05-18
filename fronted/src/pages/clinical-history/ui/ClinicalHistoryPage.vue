<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import type { SessionUser } from '@/entities/session/model/types'
import { normalizeUserId, ROUTE_NAMES } from '@/shared/routes'
import UiInput from '@/shared/ui/UiInput/UiInput.vue'
import UiSelect from '@/shared/ui/UiSelect/UiSelect.vue'
import AntecedenteField from '@/shared/ui/AntecedenteField/AntecedenteField.vue'
import { OdontogramPreview } from '@/entities/odontogram'
import { BinnaclePreview } from '@/widgets/binnacle-preview'
import { httpClient } from '@/shared/api/http'
import { Plus } from 'lucide-vue-next'

const sessionStore = useSessionStore()
const route = useRoute()

const patientId = computed(() => route.params.patientId as string | undefined)
const sessionUser = computed<SessionUser | null>(() => sessionStore.user)
const userId = computed(
  () => normalizeUserId(sessionUser.value?.id ?? sessionUser.value?.id_usuario) ?? '0',
)
console.log('[ClinicalHistoryPage] patientId:', patientId.value)
const routeParams = computed(() => ({ id: userId.value }))
const expedienteId = computed(() => {
  const raw = route.query.expedienteId
  const id = Number(raw)
  return Number.isFinite(id) && id > 0 ? id : null
})
const isReadOnly = computed(() => route.query.mode === 'view')
const modeLabel = computed(() => (isReadOnly.value ? 'Modo vista' : 'Modo edicion'))

type PacientePerfil = {
  id_paciente: number
  nombre: string
  apellido_paterno?: string
  apellido_materno?: string
  correo?: string
  telefono?: string
  fecha_nacimiento?: string
  curp?: string
  genero?: string
  direccion?: {
    calle?: string
    num_ext?: string
    num_int?: string
    colonia?: string
    municipio?: string
    estado?: string
    codigo_postal?: string
  } | null
}

type PadecimientoCatalogo = {
  id_padecimiento: number
  nombre_padecimiento: string
  categoria_padecimiento: string
}

type ExpedienteDetalle = {
  id_expediente: number
  id_paciente?: number
  observaciones_generales?: string | null
  tipo_sangre?: string | null
  estatura?: number | string | null
  peso?: number | string | null
  ocupacion?: string | null
  padecimientos?: Array<{
    id?: number
    id_padecimiento?: number
    tipo_antecedente?: string | null
    nota?: string | null
  }>
}

const getTodayDate = () => {
  return new Date().toISOString().slice(0, 10)
}

const generalInfo = ref({
  consultorio: 'Consultorio Gonzalez',
  odontologo: 'Dra. Laura Gonzalez',
  fechaElaboracion: getTodayDate(),
  estadoExpediente: 'En tratamiento',
})

const patientInfo = ref({
  nombre: 'Jorge Angeles Perez',
  fechaNacimiento: '1992-08-13',
  edad: '33',
  sexo: 'Masculino',
  curp: 'AEPJ920813HJCLRS09',
  estadoCivil: 'Soltero',
  ocupacion: '-',
  domicilio: 'Av. Patria 123, Guadalajara',
  correo: 'jorgeap@email.com',
  telefono: '33 5555 0000',
  tipoSangre: '-',
  estatura: '-',
  peso: '-',
  responsableLegal: '-',
  telefonoResponsable: '-',
  parentesco: '-',
})

const isLoadingPadecimientos = ref(false)
const padecimientosHeredofamiliares = ref<PadecimientoCatalogo[]>([])
const padecimientosPatologicos = ref<PadecimientoCatalogo[]>([])
const padecimientosNoPatologicos = ref<PadecimientoCatalogo[]>([])
const antecedentesHeredofamiliares = ref<Record<number, string>>({})
const antecedentesPatologicos = ref<Record<number, string>>({})
const antecedentesNoPatologicos = ref<Record<number, string>>({})
const expedienteErrors = ref<Record<string, string>>({})
const isSavingExpediente = ref(false)
const expedienteLoaded = ref(false)
const selectedHeredoByCategory = ref<Record<string, string>>({})
const selectedPatologicosByCategory = ref<Record<string, string>>({})
const selectedNoPatologicosByCategory = ref<Record<string, string>>({})

const buildNombreCompleto = (perfil: PacientePerfil) => {
  return [perfil.nombre, perfil.apellido_paterno, perfil.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim()
}

const buildDomicilio = (direccion?: PacientePerfil['direccion']) => {
  if (!direccion) return ''
  const partes = [
    direccion.calle,
    direccion.num_ext ? `#${direccion.num_ext}` : null,
    direccion.num_int ? `Int ${direccion.num_int}` : null,
    direccion.colonia,
    direccion.municipio,
    direccion.estado,
    direccion.codigo_postal,
  ].filter(Boolean)
  return partes.join(', ')
}

const normalizeCategoria = (categoria?: string) => {
  const limpia = categoria?.trim()
  return limpia && limpia.length > 0 ? limpia : 'Sin categoria'
}

const groupByCategoria = (items: PadecimientoCatalogo[]) => {
  return items.reduce<Record<string, PadecimientoCatalogo[]>>((acc, item) => {
    const categoria = normalizeCategoria(item.categoria_padecimiento)
    if (!acc[categoria]) acc[categoria] = []
    acc[categoria].push(item)
    return acc
  }, {})
}

const filterBySelection = (
  grouped: Record<string, PadecimientoCatalogo[]>,
  selectedIds: Set<number>,
  showSelected: boolean,
) => {
  return Object.fromEntries(
    Object.entries(grouped).map(([categoria, items]) => [
      categoria,
      items.filter((item) =>
        showSelected
          ? selectedIds.has(item.id_padecimiento)
          : !selectedIds.has(item.id_padecimiento),
      ),
    ]),
  )
}

const selectedHeredoIds = computed(
  () => new Set(Object.keys(antecedentesHeredofamiliares.value).map(Number)),
)
const selectedPatologicosIds = computed(
  () => new Set(Object.keys(antecedentesPatologicos.value).map(Number)),
)
const selectedNoPatologicosIds = computed(
  () => new Set(Object.keys(antecedentesNoPatologicos.value).map(Number)),
)

const heredofamiliaresPorCategoria = computed(() =>
  groupByCategoria(padecimientosHeredofamiliares.value),
)
const patologicosPorCategoria = computed(() => groupByCategoria(padecimientosPatologicos.value))
const noPatologicosPorCategoria = computed(() => groupByCategoria(padecimientosNoPatologicos.value))

const heredofamiliaresSeleccionados = computed(() =>
  filterBySelection(heredofamiliaresPorCategoria.value, selectedHeredoIds.value, true),
)
const patologicosSeleccionados = computed(() =>
  filterBySelection(patologicosPorCategoria.value, selectedPatologicosIds.value, true),
)
const noPatologicosSeleccionados = computed(() =>
  filterBySelection(noPatologicosPorCategoria.value, selectedNoPatologicosIds.value, true),
)

const heredofamiliaresDisponibles = computed(() =>
  filterBySelection(heredofamiliaresPorCategoria.value, selectedHeredoIds.value, false),
)
const patologicosDisponibles = computed(() =>
  filterBySelection(patologicosPorCategoria.value, selectedPatologicosIds.value, false),
)
const noPatologicosDisponibles = computed(() =>
  filterBySelection(noPatologicosPorCategoria.value, selectedNoPatologicosIds.value, false),
)

const calcularEdad = (fechaNacimiento?: string) => {
  if (!fechaNacimiento) return ''
  const nacimiento = new Date(fechaNacimiento)
  if (Number.isNaN(nacimiento.getTime())) return ''
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1
  }
  return String(edad)
}

const applyPerfil = (perfil: PacientePerfil) => {
  const nombreCompleto = buildNombreCompleto(perfil)
  const domicilio = buildDomicilio(perfil.direccion)
  const edad = calcularEdad(perfil.fecha_nacimiento)

  patientInfo.value = {
    ...patientInfo.value,
    nombre: nombreCompleto || patientInfo.value.nombre,
    correo: perfil.correo || patientInfo.value.correo,
    telefono: perfil.telefono || patientInfo.value.telefono,
    fechaNacimiento: perfil.fecha_nacimiento || patientInfo.value.fechaNacimiento,
    curp: perfil.curp || patientInfo.value.curp,
    sexo: perfil.genero || patientInfo.value.sexo,
    edad: edad || patientInfo.value.edad,
    domicilio: domicilio || patientInfo.value.domicilio,
  }
}

const applyExpediente = (expediente: ExpedienteDetalle) => {
  if (expediente.tipo_sangre) {
    patientInfo.value.tipoSangre = expediente.tipo_sangre
  }
  if (expediente.estatura !== undefined && expediente.estatura !== null) {
    patientInfo.value.estatura = String(expediente.estatura)
  }
  if (expediente.peso !== undefined && expediente.peso !== null) {
    patientInfo.value.peso = String(expediente.peso)
  }
  if (expediente.ocupacion) {
    patientInfo.value.ocupacion = expediente.ocupacion
  }

  const heredofamiliares: Record<number, string> = {}
  const patologicos: Record<number, string> = {}
  const noPatologicos: Record<number, string> = {}

  const items = Array.isArray(expediente.padecimientos) ? expediente.padecimientos : []
  for (const item of items) {
    const id = Number(item.id ?? item.id_padecimiento)
    if (!id) continue
    const nota = item.nota ?? ''
    switch (item.tipo_antecedente) {
      case 'heredofamiliar':
        heredofamiliares[id] = nota
        break
      case 'patologico_personal':
        patologicos[id] = nota
        break
      case 'no_patologico':
        noPatologicos[id] = nota
        break
      default:
        break
    }
  }

  antecedentesHeredofamiliares.value = heredofamiliares
  antecedentesPatologicos.value = patologicos
  antecedentesNoPatologicos.value = noPatologicos
}

const fetchPadecimientos = async (categoria: string): Promise<PadecimientoCatalogo[]> => {
  const data: any = await httpClient.get('/padecimiento', { params: { categoria } })
  return Array.isArray(data?.padecimientos) ? data.padecimientos : []
}

const loadCatalogoPadecimientos = async () => {
  isLoadingPadecimientos.value = true
  try {
    // Ajusta estas categorias segun el catalogo en la base de datos.
    const categoriasHeredo = ['Cardiovascular', 'Crónico', 'Hematológico', 'Neurológico']
    const categoriasPatologicos = ['Respiratorio', 'Inmunológico', 'Infeccioso']
    const categoriasNoPatologicos = ['No patológico']

    const [heredo, patologicos, noPatologicos] = await Promise.all([
      Promise.all(categoriasHeredo.map(fetchPadecimientos)),
      Promise.all(categoriasPatologicos.map(fetchPadecimientos)),
      Promise.all(categoriasNoPatologicos.map(fetchPadecimientos)),
    ])

    padecimientosHeredofamiliares.value = heredo.flat()
    padecimientosPatologicos.value = patologicos.flat()
    padecimientosNoPatologicos.value = noPatologicos.flat()
  } catch (error) {
    console.error('Error al cargar catalogo de padecimientos', error)
    padecimientosHeredofamiliares.value = []
    padecimientosPatologicos.value = []
    padecimientosNoPatologicos.value = []
  } finally {
    isLoadingPadecimientos.value = false
  }
}

const validateExpediente = () => {
  const errors: Record<string, string> = {}
  if (!patientInfo.value.tipoSangre || patientInfo.value.tipoSangre === '-') {
    errors.tipo_sangre = 'El tipo de sangre es obligatorio'
  }
  if (!patientInfo.value.estatura || Number.isNaN(Number(patientInfo.value.estatura))) {
    errors.estatura = 'La estatura es obligatoria'
  }
  if (!patientInfo.value.peso || Number.isNaN(Number(patientInfo.value.peso))) {
    errors.peso = 'El peso es obligatorio'
  }
  if (!patientInfo.value.ocupacion?.trim() || patientInfo.value.ocupacion === '-') {
    errors.ocupacion = 'La ocupacion es obligatoria'
  }
  expedienteErrors.value = errors
  return Object.keys(errors).length === 0
}

const addHeredofamiliar = (categoria: string) => {
  const selected = selectedHeredoByCategory.value[categoria]
  const id = Number(selected)
  if (!id) return
  if (!(id in antecedentesHeredofamiliares.value)) {
    antecedentesHeredofamiliares.value = {
      ...antecedentesHeredofamiliares.value,
      [id]: '',
    }
  }
  selectedHeredoByCategory.value = { ...selectedHeredoByCategory.value, [categoria]: '' }
}

const addPatologico = (categoria: string) => {
  const selected = selectedPatologicosByCategory.value[categoria]
  const id = Number(selected)
  if (!id) return
  if (!(id in antecedentesPatologicos.value)) {
    antecedentesPatologicos.value = {
      ...antecedentesPatologicos.value,
      [id]: '',
    }
  }
  selectedPatologicosByCategory.value = {
    ...selectedPatologicosByCategory.value,
    [categoria]: '',
  }
}

const addNoPatologico = (categoria: string) => {
  const selected = selectedNoPatologicosByCategory.value[categoria]
  const id = Number(selected)
  if (!id) return
  if (!(id in antecedentesNoPatologicos.value)) {
    antecedentesNoPatologicos.value = {
      ...antecedentesNoPatologicos.value,
      [id]: '',
    }
  }
  selectedNoPatologicosByCategory.value = {
    ...selectedNoPatologicosByCategory.value,
    [categoria]: '',
  }
}

const removeHeredofamiliar = (id: number) => {
  const { [id]: _removed, ...rest } = antecedentesHeredofamiliares.value
  antecedentesHeredofamiliares.value = rest
}

const removePatologico = (id: number) => {
  const { [id]: _removed, ...rest } = antecedentesPatologicos.value
  antecedentesPatologicos.value = rest
}

const removeNoPatologico = (id: number) => {
  const { [id]: _removed, ...rest } = antecedentesNoPatologicos.value
  antecedentesNoPatologicos.value = rest
}

const buildPadecimientosPayload = (entries: Record<number, string>, tipo: string) => {
  return Object.entries(entries).map(([id, nota]) => {
    const notaLimpia = (nota || '').trim()
    return {
      id_padecimiento: Number(id),
      tipo_antecedente: tipo,
      nota: notaLimpia || null,
    }
  })
}

const handleCrearExpediente = async () => {
  if (isReadOnly.value) return
  if (!patientId.value) {
    expedienteErrors.value = { general: 'Paciente invalido' }
    return
  }
  if (!validateExpediente()) return

  isSavingExpediente.value = true
  expedienteErrors.value = {}
  try {
    const payload = {
      id_paciente: Number(patientId.value),
      tipo_sangre: patientInfo.value.tipoSangre,
      estatura: Number(patientInfo.value.estatura),
      peso: Number(patientInfo.value.peso),
      ocupacion: patientInfo.value.ocupacion,
      observaciones_generales: null,
    }
    const padecimientosPayload = [
      ...buildPadecimientosPayload(antecedentesHeredofamiliares.value, 'heredofamiliar'),
      ...buildPadecimientosPayload(antecedentesPatologicos.value, 'patologico_personal'),
      ...buildPadecimientosPayload(antecedentesNoPatologicos.value, 'no_patologico'),
    ]

    if (expedienteId.value) {
      const updatePayload: Record<string, any> = { ...payload }
      if (expedienteLoaded.value || padecimientosPayload.length > 0) {
        updatePayload.padecimientos = padecimientosPayload
      }
      await httpClient.put(`/expediente/${expedienteId.value}`, updatePayload)
      return
    }

    const response: any = await httpClient.post('/expediente', payload)
    const newExpedienteId = response?.expediente?.id_expediente

    if (newExpedienteId && padecimientosPayload.length > 0) {
      await httpClient.post(`/expediente/${newExpedienteId}/padecimiento`, {
        padecimientos: padecimientosPayload,
      })
    }
  } catch (error: any) {
    const message = error?.response?.data?.message
    expedienteErrors.value = { general: message || 'No se pudo crear el expediente' }
  } finally {
    isSavingExpediente.value = false
  }
}

const loadPerfilPaciente = async (id?: string) => {
  if (!id) return
  try {
    const perfil: PacientePerfil = await httpClient.get(`/pacientes/${id}/perfil-completo`)
    if (perfil) {
      applyPerfil(perfil)
    }
  } catch (error) {
    console.error('Error al cargar perfil del paciente', error)
  }
}

const loadExpediente = async (id?: number | null) => {
  if (!id) return
  expedienteLoaded.value = false
  try {
    const data: any = await httpClient.get(`/expediente/${id}`)
    const expediente: ExpedienteDetalle = data?.expediente ?? data
    if (expediente) {
      applyExpediente(expediente)
      expedienteLoaded.value = true
    }
  } catch (error) {
    console.error('Error al cargar expediente', error)
  }
}

onMounted(() => {
  loadPerfilPaciente(patientId.value)
  loadCatalogoPadecimientos()
  loadExpediente(expedienteId.value)
})

watch(patientId, (value) => {
  loadPerfilPaciente(value)
})

watch(expedienteId, (value) => {
  expedienteLoaded.value = false
  loadExpediente(value)
})
</script>

<template>
  <div class="fade-in max-w-7xl">
    <div class="mb-8">
      <div class="flex items-center gap-2 text-xs text-muted mb-2">
        <span>🏠</span>
        <span>/</span>
        <span class="font-medium text-muted">Historial Clinico</span>
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl sm:text-4xl font-bold text-black">Historial Clinico</h1>
          <p class="text-sm text-muted mt-1">Gestion del expediente y antecedentes del paciente.</p>
          <span
            class="inline-flex mt-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-surface border border-border text-muted"
          >
            {{ modeLabel }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            v-if="!isReadOnly"
            type="button"
            class="inline-flex items-center gap-2 px-4 py-2 bg-ink/65 hover:bg-ink/80 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60 disabled:pointer-events-none"
            :disabled="isSavingExpediente"
            @click="handleCrearExpediente"
          >
            {{ isSavingExpediente ? 'Guardando...' : 'Guardar expediente' }}
          </button>
          <RouterLink
            :to="{
              name: ROUTE_NAMES.DENTIST_ODONTOGRAM,
              params: {
                id: userId, // propaga { id: userId }
                patientId: patientId, // añade el patientId
              },
              query: { mode: isReadOnly ? 'view' : 'edit' },
            }"
            class="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-accent-light transition-colors"
          >
            Ver odontograma
          </RouterLink>
        </div>
      </div>
      <p v-if="expedienteErrors.general" class="text-xs text-red-500 mt-3">
        {{ expedienteErrors.general }}
      </p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 space-y-6">
        <section class="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-black mb-4">Informacion General</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UiInput
              v-model="generalInfo.consultorio"
              label="Consultorio"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="generalInfo.odontologo"
              label="Nombre del Odontologo"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="generalInfo.fechaElaboracion"
              label="Fecha de elaboracion"
              variant="primary"
              type="date"
              :disabled="true"
            />
            <div>
              <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Estado del Expediente
              </label>
              <UiSelect v-model="generalInfo.estadoExpediente" :disabled="isReadOnly">
                <option>En tratamiento</option>
                <option>Finalizado</option>
                <option>Pendiente</option>
              </UiSelect>
            </div>
          </div>
        </section>

        <section class="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-black mb-4">Informacion General del Paciente</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UiInput
              v-model="patientInfo.nombre"
              label="Nombre"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.correo"
              label="Correo electronico"
              variant="primary"
              type="email"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.fechaNacimiento"
              label="Fecha de Nacimiento"
              variant="primary"
              type="date"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.telefono"
              label="Telefono"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.edad"
              label="Edad"
              variant="primary"
              type="number"
              :disabled="isReadOnly"
            />
            <div>
              <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Tipo de Sangre
              </label>
              <UiSelect v-model="patientInfo.tipoSangre" :disabled="isReadOnly">
                <option>O+</option>
                <option>O-</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
              </UiSelect>
              <p v-if="expedienteErrors.tipo_sangre" class="text-xs text-red-500 mt-1">
                {{ expedienteErrors.tipo_sangre }}
              </p>
            </div>
            <div>
              <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Sexo
              </label>
              <UiSelect v-model="patientInfo.sexo" :disabled="isReadOnly">
                <option>Masculino</option>
                <option>Femenino</option>
                <option>Otro</option>
              </UiSelect>
            </div>
            <UiInput
              v-model="patientInfo.estatura"
              label="Estatura (m)"
              variant="primary"
              :disabled="isReadOnly"
              :error="expedienteErrors.estatura"
            />
            <UiInput
              v-model="patientInfo.curp"
              label="CURP"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.peso"
              label="Peso (kg)"
              variant="primary"
              :disabled="isReadOnly"
              :error="expedienteErrors.peso"
            />
            <div>
              <label class="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                Estado Civil
              </label>
              <UiSelect v-model="patientInfo.estadoCivil" :disabled="isReadOnly">
                <option>Soltero</option>
                <option>Casado</option>
                <option>Union libre</option>
                <option>Divorciado</option>
              </UiSelect>
            </div>
            <!-- <UiInput
              v-model="patientInfo.responsableLegal"
              label="Responsable Legal"
              variant="primary"
              :disabled="isReadOnly"
            /> -->
            <UiInput
              v-model="patientInfo.ocupacion"
              label="Ocupacion"
              variant="primary"
              :disabled="isReadOnly"
              :error="expedienteErrors.ocupacion"
            />
            <!-- <UiInput
              v-model="patientInfo.telefonoResponsable"
              label="Telefono"
              variant="primary"
              :disabled="isReadOnly"
            /> -->
            <UiInput
              v-model="patientInfo.domicilio"
              label="Domicilio"
              variant="primary"
              :disabled="isReadOnly"
            />
            <!-- <UiInput
              v-model="patientInfo.parentesco"
              label="Parentesco"
              variant="primary"
              :disabled="isReadOnly"
            /> -->
          </div>
        </section>

        <section class="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-sm font-semibold text-black">Bitacoras de Citas</h2>
              <p class="text-xs text-muted">Vista previa de las ultimas atenciones.</p>
            </div>
            <RouterLink
              :to="{ name: ROUTE_NAMES.DENTIST_BINNACLE, params: routeParams }"
              class="text-xs font-semibold text-accent hover:text-accent-light"
            >
              Ver bitacoras
            </RouterLink>
          </div>
          <BinnaclePreview :patient-id="patientId" />
        </section>

        <section class="space-y-4 pt-6">
          <OdontogramPreview updatedAt="04 / may / 2026" :patientId="patientId" />
        </section>
      </div>

      <div class="space-y-6">
        <section class="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-black mb-4">Antecedentes Personales</h2>

          <div class="space-y-6">
            <!-- Heredofamiliares -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-semibold text-muted uppercase tracking-wider"
                  >Heredofamiliares</span
                >
                <div class="h-px flex-1 bg-border/60"></div>
              </div>

              <div v-if="isLoadingPadecimientos" class="text-xs text-muted flex items-center gap-2">
                <div
                  class="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"
                ></div>
                Cargando catálogo...
              </div>
              <div
                v-else-if="padecimientosHeredofamiliares.length === 0"
                class="text-xs text-muted italic"
              >
                No hay padecimientos registrados en esta categoría.
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="(items, categoria) in heredofamiliaresPorCategoria"
                  :key="categoria"
                  class="rounded-xl border border-border/70 bg-white/30 p-4 transition-all hover:shadow-sm"
                >
                  <div class="flex flex-col sm:flex-col sm:justify-between gap-3 mb-3">
                    <h3 class="text-sm font-medium text-black">{{ categoria }}</h3>
                    <div class="flex flex-row items-center gap-2" v-if="!isReadOnly">
                      <UiSelect
                        v-model="selectedHeredoByCategory[categoria]"
                        :disabled="(heredofamiliaresDisponibles[categoria]?.length ?? 0) === 0"
                        class="min-w-[180px]"
                        placeholder="Seleccionar..."
                      >
                        <option value="" disabled>Selecciona un padecimiento</option>
                        <option
                          v-for="padecimiento in heredofamiliaresDisponibles[categoria]"
                          :key="padecimiento.id_padecimiento"
                          :value="String(padecimiento.id_padecimiento)"
                        >
                          {{ padecimiento.nombre_padecimiento }}
                        </option>
                      </UiSelect>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-accent/40 bg-accent/5 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        :disabled="!selectedHeredoByCategory[categoria]"
                        @click="addHeredofamiliar(categoria)"
                      >
                        <Plus class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Lista de padecimientos agregados -->
                  <div
                    v-if="(heredofamiliaresSeleccionados[categoria]?.length ?? 0) === 0"
                    class="text-xs text-muted italic py-2"
                  >
                    Ningún antecedente agregado.
                  </div>
                  <div v-else class="space-y-3 mt-2">
                    <AntecedenteField
                      v-for="padecimiento in heredofamiliaresSeleccionados[categoria]"
                      :key="padecimiento.id_padecimiento"
                      v-model="antecedentesHeredofamiliares[padecimiento.id_padecimiento]"
                      :label="padecimiento.nombre_padecimiento"
                      :disabled="isReadOnly"
                      :show-remove="!isReadOnly"
                      @remove="removeHeredofamiliar(padecimiento.id_padecimiento)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Personales patológicos (misma estructura) -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-semibold text-muted uppercase tracking-wider"
                  >Personales patológicos</span
                >
                <div class="h-px flex-1 bg-border/60"></div>
              </div>
              <div v-if="isLoadingPadecimientos" class="text-xs text-muted flex items-center gap-2">
                <div
                  class="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"
                ></div>
                Cargando catálogo...
              </div>
              <div
                v-else-if="padecimientosPatologicos.length === 0"
                class="text-xs text-muted italic"
              >
                No hay padecimientos registrados en esta categoría.
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="(items, categoria) in patologicosPorCategoria"
                  :key="categoria"
                  class="rounded-xl border border-border/70 bg-white/30 p-4 transition-all hover:shadow-sm"
                >
                  <div class="flex flex-col sm:justify-between gap-3 mb-3">
                    <h3 class="text-sm font-medium text-black">{{ categoria }}</h3>
                    <div class="flex flex-row items-center gap-2" v-if="!isReadOnly">
                      <UiSelect
                        v-model="selectedPatologicosByCategory[categoria]"
                        :disabled="(patologicosDisponibles[categoria]?.length ?? 0) === 0"
                        class="min-w-[180px]"
                        placeholder="Seleccionar..."
                      >
                        <option value="" disabled>Selecciona un padecimiento</option>
                        <option
                          v-for="padecimiento in patologicosDisponibles[categoria]"
                          :key="padecimiento.id_padecimiento"
                          :value="String(padecimiento.id_padecimiento)"
                        >
                          {{ padecimiento.nombre_padecimiento }}
                        </option>
                      </UiSelect>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-accent/40 bg-accent/5 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        :disabled="!selectedPatologicosByCategory[categoria]"
                        @click="addPatologico(categoria)"
                      >
                        <Plus class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="(patologicosSeleccionados[categoria]?.length ?? 0) === 0"
                    class="text-xs text-muted italic py-2"
                  >
                    Ningún antecedente agregado.
                  </div>
                  <div v-else class="space-y-3 mt-2">
                    <AntecedenteField
                      v-for="padecimiento in patologicosSeleccionados[categoria]"
                      :key="padecimiento.id_padecimiento"
                      v-model="antecedentesPatologicos[padecimiento.id_padecimiento]"
                      :label="padecimiento.nombre_padecimiento"
                      :disabled="isReadOnly"
                      :show-remove="!isReadOnly"
                      @remove="removePatologico(padecimiento.id_padecimiento)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Personales no patológicos (misma estructura) -->
            <div>
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xs font-semibold text-muted uppercase tracking-wider"
                  >Personales no patológicos</span
                >
                <div class="h-px flex-1 bg-border/60"></div>
              </div>
              <div v-if="isLoadingPadecimientos" class="text-xs text-muted flex items-center gap-2">
                <div
                  class="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"
                ></div>
                Cargando catálogo...
              </div>
              <div
                v-else-if="padecimientosNoPatologicos.length === 0"
                class="text-xs text-muted italic"
              >
                No hay padecimientos registrados en esta categoría.
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="(items, categoria) in noPatologicosPorCategoria"
                  :key="categoria"
                  class="rounded-xl border border-border/70 bg-white/30 p-4 transition-all hover:shadow-sm"
                >
                  <div class="flex flex-col sm:justify-between gap-3 mb-3">
                    <h3 class="text-sm font-medium text-black">{{ categoria }}</h3>
                    <div class="flex flex-row items-center gap-2" v-if="!isReadOnly">
                      <UiSelect
                        v-model="selectedNoPatologicosByCategory[categoria]"
                        :disabled="(noPatologicosDisponibles[categoria]?.length ?? 0) === 0"
                        class="min-w-[180px]"
                        placeholder="Seleccionar..."
                      >
                        <option value="" disabled>Selecciona un padecimiento</option>
                        <option
                          v-for="padecimiento in noPatologicosDisponibles[categoria]"
                          :key="padecimiento.id_padecimiento"
                          :value="String(padecimiento.id_padecimiento)"
                        >
                          {{ padecimiento.nombre_padecimiento }}
                        </option>
                      </UiSelect>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-accent/40 bg-accent/5 text-accent hover:bg-accent/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        :disabled="!selectedNoPatologicosByCategory[categoria]"
                        @click="addNoPatologico(categoria)"
                      >
                        <Plus class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="(noPatologicosSeleccionados[categoria]?.length ?? 0) === 0"
                    class="text-xs text-muted italic py-2"
                  >
                    Ningún antecedente agregado.
                  </div>
                  <div v-else class="space-y-3 mt-2">
                    <AntecedenteField
                      v-for="padecimiento in noPatologicosSeleccionados[categoria]"
                      :key="padecimiento.id_padecimiento"
                      v-model="antecedentesNoPatologicos[padecimiento.id_padecimiento]"
                      :label="padecimiento.nombre_padecimiento"
                      :disabled="isReadOnly"
                      :show-remove="!isReadOnly"
                      @remove="removeNoPatologico(padecimiento.id_padecimiento)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
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
/* Animación sutil para los elementos que aparecen/desaparecen */
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

/* Spinner personalizado (si no usas uno global) */
.animate-spin {
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
