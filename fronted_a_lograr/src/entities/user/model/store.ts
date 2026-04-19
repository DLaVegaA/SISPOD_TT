// entities/user/model/store.ts
// Store reactivo de usuarios. Solo CRUD básico — sin validaciones de formulario.
// Las features orquestan la lógica de negocio encima de este store.

import { ref, computed } from "vue";
import type { User, CreateUserDto, UpdateUserDto } from "./types";
import { formatDate, generateId } from "@/shared/lib";

const SEED_USERS: User[] = [
  {
    id: 1,
    name: "Dr. Carlos Mendoza",
    email: "cmendoza@clinica.com",
    role: "dentist",
    status: "active",
    createdAt: "12 ene 2025",
  },
  {
    id: 2,
    name: "Ana Rodríguez",
    email: "arodriguez@clinica.com",
    role: "assistant",
    status: "active",
    createdAt: "15 ene 2025",
  },
  {
    id: 3,
    name: "Luis Hernández",
    email: "lhernandez@clinica.com",
    role: "patient",
    status: "active",
    createdAt: "20 ene 2025",
  },
  {
    id: 4,
    name: "Sandra Torres",
    email: "storres@clinica.com",
    role: "admin",
    status: "active",
    createdAt: "01 feb 2025",
  },
  {
    id: 5,
    name: "Miguel Pérez",
    email: "mperez@clinica.com",
    role: "patient",
    status: "inactive",
    createdAt: "03 feb 2025",
  },
  {
    id: 6,
    name: "Dra. Laura Gómez",
    email: "lgomez@clinica.com",
    role: "dentist",
    status: "active",
    createdAt: "10 feb 2025",
  },
  {
    id: 7,
    name: "Roberto Castro",
    email: "rcastro@clinica.com",
    role: "patient",
    status: "active",
    createdAt: "14 feb 2025",
  },
];

// Singleton reactivo — compartido en toda la aplicación
const _users = ref<User[]>([...SEED_USERS]);

export function useUserStore() {
  const all = computed(() => _users.value);
  const totalCount = computed(() => _users.value.length);
  const activeCount = computed(
    () => _users.value.filter((u) => u.status === "active").length,
  );
  const inactiveCount = computed(
    () => _users.value.filter((u) => u.status === "inactive").length,
  );

  function countByRole(roleId: string): number {
    return _users.value.filter((u) => u.role === roleId).length;
  }

  function createUser(dto: CreateUserDto): User {
    const user: User = {
      id: generateId(),
      name: dto.name,
      email: dto.email,
      role: dto.role,
      status: dto.status,
      createdAt: formatDate(),
    };
    _users.value.unshift(user);
    return user;
  }

  function updateUser(id: number, dto: UpdateUserDto): void {
    const idx = _users.value.findIndex((u) => u.id === id);
    if (idx !== -1) {
      _users.value[idx] = { ..._users.value[idx], ...dto };
    }
  }

  function deleteUser(id: number): void {
    _users.value = _users.value.filter((u) => u.id !== id);
  }

  return {
    all,
    totalCount,
    activeCount,
    inactiveCount,
    countByRole,
    createUser,
    updateUser,
    deleteUser,
  };
}
