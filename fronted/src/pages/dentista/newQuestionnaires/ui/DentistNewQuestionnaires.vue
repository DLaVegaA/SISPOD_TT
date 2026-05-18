<template>
  <div class="fade-in max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8">

    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-6">
      <div>
        <div class="flex items-center gap-1.5 text-xs text-muted font-medium mb-2">
          <RouterLink :to="{ name: ROUTE_NAMES.DENTIST_HOME, params: routeParams }" class="text-muted/60 hover:text-black transition-colors">🏠</RouterLink>
          <span class="text-muted/60">&gt;</span>
          <RouterLink :to="{ name: ROUTE_NAMES.DENTIST_QUESTIONNAIRES, params: routeParams }" class="hover:text-black transition-colors">Cuestionarios</RouterLink>
          <span class="text-muted/60">&gt;</span>
          <span class="bg-card border border-border px-2 py-0.5 rounded-lg">Nuevo Cuestionario</span>
        </div>
        <h1 class="font-display text-4xl font-semibold text-black">Nuevo Cuestionario</h1>
        <p class="text-sm text-muted mt-1">Arrastra preguntas del banco al cuestionario. Las nuevas preguntas se guardan en el banco para reutilizarlas.</p>
      </div>
    </div>

    <!-- Alertas -->
    <div v-if="successMessage" class="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" /> {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
      <AlertCircle class="w-4 h-4 shrink-0" /> {{ errorMessage }}
    </div>

    <!-- ── Columns ────────────────────────────────────────────────────── -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      <!-- ── Left Column — Builder ──────────────────────────────────── -->
      <div class="lg:col-span-7 bg-card p-6 rounded-3xl border border-border flex flex-col gap-6 shadow-sm min-h-[40rem] lg:h-[calc(100vh-9rem)] lg:sticky lg:top-6">
        <header class="flex flex-col gap-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Nombre del cuestionario</label>
              <input v-model="form.nombre_cuestionario" type="text" placeholder="Ej. Seguimiento 24h - Exodoncia"
                class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
              <p v-if="formErrors.nombre_cuestionario" class="text-xs text-red-500 mt-1">{{ formErrors.nombre_cuestionario }}</p>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Tipo de cuestionario</label>
              <div class="relative w-full">
                <select v-model="form.tipo_cuestionario"
                  class="appearance-none w-full bg-surface border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer">
                  <option value="24h">Cuestionario de 24hrs</option>
                  <option value="72h">Cuestionario de 72hrs</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Procedimiento</label>
              <div class="relative w-full">
                <select v-model.number="form.id_procedimiento" :disabled="isLoadingProcedures"
                  class="appearance-none w-full bg-surface border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer disabled:opacity-60">
                  <option :value="null" disabled>{{ isLoadingProcedures ? 'Cargando...' : 'Selecciona un procedimiento' }}</option>
                  <option v-for="p in procedures" :key="p.id_procedimiento" :value="p.id_procedimiento">{{ p.nombre_procedimiento }}</option>
                </select>
                <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              </div>
              <p v-if="formErrors.id_procedimiento" class="text-xs text-red-500 mt-1">{{ formErrors.id_procedimiento }}</p>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Descripción</label>
              <input v-model="form.descripcion" type="text" placeholder="Descripción opcional"
                class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
            </div>
          </div>

          <div class="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
            <p class="text-xs text-muted">
              Mostrando preguntas compatibles con <strong class="text-accent">{{ form.tipo_cuestionario }}</strong>.
              Las preguntas del banco se filtran por tipo automáticamente.
            </p>
          </div>
        </header>

        <!-- Drop zone -->
        <div class="flex-1 space-y-3 rounded-2xl p-1 transition-colors lg:overflow-y-auto lg:pr-2 lg:custom-scrollbar"
          :class="{ 'bg-accent/5 border-2 border-dashed border-accent/30': isDragging }"
          @dragover.prevent="onDragOver" @dragleave="onDragLeave" @drop="onDrop">

          <div v-if="builderQuestions.length === 0"
            class="flex flex-col items-center justify-center h-full text-center py-20 gap-4 text-muted/30 border-2 border-dashed border-border rounded-2xl">
            <ClipboardList class="w-16 h-16" />
            <p class="font-medium text-sm">Arrastra preguntas aquí para construir tu cuestionario</p>
          </div>

          <template v-else>
            <div v-for="(item, index) in builderQuestions" :key="item.id_pregunta_base"
              class="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-4 group hover:border-accent/20 transition-colors">
              <div class="flex items-center gap-3 w-full min-w-0">
                <span class="text-xs font-bold text-muted/60 shrink-0 w-5">{{ index + 1 }}.</span>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-black truncate w-full">{{ item.texto_pregunta }}</p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-lg text-[10px] font-medium">{{ typeLabel(item.tipo_control) }}</span>
                    <span v-if="item.aplica_24h" class="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px] font-medium">24h</span>
                    <span v-if="item.aplica_72h" class="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px] font-medium">72h</span>
                    <span v-if="item.valor_alerta" class="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px] font-medium">⚠ Signo de alarma</span>
                  </div>
                </div>
              </div>
              <button class="w-8 h-8 rounded-xl bg-card border border-border text-muted hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all shrink-0"
                title="Quitar" @click="removeFromBuilder(item.id_pregunta_base)">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
        </div>

        <footer class="mt-2 pt-6 border-t border-border">
          <button :disabled="isSaving || builderQuestions.length === 0"
            class="w-full flex items-center justify-center gap-2 bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent/10 disabled:hover:text-accent disabled:hover:scale-100"
            @click="saveQuestionnaire">
            <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            {{ isSaving ? 'Guardando...' : `Guardar Cuestionario (${builderQuestions.length})` }}
          </button>
        </footer>
      </div>

      <!-- ── Right Column — Bank ────────────────────────────────────── -->
      <div class="lg:col-span-5 bg-surface/60 p-6 rounded-3xl border border-border flex flex-col gap-6 shadow-sm min-h-[40rem] lg:h-[calc(100vh-9rem)]">
        <header class="flex flex-col gap-4">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-display font-bold text-black text-base">Banco de Preguntas</h2>
            <button class="flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent/70 transition-colors" @click="openQuestionModal()">
              <Plus class="w-3.5 h-3.5" /> Crear Pregunta
            </button>
          </div>
          <div class="relative w-full">
            <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/40" />
            <input v-model="searchQuery" type="text" placeholder="Buscar pregunta compatible..."
              class="w-full pl-11 pr-4 py-2.5 bg-card border border-border rounded-2xl text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
          </div>
        </header>

        <div v-if="isLoadingBank" class="flex items-center justify-center gap-2 text-muted py-10">
          <Loader2 class="w-5 h-5 animate-spin" />
          <span class="text-sm">Cargando banco de preguntas...</span>
        </div>

        <div v-else class="flex-1 space-y-3 lg:overflow-y-auto lg:pr-2 lg:custom-scrollbar">
          <div v-for="item in bankFiltered" :key="item.id_pregunta_base"
            class="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 cursor-grab transition-all active:cursor-grabbing hover:border-accent/30 hover:shadow-sm group relative lg:min-h-[6.5rem]"
            draggable="true"
            @dragstart="onDragStart($event, item)"
            @dragend="onDragEnd">

            <!-- Texto e info — se deja espacio a la derecha para los botones -->
            <div class="flex flex-col gap-1.5 w-full min-w-0 pr-28">
              <p class="text-sm font-semibold text-black line-clamp-2">{{ item.texto_pregunta }}</p>
              <div class="text-[10px] text-muted flex items-center gap-1 flex-wrap">
                <span class="font-bold text-black/70">Tipo:</span>
                <span class="bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-lg ml-0.5 font-medium">{{ typeLabel(item.tipo_control) }}</span>
                <span v-if="item.aplica_24h" class="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg font-medium">24h</span>
                <span v-if="item.aplica_72h" class="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-lg font-medium">72h</span>
                <span v-if="item.valor_alerta" class="bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg font-medium">⚠ Alarma</span>
              </div>
            </div>

            <!-- Botones: Agregar · Editar · Eliminar (visibles al hover) -->
            <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity absolute right-3 top-1/2 -translate-y-1/2">
              <button class="w-7 h-7 rounded-lg bg-surface border border-border text-muted hover:text-accent hover:border-accent/30 flex items-center justify-center transition-all"
                title="Agregar al cuestionario" @click.stop="addToBuilder(item)">
                <Plus class="w-3.5 h-3.5" />
              </button>
              <button class="w-7 h-7 rounded-lg bg-surface border border-border text-muted hover:text-blue-600 hover:border-blue-300 flex items-center justify-center transition-all"
                title="Editar pregunta" @click.stop="openQuestionModal(item)">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button class="w-7 h-7 rounded-lg bg-surface border border-border text-muted hover:text-red-500 hover:border-red-300 hover:bg-red-50 flex items-center justify-center transition-all"
                title="Eliminar pregunta" @click.stop="deleteQuestion(item)">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div v-if="bankFiltered.length === 0" class="text-center py-10 text-muted/40 flex flex-col items-center gap-2">
            <Search class="w-10 h-10" />
            <p class="text-sm">No hay preguntas compatibles con {{ form.tipo_cuestionario }}.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Modal crear / editar pregunta ─────────────────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isQuestionModalOpen"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          @click.self="closeQuestionModal">

          <!--
            FIX OVERFLOW: flex column con max-h y overflow en el cuerpo,
            footer siempre visible en la parte inferior.
          -->
          <div class="bg-white rounded-3xl shadow-xl w-full max-w-lg flex flex-col max-h-[90dvh] border border-border">

            <!-- Cuerpo scrolleable -->
            <div class="flex-1 overflow-y-auto p-6 space-y-5">

              <!-- Header del modal -->
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h2 class="font-display text-xl font-semibold text-black">
                    {{ questionModalMode === 'crear' ? 'Crear Pregunta' : 'Editar Pregunta' }}
                  </h2>
                  <p class="text-xs text-muted mt-0.5">
                    {{ questionModalMode === 'crear'
                      ? 'Se guardará en el banco y podrás reutilizarla en otros cuestionarios.'
                      : 'Los cambios se reflejarán en todos los cuestionarios que usen esta pregunta.' }}
                  </p>
                </div>
                <button class="w-8 h-8 rounded-xl border border-border text-muted hover:text-black hover:bg-surface transition-all shrink-0"
                  @click="closeQuestionModal">
                  <X class="w-4 h-4 mx-auto" />
                </button>
              </div>

              <!-- Texto de la pregunta -->
              <div>
                <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Pregunta</label>
                <textarea v-model="questionForm.text" rows="3" placeholder="Escribe la pregunta..."
                  class="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
                <p v-if="questionFormErrors.text" class="text-xs text-red-500 mt-1">{{ questionFormErrors.text }}</p>
              </div>

              <!-- Tipo de control -->
              <div>
                <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Tipo de control</label>
                <div class="grid grid-cols-2 gap-2">
                  <label v-for="type in controlTypes" :key="type.value"
                    :class="['border rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer transition-all', questionForm.controlType === type.value ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-muted hover:border-accent/30']">
                    <input v-model="questionForm.controlType" type="radio" class="sr-only" :value="type.value" />
                    {{ type.label }}
                  </label>
                </div>
              </div>

              <!-- Compatible con -->
              <div>
                <label class="block text-[10px] font-bold text-muted uppercase tracking-wide mb-1">Compatible con</label>
                <div class="grid grid-cols-2 gap-2">
                  <label v-for="t in ['24h', '72h']" :key="t"
                    :class="['border rounded-xl px-3 py-2.5 text-xs font-bold cursor-pointer text-center transition-all', questionForm.questionnaireTypes.includes(t) ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-border bg-surface text-muted hover:border-blue-200']">
                    <input type="checkbox" class="sr-only" :checked="questionForm.questionnaireTypes.includes(t)" @change="toggleQuestionnaireType(t)" />
                    {{ t }}
                  </label>
                </div>
                <p v-if="questionFormErrors.questionnaireTypes" class="text-xs text-red-500 mt-1">{{ questionFormErrors.questionnaireTypes }}</p>
              </div>

              <!-- Opciones (solo opción múltiple) -->
              <div v-if="questionForm.controlType === 'opcion_multiple'" class="space-y-2">
                <label class="block text-[10px] font-bold text-muted uppercase tracking-wide">Opciones</label>
                <div v-for="(_, index) in questionForm.options" :key="index" class="flex gap-2">
                  <input v-model="questionForm.options[index]" type="text" :placeholder="`Opción ${index + 1}`"
                    class="flex-1 bg-surface border border-border rounded-xl px-4 py-2 text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
                  <button v-if="questionForm.options.length > 2"
                    class="w-9 h-9 rounded-xl border border-border text-muted hover:text-red-500 hover:bg-red-50 transition-all"
                    @click="questionForm.options.splice(index, 1)">
                    <Trash2 class="w-4 h-4 mx-auto" />
                  </button>
                </div>
                <button class="text-xs font-bold text-accent hover:text-accent/70" @click="questionForm.options.push('')">+ Agregar opción</button>
                <p v-if="questionFormErrors.options" class="text-xs text-red-500 mt-1">{{ questionFormErrors.options }}</p>
              </div>

              <!-- ── Valor de alerta clínica ─────────────────────────── -->
              <div class="rounded-2xl border border-border bg-surface p-4 space-y-3">
                <label class="block text-[10px] font-bold text-muted uppercase tracking-wide">
                  Valor de alerta clínica
                  <span class="font-normal text-muted/50 normal-case tracking-normal ml-1">(opcional)</span>
                </label>

                <!-- Escala 1-10 -->
                <div v-if="questionForm.controlType === 'escala_1_10'" class="flex items-center gap-2">
                  <span class="text-xs text-muted">Alertar si el valor es mayor o igual a</span>
                  <input v-model.number="questionForm.alertMin" type="number" min="1" max="10" placeholder="8"
                    class="w-20 bg-card border border-border rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
                </div>

                <!--
                  BUG FIX: las etiquetas anteriores eran "Sí dispara alerta" / "No dispara alerta",
                  lo que hacía pensar que "No dispara alerta" = sin alerta. En realidad ambas opciones
                  CONFIGURAN una alerta (que dispara según la respuesta del paciente).
                  Las nuevas etiquetas son explícitas: "Alerta si responde Sí" / "Alerta si responde No".
                  Para NO tener alerta, simplemente no se selecciona ninguna opción (o se borra con ✕).
                -->
                <div v-else-if="questionForm.controlType === 'booleano_si_no'" class="space-y-2">
                  <div class="flex gap-2">
                    <label v-for="opt in alertBooleanOptions" :key="opt.value"
                      :class="['flex-1 text-center border rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition-all',
                        questionForm.alertValue === opt.value
                          ? 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-border bg-card text-muted hover:border-amber-300']">
                      <input v-model="questionForm.alertValue" type="radio" class="sr-only" :value="opt.value" />
                      {{ opt.label }}
                    </label>
                    <!-- Botón para limpiar la selección → sin alerta -->
                    <button v-if="questionForm.alertValue"
                      class="w-9 h-9 rounded-xl border border-border text-muted hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                      title="Sin alerta"
                      @click="questionForm.alertValue = null">
                      <X class="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                  <p class="text-[10px] text-muted">
                    Sin selección = esta pregunta no genera alerta automática.
                  </p>
                </div>

                <!-- Opción múltiple -->
                <div v-else-if="questionForm.controlType === 'opcion_multiple'">
                  <input v-model="questionForm.alertIncludes" type="text"
                    placeholder="Texto de opción que dispara alerta. Ej. Pus"
                    class="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm text-black placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" />
                  <p class="text-[10px] text-muted mt-1">Deja vacío si ninguna opción debe generar alerta.</p>
                </div>

                <!-- Texto libre -->
                <p v-else class="text-xs text-muted">Las preguntas de texto libre no generan alerta automática.</p>
              </div>

            </div><!-- /cuerpo scrolleable -->

            <!-- Footer siempre visible -->
            <div class="px-6 pb-6 pt-4 border-t border-border shrink-0 flex gap-3">
              <button class="flex-1 border border-border rounded-2xl py-3 text-sm font-bold text-muted hover:bg-surface hover:text-black transition-all"
                @click="closeQuestionModal">
                Cancelar
              </button>
              <button :disabled="isSavingQuestion"
                class="flex-1 bg-accent text-white rounded-2xl py-3 text-sm font-bold hover:bg-accent/90 transition-all disabled:opacity-60"
                @click="saveQuestion">
                {{ isSavingQuestion
                    ? 'Guardando...'
                    : questionModalMode === 'crear' ? 'Agregar pregunta' : 'Guardar cambios' }}
              </button>
            </div>

          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Modal: advertencia sin alertas clínicas ───────────────────── -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showNoAlertWarning" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div class="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 space-y-4 border border-border">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle class="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 class="font-bold text-black">Sin alertas clínicas configuradas</h3>
                <p class="text-sm text-muted mt-1 leading-relaxed">
                  Ninguna de las preguntas de este cuestionario tiene configurada una alerta clínica.
                  Si el paciente reporta síntomas de riesgo, el sistema <strong class="text-black">no podrá notificarte automáticamente</strong>.
                </p>
              </div>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
              Para configurar alertas, edita las preguntas del banco usando el botón ✏ y define el valor de alerta clínica correspondiente.
            </div>
            <div class="flex gap-3">
              <button class="flex-1 border border-border rounded-2xl py-3 text-sm font-bold text-muted hover:bg-surface hover:text-black transition-all"
                @click="showNoAlertWarning = false">
                Revisar preguntas
              </button>
              <button :disabled="isSaving"
                class="flex-1 bg-accent text-white rounded-2xl py-3 text-sm font-bold hover:bg-accent/90 transition-all disabled:opacity-60"
                @click="confirmarGuardarSinAlertas">
                Guardar de todas formas
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/shared/routes'
import { httpClient } from '@/shared/api/http'
import { preguntaBaseApi, type PreguntaBase } from '@/entities/preguntaBase'
import {
    AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ClipboardList,
    Loader2, Pencil, Plus, Save, Search, Trash2, X
} from 'lucide-vue-next'

type TipoControl    = 'escala_1_10' | 'booleano_si_no' | 'texto_libre' | 'opcion_multiple'
type TipoCuestionario = '24h' | '72h'
type AlertValue     = { min: number } | { valor: 'true' | 'false' } | { incluye: string } | null

interface Procedure                   { id_procedimiento: number; nombre_procedimiento: string }
interface ProceduresResponse          { message: string; listaCatalogo: Procedure[] }
interface CreateQuestionnaireResponse { message: string; cuestionario: { id_cuestionario: number } }

const route       = useRoute()
const router      = useRouter()
const routeParams = computed(() => ({ id: String(route.params.id ?? '') }))

// ── Formulario del cuestionario ───────────────────────────────────────────
const form = reactive({
    nombre_cuestionario: '',
    tipo_cuestionario:   '24h' as TipoCuestionario,
    id_procedimiento:    null as number | null,
    descripcion:         ''
})
const formErrors = reactive({ nombre_cuestionario: '', id_procedimiento: '' })

// ── Banco de preguntas ────────────────────────────────────────────────────
const bankQuestions  = ref<PreguntaBase[]>([])
const isLoadingBank  = ref(false)

async function loadBank() {
    isLoadingBank.value = true
    try {
        const res = await preguntaBaseApi.listar()
        bankQuestions.value = res.preguntas
    } catch {
        errorMessage.value = 'No se pudo cargar el banco de preguntas.'
    } finally {
        isLoadingBank.value = false
    }
}

// Filtrar banco por tipo del cuestionario y búsqueda
const searchQuery  = ref('')
const bankFiltered = computed(() => {
    const builderIds = new Set(builderQuestions.value.map(q => q.id_pregunta_base))
    let list = bankQuestions.value.filter(q => {
        const compatibleTipo = form.tipo_cuestionario === '24h' ? q.aplica_24h : q.aplica_72h
        return compatibleTipo && !builderIds.has(q.id_pregunta_base)
    })
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(p => p.texto_pregunta.toLowerCase().includes(q))
    }
    return list
})

// ── Procedimientos ────────────────────────────────────────────────────────
const procedures        = ref<Procedure[]>([])
const isLoadingProcedures = ref(false)

async function loadProcedures() {
    isLoadingProcedures.value = true
    try {
        const response = await httpClient.get<ProceduresResponse>('/catalogo-procedimientos')
        procedures.value = response.listaCatalogo ?? []
    } catch (error: any) {
        errorMessage.value = error?.response?.data?.message ?? 'No se pudo cargar el catálogo de procedimientos.'
    } finally {
        isLoadingProcedures.value = false
    }
}

// ── Builder (zona de arrastrar) ───────────────────────────────────────────
const builderQuestions = ref<PreguntaBase[]>([])

function addToBuilder(q: PreguntaBase) {
    if (builderQuestions.value.some(b => b.id_pregunta_base === q.id_pregunta_base)) {
        errorMessage.value = 'Esta pregunta ya fue añadida.'
        return
    }
    errorMessage.value = null
    builderQuestions.value.push({ ...q })
}

function removeFromBuilder(id: number) {
    builderQuestions.value = builderQuestions.value.filter(q => q.id_pregunta_base !== id)
}

// ── Drag & Drop ───────────────────────────────────────────────────────────
const draggedItem = ref<PreguntaBase | null>(null)
const isDragging  = ref(false)

function onDragStart(event: DragEvent, q: PreguntaBase) {
    draggedItem.value  = q
    isDragging.value   = true
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', String(q.id_pregunta_base))
    }
}
function onDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
}
function onDragLeave() { isDragging.value = false }
function onDragEnd()   { isDragging.value = false }
function onDrop(event: DragEvent) {
    event.preventDefault()
    isDragging.value = false
    if (draggedItem.value) addToBuilder(draggedItem.value)
    draggedItem.value = null
}

// ── Guardar cuestionario ──────────────────────────────────────────────────
const isSaving          = ref(false)
const errorMessage      = ref<string | null>(null)
const successMessage    = ref<string | null>(null)
const showNoAlertWarning = ref(false)

function validateQuestionnaire() {
    let ok = true
    formErrors.nombre_cuestionario = ''
    formErrors.id_procedimiento    = ''
    if (!form.nombre_cuestionario.trim()) { formErrors.nombre_cuestionario = 'El nombre es obligatorio.'; ok = false }
    if (!form.id_procedimiento)           { formErrors.id_procedimiento    = 'Selecciona un procedimiento.'; ok = false }
    if (builderQuestions.value.length === 0) { errorMessage.value = 'Agrega al menos una pregunta.'; ok = false }
    return ok
}

async function saveQuestionnaire() {
    errorMessage.value   = null
    successMessage.value = null
    if (!validateQuestionnaire()) return

    // Advertencia si ninguna pregunta tiene alerta clínica configurada
    const tieneAlguna = builderQuestions.value.some(q => q.valor_alerta !== null)
    if (!tieneAlguna) {
        showNoAlertWarning.value = true
        return
    }

    await doSaveQuestionnaire()
}

async function confirmarGuardarSinAlertas() {
    showNoAlertWarning.value = false
    await doSaveQuestionnaire()
}

async function doSaveQuestionnaire() {
    isSaving.value = true
    try {
        const res = await httpClient.post<CreateQuestionnaireResponse, any>('/cuestionario', {
            nombre_cuestionario: form.nombre_cuestionario.trim(),
            tipo_cuestionario:   form.tipo_cuestionario,
            id_procedimiento:    form.id_procedimiento,
            descripcion:         form.descripcion.trim() || null
        })

        const id_cuestionario = res.cuestionario.id_cuestionario

        await httpClient.post(`/cuestionario/${id_cuestionario}/preguntas`, {
            preguntas: builderQuestions.value.map((q, idx) => ({
                id_pregunta_base: q.id_pregunta_base,
                orden:            idx
            }))
        })

        successMessage.value = `Cuestionario guardado con ${builderQuestions.value.length} pregunta(s).`
        window.setTimeout(() => {
            void router.push({ name: ROUTE_NAMES.DENTIST_QUESTIONNAIRES, params: routeParams.value })
        }, 1200)
    } catch (error: any) {
        errorMessage.value = error?.response?.data?.message ?? 'No se pudo guardar el cuestionario.'
    } finally {
        isSaving.value = false
    }
}

// ── Modal crear / editar pregunta ─────────────────────────────────────────
const isQuestionModalOpen = ref(false)
const isSavingQuestion    = ref(false)
const questionModalMode   = ref<'crear' | 'editar'>('crear')
const editingQuestionId   = ref<number | null>(null)

const questionForm = reactive({
    text:               '',
    controlType:        'booleano_si_no' as TipoControl,
    options:            ['', ''],
    alertMin:           null as number | null,
    alertValue:         null as 'true' | 'false' | null,
    alertIncludes:      '',
    questionnaireTypes: ['24h', '72h'] as string[]
})

const questionFormErrors = reactive({ text: '', options: '', questionnaireTypes: '' })

const controlTypes = [
    { value: 'escala_1_10',    label: 'Escala 1–10' },
    { value: 'booleano_si_no', label: 'Sí / No' },
    { value: 'opcion_multiple', label: 'Opción múltiple' },
    { value: 'texto_libre',    label: 'Texto libre' }
]

// FIX: etiquetas claras que no confunden con "sin alerta"
const alertBooleanOptions = [
    { value: 'true',  label: 'Alerta si responde Sí' },
    { value: 'false', label: 'Alerta si responde No' },
] as const

// Limpiar alerta al cambiar tipo de control
watch(() => questionForm.controlType, () => {
    questionForm.alertMin      = null
    questionForm.alertValue    = null
    questionForm.alertIncludes = ''
    if (questionForm.controlType !== 'opcion_multiple') {
        questionForm.options = ['', '']
    }
})

function openQuestionModal(q?: PreguntaBase) {
    questionFormErrors.text               = ''
    questionFormErrors.options            = ''
    questionFormErrors.questionnaireTypes = ''

    if (q) {
        // ── Modo editar: pre-llenar con datos existentes ──────────────
        questionModalMode.value  = 'editar'
        editingQuestionId.value  = q.id_pregunta_base
        const va = q.valor_alerta as any
        Object.assign(questionForm, {
            text:          q.texto_pregunta,
            controlType:   q.tipo_control,
            options:       q.opciones && q.opciones.length >= 2 ? [...q.opciones] : ['', ''],
            alertMin:      va && 'min'     in va ? va.min     : null,
            alertValue:    va && 'valor'   in va ? va.valor   : null,
            alertIncludes: va && 'incluye' in va ? va.incluye : '',
            questionnaireTypes: [
                ...(q.aplica_24h ? ['24h'] : []),
                ...(q.aplica_72h ? ['72h'] : [])
            ]
        })
    } else {
        // ── Modo crear ────────────────────────────────────────────────
        questionModalMode.value  = 'crear'
        editingQuestionId.value  = null
        Object.assign(questionForm, {
            text: '', controlType: 'booleano_si_no', options: ['', ''],
            alertMin: null, alertValue: null, alertIncludes: '',
            questionnaireTypes: ['24h', '72h']
        })
    }

    isQuestionModalOpen.value = true
}

function closeQuestionModal() { isQuestionModalOpen.value = false }

function toggleQuestionnaireType(t: string) {
    const idx = questionForm.questionnaireTypes.indexOf(t)
    idx >= 0
        ? questionForm.questionnaireTypes.splice(idx, 1)
        : questionForm.questionnaireTypes.push(t)
}

function buildAlertValue(): AlertValue {
    if (questionForm.controlType === 'escala_1_10' && questionForm.alertMin !== null)
        return { min: questionForm.alertMin }
    // FIX: solo se incluye valor_alerta cuando el dentista ELIGIÓ una opción (alertValue !== null)
    if (questionForm.controlType === 'booleano_si_no' && questionForm.alertValue !== null)
        return { valor: questionForm.alertValue }
    if (questionForm.controlType === 'opcion_multiple' && questionForm.alertIncludes.trim())
        return { incluye: questionForm.alertIncludes.trim() }
    return null
}

async function saveQuestion() {
    questionFormErrors.text               = ''
    questionFormErrors.options            = ''
    questionFormErrors.questionnaireTypes = ''

    if (!questionForm.text.trim())                  { questionFormErrors.text = 'La pregunta es obligatoria.'; return }
    if (questionForm.questionnaireTypes.length === 0) { questionFormErrors.questionnaireTypes = 'Selecciona al menos un tipo.'; return }

    const options = questionForm.options.map(o => o.trim()).filter(Boolean)
    if (questionForm.controlType === 'opcion_multiple' && options.length < 2) {
        questionFormErrors.options = 'Agrega mínimo dos opciones.'; return
    }

    const payload = {
        texto_pregunta:    questionForm.text.trim(),
        tipo_control:      questionForm.controlType,
        opciones:          questionForm.controlType === 'opcion_multiple' ? options : null,
        valor_alerta:      buildAlertValue(),
        aplica_24h:        questionForm.questionnaireTypes.includes('24h'),
        aplica_72h:        questionForm.questionnaireTypes.includes('72h')
    }

    isSavingQuestion.value = true
    try {
        if (questionModalMode.value === 'editar' && editingQuestionId.value !== null) {
            // ── Editar pregunta existente ─────────────────────────────
            const res = await preguntaBaseApi.editar(editingQuestionId.value, payload)

            // Actualizar en bankQuestions
            const bIdx = bankQuestions.value.findIndex(q => q.id_pregunta_base === editingQuestionId.value)
            if (bIdx !== -1) bankQuestions.value[bIdx] = res.pregunta

            // Actualizar en builderQuestions si ya estaba añadida
            const wIdx = builderQuestions.value.findIndex(q => q.id_pregunta_base === editingQuestionId.value)
            if (wIdx !== -1) builderQuestions.value[wIdx] = res.pregunta
        } else {
            // ── Crear nueva pregunta ──────────────────────────────────
            const res = await preguntaBaseApi.crear(payload)

            // Agregar al banco local
            bankQuestions.value.unshift(res.pregunta)

            // Agregar al builder si es compatible con el tipo actual
            if (
                (form.tipo_cuestionario === '24h' && res.pregunta.aplica_24h) ||
                (form.tipo_cuestionario === '72h' && res.pregunta.aplica_72h)
            ) {
                addToBuilder(res.pregunta)
            }
        }

        closeQuestionModal()
    } catch (error: any) {
        questionFormErrors.text = error?.response?.data?.message ?? 'No se pudo guardar la pregunta.'
    } finally {
        isSavingQuestion.value = false
    }
}

// ── Eliminar pregunta del banco ───────────────────────────────────────────
async function deleteQuestion(q: PreguntaBase) {
    const preview = q.texto_pregunta.length > 60
        ? q.texto_pregunta.substring(0, 60) + '...'
        : q.texto_pregunta

    if (!confirm(`¿Eliminar la pregunta "${preview}"?\n\nEsta acción no se puede deshacer.`)) return

    try {
        await preguntaBaseApi.eliminar(q.id_pregunta_base)

        // Retirar del banco y del builder
        bankQuestions.value    = bankQuestions.value.filter(b => b.id_pregunta_base !== q.id_pregunta_base)
        builderQuestions.value = builderQuestions.value.filter(b => b.id_pregunta_base !== q.id_pregunta_base)
    } catch (error: any) {
        errorMessage.value = error?.response?.data?.message ?? 'No se pudo eliminar la pregunta.'
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function typeLabel(type: TipoControl) {
    const labels: Record<TipoControl, string> = {
        escala_1_10:    'Escala 1–10',
        booleano_si_no: 'Sí / No',
        texto_libre:    'Texto libre',
        opcion_multiple: 'Opción múltiple'
    }
    return labels[type]
}

onMounted(() => {
    void loadProcedures()
    void loadBank()
})
</script>

<style scoped>
.fade-in { animation: fadeIn 0.25s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.45); border-radius: 999px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.6); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>