<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import type { SessionUser } from '@/entities/session/model/types'
import { normalizeUserId, ROUTE_NAMES } from '@/shared/routes'
import UiInput from '@/shared/ui/UiInput/UiInput.vue'
import UiSelect from '@/shared/ui/UiSelect/UiSelect.vue'
import { OdontogramPreview } from '@/entities/odontogram'
import { BinnaclePreview } from '@/widgets/binnacle-preview'

const sessionStore = useSessionStore()
const route = useRoute()

const sessionUser = computed<SessionUser | null>(() => sessionStore.user)
const userId = computed(
  () => normalizeUserId(sessionUser.value?.id ?? sessionUser.value?.id_usuario) ?? '0',
)

const routeParams = computed(() => ({ id: userId.value }))
const isReadOnly = computed(() => route.query.mode === 'view')
const modeLabel = computed(() => (isReadOnly.value ? 'Modo vista' : 'Modo edicion'))

const generalInfo = ref({
  consultorio: 'Consultorio Gonzalez',
  odontologo: 'Dra. Laura Gonzalez',
  fechaElaboracion: '2026-05-04',
  estadoExpediente: 'En tratamiento',
})

const patientInfo = ref({
  nombre: 'Jorge Angeles Perez',
  fechaNacimiento: '1992-08-13',
  edad: '33',
  sexo: 'Masculino',
  curp: 'AEPJ920813HJCLRS09',
  estadoCivil: 'Soltero',
  ocupacion: 'Ingeniero',
  domicilio: 'Av. Patria 123, Guadalajara',
  correo: 'jorgeap@email.com',
  telefono: '33 5555 0000',
  tipoSangre: 'O+',
  estatura: '1.75',
  peso: '74',
  responsableLegal: '-',
  telefonoResponsable: '-',
  parentesco: '-',
})

const familyFields = [
  { key: 'diabetes', label: 'Diabetes' },
  { key: 'hipertension', label: 'Hipertension' },
  { key: 'cardiovasculares', label: 'Enfermedades cardiovasculares' },
  { key: 'cancer', label: 'Cancer' },
  { key: 'bucales', label: 'Enfermedades bucales hereditarias' },
  { key: 'otros', label: 'Otros antecedentes familiares' },
]

const pathologicFields = [
  { key: 'sistemicas', label: 'Enfermedades sistemicas' },
  { key: 'alergias', label: 'Alergias' },
  { key: 'cirugias', label: 'Cirugias previas / hospitalizaciones' },
  { key: 'accidentes', label: 'Accidentes o traumatismos bucales' },
  { key: 'tratamientos', label: 'Tratamientos medicos actuales' },
]

const nonPathologicFields = [
  { key: 'higiene', label: 'Higiene bucal' },
  { key: 'alimentacion', label: 'Alimentacion' },
  { key: 'tabaquismo', label: 'Tabaquismo' },
  { key: 'alcohol', label: 'Alcohol' },
  { key: 'drogas', label: 'Drogas' },
  { key: 'bruxismo', label: 'Bruxismo o habitos parafuncionales' },
]

const antecedentesFamiliares = ref<Record<string, string>>({
  diabetes: 'Contenido del campo',
  hipertension: 'Contenido del campo',
  cardiovasculares: 'Contenido del campo',
  cancer: 'Contenido del campo',
  bucales: 'Contenido del campo',
  otros: 'Contenido del campo',
})

const antecedentesPatologicos = ref<Record<string, string>>({
  sistemicas: 'Contenido del campo',
  alergias: 'Contenido del campo',
  cirugias: 'Contenido del campo',
  accidentes: 'Contenido del campo',
  tratamientos: 'Contenido del campo',
})

const antecedentesNoPatologicos = ref<Record<string, string>>({
  higiene: 'Contenido del campo',
  alimentacion: 'Contenido del campo',
  tabaquismo: 'Contenido del campo',
  alcohol: 'Contenido del campo',
  drogas: 'Contenido del campo',
  bruxismo: 'Contenido del campo',
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
        <RouterLink
          :to="{
            name: ROUTE_NAMES.DENTIST_ODONTOGRAM,
            params: routeParams,
            query: { mode: isReadOnly ? 'view' : 'edit' },
          }"
          class="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-accent-light transition-colors"
        >
          Ver odontograma
        </RouterLink>
      </div>
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
              :disabled="isReadOnly"
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
            <UiInput
              v-model="patientInfo.responsableLegal"
              label="Responsable Legal"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.ocupacion"
              label="Ocupacion"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.telefonoResponsable"
              label="Telefono"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.domicilio"
              label="Domicilio"
              variant="primary"
              :disabled="isReadOnly"
            />
            <UiInput
              v-model="patientInfo.parentesco"
              label="Parentesco"
              variant="primary"
              :disabled="isReadOnly"
            />
          </div>
        </section>

        <section class="space-y-4">
          <OdontogramPreview updatedAt="04 / may / 2026" />
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
          <BinnaclePreview />
        </section>
      </div>

      <div class="space-y-6">
        <section class="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h2 class="text-sm font-semibold text-black mb-4">Antecedentes Personales</h2>

          <div class="space-y-5">
            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Heredofamiliares
              </p>
              <div class="space-y-3">
                <UiInput
                  v-for="field in familyFields"
                  :key="field.key"
                  v-model="antecedentesFamiliares[field.key]"
                  :label="field.label"
                  variant="primary"
                  :disabled="isReadOnly"
                />
              </div>
            </div>

            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Personales patologicos
              </p>
              <div class="space-y-3">
                <UiInput
                  v-for="field in pathologicFields"
                  :key="field.key"
                  v-model="antecedentesPatologicos[field.key]"
                  :label="field.label"
                  variant="primary"
                  :disabled="isReadOnly"
                />
              </div>
            </div>

            <div>
              <p class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Personales no patologicos
              </p>
              <div class="space-y-3">
                <UiInput
                  v-for="field in nonPathologicFields"
                  :key="field.key"
                  v-model="antecedentesNoPatologicos[field.key]"
                  :label="field.label"
                  variant="primary"
                  :disabled="isReadOnly"
                />
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
</style>
