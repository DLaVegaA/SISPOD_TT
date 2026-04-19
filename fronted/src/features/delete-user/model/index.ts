import { ref } from 'vue'
import type { User } from '@/entities/user'

export function useDeleteUser() {
  const targetUser = ref<User | null>(null)
  const showConfirm = ref(false)

  function requestDelete(user: User): void {
    targetUser.value = user
    showConfirm.value = true
  }

  function cancel(): void {
    targetUser.value = null
    showConfirm.value = false
  }

  return { targetUser, showConfirm, requestDelete, cancel }
}
