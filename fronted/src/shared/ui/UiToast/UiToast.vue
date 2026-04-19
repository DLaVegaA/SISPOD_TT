<template>
  <Transition name="toast">
    <div
      v-if="modelValue"
      :class="[
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl',
        colorClass,
      ]"
    >
      <component :is="iconComponent" class="w-5 h-5 flex-shrink-0" />
      <span class="text-sm font-medium">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, CheckCircle2, Info } from 'lucide-vue-next'

type ToastType = 'success' | 'error' | 'info'

interface Props {
  modelValue: boolean
  message?: string
  type?: ToastType
}

const props = withDefaults(defineProps<Props>(), {
  type: 'success',
  message: '',
})

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const colorClass = computed(
  () =>
    ({
      success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
      error: 'bg-red-500/10 border-red-500/30 text-red-500',
      info: 'bg-accent-dim border-accent/30 text-accent-light',
    })[props.type],
)

const iconComponent = computed(
  () =>
    ({
      success: CheckCircle2,
      error: AlertCircle,
      info: Info,
    })[props.type],
)
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
