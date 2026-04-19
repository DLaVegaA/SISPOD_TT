<template>
  <UiModal
    :model-value="modelValue"
    max-width="sm"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="p-6 text-center">
      <div
        class="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4"
      >
        <Trash2 class="w-7 h-7 text-red-400" />
      </div>
      <h2 class="font-display font-bold text-black text-lg mb-2">
        ¿Eliminar usuario?
      </h2>
      <p class="text-muted text-sm mb-6">
        Estás a punto de eliminar a
        <strong class="text-black">{{ user?.name }}</strong
        >. Esta acción no se puede deshacer.
      </p>
      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted hover:text-black hover:border-ghost transition-all"
          @click="$emit('update:modelValue', false)"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent text-black text-sm font-medium transition-all hover:scale-105 active:scale-95"
          @click="$emit('confirm')"
        >
          Eliminar
        </button>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";
import { UiModal } from "@/shared/ui/UiModal";
import type { User } from "@/entities/user";

defineProps<{ modelValue: boolean; user: User | null }>();
defineEmits<{ "update:modelValue": [value: boolean]; confirm: [] }>();
</script>
