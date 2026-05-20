<template>
  <Transition name="toast">
    <div
      v-if="isVisible"
      @click="close"
      :class="[
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl cursor-pointer',
        colorClass,
      ]"
    >
      <component :is="iconComponent" class="w-5 h-5 shrink" />
      <span class="text-sm font-medium">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, CheckCircle2, Info } from 'lucide-vue-next'
import { toastState, hideToast } from './toast'

type ToastType = 'success' | 'error' | 'info'

interface Props {
  modelValue?: boolean | null
  message?: string
  type?: ToastType
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  type: 'success',
  message: '',
})

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const isVisible = computed(() =>
  props.modelValue === null ? toastState.visible : props.modelValue,
)
const message = computed(() =>
  props.message && props.message.length > 0 ? props.message : toastState.message,
)
const toastType = computed<ToastType>(() => (props.type ? props.type : toastState.type))

const colorClass = computed(
  () =>
    (
      ({
        success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
        error: 'bg-red-500/10 border-red-500/30 text-red-500',
        info: 'bg-accent-dim border-accent/30 text-accent-light',
      }) as Record<ToastType, string>
    )[toastType.value],
)

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const

const iconComponent = computed(() => toastIcons[toastType.value])

function close() {
  if (props.modelValue !== null) {
    emit('update:modelValue', false)
  } else {
    hideToast()
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
