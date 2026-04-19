<template>
  <div class="fade-in">
    <!-- Cabecera -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-2xl font-extrabold text-black">
          Gestión de Usuarios
        </h1>
        <p class="text-muted text-sm mt-1">
          {{ filteredUsers.length }} usuarios encontrados
        </p>
      </div>
      <button
        class="flex items-center gap-2 bg-accent hover:bg-accent px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        @click="openCreate"
      >
        <UserPlus class="w-4 h-4" />
        Nuevo Usuario
      </button>
    </div>

    <!-- Filtros (feature) -->
    <div class="mb-6">
      <FilterBar :filters="filters" />
    </div>
    a

    <!-- Tabla (widget) -->
    <UserTable
      :users="filteredUsers"
      @edit="openEdit"
      @delete="deleteState.requestDelete"
    />

    <!-- Modal crear / editar (widget) -->
    <UserFormModal
      v-model="showForm"
      :form="activeForm as Record<string, unknown>"
      :errors="activeErrors as Record<string, string | undefined>"
      :is-edit="isEditMode"
      :show-password="createForm.showPwd.value"
      @submit="handleSubmit"
      @toggle-password="createForm.showPwd.value = !createForm.showPwd.value"
    />

    <!-- Modal eliminar (widget) -->
    <DeleteConfirmModal
      v-model="deleteState.showConfirm.value"
      :user="deleteState.targetUser.value"
      @confirm="handleDelete"
    />

    <!-- Toast (shared) -->
    <UiToast v-model="toastShow" :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { UserPlus } from "lucide-vue-next";

// widgets — capa inferior ✅
import { UserTable } from "@/widgets/user-table";
import { UserFormModal } from "@/widgets/user-form-modal";
import { DeleteConfirmModal } from "@/widgets/delete-confirm-modal";

// features — capa inferior ✅
import { useFilterUsers, FilterBar } from "@/features/filter-users";
import { useCreateUserForm } from "@/features/create-user";
import { useEditUserForm } from "@/features/edit-user";
import { useDeleteUser } from "@/features/delete-user";

// entities — capa inferior ✅
import { useUserStore } from "@/entities/user";
import type { User } from "@/entities/user";

// shared — capa inferior ✅
import { UiToast } from "@/shared/ui/UiToast";

// ── Store ────────────────────────────────────────────────────────────────
const store = useUserStore();

// ── Filtros ──────────────────────────────────────────────────────────────
const filters = useFilterUsers();
const filteredUsers = filters.applyFilters(store.all);

// ── Formularios ──────────────────────────────────────────────────────────
const createForm = useCreateUserForm();
const editForm = useEditUserForm();

const isEditMode = ref(false);
const editTargetId = ref<number | null>(null);
const showForm = ref(false);

const activeForm = computed(() =>
  isEditMode.value ? editForm.form : createForm.form,
);
const activeErrors = computed(() =>
  isEditMode.value ? editForm.errors : createForm.errors,
);

// ── Eliminación ──────────────────────────────────────────────────────────
const deleteState = useDeleteUser();

// ── Toast ────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
const toastShow = ref(false);
const toastMessage = ref("");
const toastType = ref<ToastType>("success");

function showToast(message: string, type: ToastType = "success"): void {
  toastShow.value = false;
  setTimeout(() => {
    toastMessage.value = message;
    toastType.value = type;
    toastShow.value = true;
    setTimeout(() => {
      toastShow.value = false;
    }, 3000);
  }, 50);
}

// ── Handlers ─────────────────────────────────────────────────────────────v
function openCreate(): void {
  isEditMode.value = false;
  editTargetId.value = null;
  createForm.reset();
  showForm.value = true;
}

function openEdit(user: User): void {
  isEditMode.value = true;
  editTargetId.value = user.id;
  editForm.load(user);
  showForm.value = true;
}

function handleSubmit(): void {
  if (isEditMode.value) {
    if (!editForm.validate()) return;
    store.updateUser(editTargetId.value!, editForm.toDto());
    showForm.value = false;
    showToast("Usuario actualizado correctamente", "success");
  } else {
    if (!createForm.validate()) return;
    store.createUser({ ...createForm.form });
    showForm.value = false;
    showToast("Usuario creado exitosamente", "success");
  }
}

function handleDelete(): void {
  if (!deleteState.targetUser.value) return;
  store.deleteUser(deleteState.targetUser.value.id);
  deleteState.cancel();
  showToast("Usuario eliminado", "error");
}
</script>
