<template>
  <div class="fade-in">
    <!-- Cabecera -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-display text-2xl font-extrabold text-black">Gestión de Usuarios</h1>
        <p class="text-muted text-sm mt-1">{{ filteredUsers.length }} usuarios encontrados</p>
      </div>

      <button
        class="flex items-center gap-2 bg-ink/65 text-text-secondary hover:bg-ink/80 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
        @click="openCreate"
      >
        <UserPlus class="h-4 w-4" />
        Nuevo Usuario
      </button>
    </div>
    <!-- Filtros -->
    <div class="mb-6">
      <FilterBar :filters="filters" />
    </div>

    <!-- Table  -->
    <UserTable :users="filteredUsers" @edit="openEdit" @delete="deleteState.requestDelete" />

    <!-- Modal Crear/Editar  -->
    <UserFormModal
      v-model="showForm"
      :form="activeForm"
      :errors="activeErrors"
      :is-edit="isEditMode"
      :show-password="createForm.showPwd.value"
      @toggle-password="createForm.showPwd.value = !createForm.showPwd.value"
      @submit="handleSubmit"
    />

    <DeleteConfirmModal
      v-model="deleteState.showConfirm.value"
      :user="deleteState.targetUser.value"
      @confirm="handleDelete"
    />

    <UiToast v-model="toastShow" :message="toastMessage" :type="toastType" />
  </div>
</template>
<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { UserPlus } from 'lucide-vue-next'

// Widgets
import { UserFormModal } from '@/widgets/user-form-modal'
import { UserTable } from '@/widgets/user-table'
import { DeleteConfirmModal } from '@/widgets/delete-confirm-modal'

// Features
import { useCreateUserForm } from '@/features/create-user'
import { FilterBar, useFilterUsers } from '@/features/filter-users'
import { useEditUserForm } from '@/features/edit-user'
import { useDeleteUser } from '@/features/delete-user'

// Entities
import { useUserStore } from '@/entities/user'
import type { User } from '@/entities/user'

// Shared
import { UiToast } from '@/shared/ui/UiToast'

const store = useUserStore()

// Filtros
const filters = useFilterUsers()
const filteredUsers = filters.applyFilters(store.all)

// Formularios
const createForm = useCreateUserForm()
const editForm = useEditUserForm()

const isEditMode = ref(false)
const editTargetId = ref<number | null>(null)
const showForm = ref(false)

const activeForm = computed(
  () => (isEditMode.value ? editForm.form : createForm.form) as Record<string, unknown>,
)
const activeErrors = computed(
  () =>
    (isEditMode.value ? editForm.errors : createForm.errors) as Record<string, string | undefined>,
)

const deleteState = useDeleteUser()

type ToastType = 'success' | 'error' | 'info'
const toastShow = ref(false)
const toastMessage = ref('')
const toastType = ref<ToastType>('success')

function showToast(message: string, type: ToastType = 'success'): void {
  toastShow.value = false
  setTimeout(() => {
    toastMessage.value = message
    toastType.value = type
    toastShow.value = true
    setTimeout(() => {
      toastShow.value = false
    }, 3000)
  }, 50)
}

async function hydrateUsers(): Promise<void> {
  try {
    await store.fetchUsers()
  } catch {
    showToast('No se pudieron cargar los usuarios', 'error')
  }
}

onMounted(() => {
  hydrateUsers()
})

// Handlers
function openCreate(): void {
  isEditMode.value = false
  editTargetId.value = null
  createForm.reset()
  showForm.value = true
}

function openEdit(user: User): void {
  isEditMode.value = true
  editTargetId.value = user.id
  editForm.load(user)
  showForm.value = true
}

async function handleSubmit(): Promise<void> {
  try {
    if (isEditMode.value) {
      if (!editForm.validate() || editTargetId.value === null) return
      await store.updateUser(editTargetId.value, editForm.toDto())
      showForm.value = false
      showToast('Usuario actualizado correctamente', 'success')
      return
    }

    if (!createForm.validate()) return
    await store.createUser({ ...createForm.form })
    showForm.value = false
    showToast('Usuario creado exitosamente', 'success')
  } catch {
    showToast('No fue posible guardar el usuario', 'error')
  }
}

async function handleDelete(): Promise<void> {
  if (!deleteState.targetUser.value) return

  try {
    await store.deleteUser(deleteState.targetUser.value.id)
    deleteState.cancel()
    showToast('Usuario eliminado', 'error')
  } catch {
    showToast('No fue posible eliminar el usuario', 'error')
  }
}
</script>
