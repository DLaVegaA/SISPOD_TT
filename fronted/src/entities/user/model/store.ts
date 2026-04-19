import { computed, ref } from 'vue'
import type { User, CreateUserDto, UpdateUserDto } from './types'
import {
  getUsers as getUsersRequest,
  createUser as createUserRequest,
  updateUser as updateUserRequest,
  deleteUser as deleteUserRequest,
} from '../api/usersApi'

const users = ref<User[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

export function useUserStore() {
  const all = computed(() => users.value)
  const totalCount = computed(() => users.value.length)
  const activeCount = computed(() => users.value.filter((user) => user.status === 'active').length)
  const inactiveCount = computed(
    () => users.value.filter((user) => user.status === 'inactive').length,
  )

  function countByRole(roleId: string): number {
    return users.value.filter((user) => user.role === roleId).length
  }

  async function fetchUsers(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      users.value = await getUsersRequest()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudo cargar la lista de usuarios'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function createUser(dto: CreateUserDto): Promise<User> {
    const user = await createUserRequest(dto)
    users.value.unshift(user)
    return user
  }

  async function updateUser(id: number, dto: UpdateUserDto): Promise<void> {
    const updated = await updateUserRequest(id, dto)
    const index = users.value.findIndex((user) => user.id === id)

    if (index !== -1) {
      users.value[index] = {
        ...users.value[index],
        ...updated,
      }
    }
  }

  async function deleteUser(id: number): Promise<void> {
    await deleteUserRequest(id)
    users.value = users.value.filter((user) => user.id !== id)
  }

  return {
    all,
    isLoading,
    error,
    totalCount,
    activeCount,
    inactiveCount,
    countByRole,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  }
}
