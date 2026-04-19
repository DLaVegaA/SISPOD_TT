import { ref } from 'vue'
import type { Ref } from 'vue'
import type { User } from '@/entities/user'

export interface FilterState {
  search: Ref<string>
  filterRole: Ref<string>
  filterStatus: Ref<string>
}

export function useFilterUsers() {
  const search = ref('')
  const filterRole = ref('')
  const filterStatus = ref('')

  function applyFilters(users: User[]): User[] {
    const query = search.value.toLowerCase().trim()

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      const matchesRole = !filterRole.value || user.role === filterRole.value
      const matchesStatus = !filterStatus.value || user.status === filterStatus.value

      return matchesSearch && matchesRole && matchesStatus
    })
  }

  function reset(): void {
    search.value = ''
    filterRole.value = ''
    filterStatus.value = ''
  }

  return { search, filterRole, filterStatus, applyFilters, reset }
}
