// features/filter-users/model/index.ts
// Estado reactivo y lógica de filtrado. Es una feature porque
// representa una acción del usuario (buscar/filtrar).

import { ref, computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { User } from '@/entities/user'

export interface FilterState {
  search:       Ref<string>
  filterRole:   Ref<string>
  filterStatus: Ref<string>
}

export function useFilterUsers() {
  const search       = ref('')
  const filterRole   = ref('')
  const filterStatus = ref('')

  function applyFilters(users: ComputedRef<User[]>): ComputedRef<User[]> {
    return computed(() => {
      const q = search.value.toLowerCase()
      return users.value.filter(u => {
        const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
        const matchRole   = !filterRole.value   || u.role   === filterRole.value
        const matchStatus = !filterStatus.value || u.status === filterStatus.value
        return matchSearch && matchRole && matchStatus
      })
    })
  }

  function reset(): void {
    search.value       = ''
    filterRole.value   = ''
    filterStatus.value = ''
  }

  return { search, filterRole, filterStatus, applyFilters, reset }
}
