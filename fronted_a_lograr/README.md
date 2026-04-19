# Panel de Superusuario — Vue 3 + TypeScript + FSD

Proyecto de gestión de usuarios estructurado con **Feature-Sliced Design (FSD) v2.1**,
usando **Vue 3**, **TypeScript**, **Vue Router 4** y **Tailwind CSS**.

---

## Instalación

```bash
pnpm install
pnpm dev        # Servidor de desarrollo
pnpm build      # Build de producción
pnpm typecheck  # Verificación de tipos sin compilar
```

---

## Estructura FSD completa

```
src/
├── main.ts                              # Entrypoint — instala plugins, monta App
│
├── app/                                 # Capa App (sin slices)
│   ├── App.vue                          # Componente raíz
│   ├── routes/index.ts                  # Configuración Vue Router
│   ├── providers/AppLayout.vue          # Layout principal con <RouterView>
│   └── styles/global.css               # Estilos globales + Tailwind directives
│
├── pages/                               # Capa Pages (slice = 1 ruta)
│   ├── users/
│   │   ├── ui/UsersPage.vue             # Orquesta toda la gestión de usuarios
│   │   └── index.ts                     # Public API
│   ├── roles/
│   │   ├── ui/RolesPage.vue
│   │   └── index.ts
│   └── stats/
│       ├── ui/StatsPage.vue
│       └── index.ts
│
├── widgets/                             # Capa Widgets (bloques grandes reutilizables)
│   ├── sidebar/
│   │   ├── ui/AppSidebar.vue            # Navegación lateral con RouterLink
│   │   └── index.ts
│   ├── user-table/
│   │   ├── ui/UserTable.vue             # Tabla con acciones por fila
│   │   └── index.ts
│   ├── user-form-modal/
│   │   ├── ui/UserFormModal.vue         # Modal compartido crear/editar
│   │   └── index.ts
│   └── delete-confirm-modal/
│       ├── ui/DeleteConfirmModal.vue
│       └── index.ts
│
├── features/                            # Capa Features (acciones del usuario)
│   ├── create-user/
│   │   ├── model/index.ts               # useCreateUserForm() — validación + estado
│   │   └── index.ts
│   ├── edit-user/
│   │   ├── model/index.ts               # useEditUserForm() — carga + validación
│   │   └── index.ts
│   ├── delete-user/
│   │   ├── model/index.ts               # useDeleteUser() — estado de confirmación
│   │   └── index.ts
│   └── filter-users/
│       ├── model/index.ts               # useFilterUsers() — búsqueda y filtros
│       ├── ui/FilterBar.vue             # Barra de búsqueda y selects
│       └── index.ts
│
├── entities/                            # Capa Entities (dominio de negocio)
│   ├── user/
│   │   ├── model/
│   │   │   ├── types.ts                 # User, CreateUserDto, UpdateUserDto
│   │   │   └── store.ts                 # useUserStore() — CRUD reactivo
│   │   ├── ui/
│   │   │   ├── UserAvatar.vue
│   │   │   └── UserRoleBadge.vue
│   │   └── index.ts                     # Public API
│   └── role/
│       ├── model/index.ts
│       ├── ui/RoleCard.vue
│       └── index.ts
│
└── shared/                              # Capa Shared (sin slices, solo segmentos)
    ├── config/
    │   ├── roles.ts                     # ROLES, ROLE_META, ROLES_LIST, tipos
    │   └── index.ts
    ├── lib/index.ts                     # isValidEmail, formatDate, generateId
    ├── routes/index.ts                  # ROUTE_NAMES, ROUTE_PATHS (constantes)
    └── ui/
        ├── UiButton/                    # Variantes: primary, danger, ghost, outline
        ├── UiBadge/                     # Badge con colores semánticos
        ├── UiInput/                     # Input con label, error, prefix/suffix icons
        ├── UiSelect/                    # Select estilizado
        ├── UiModal/                     # Modal base con Transition + overlay
        └── UiToast/                     # Notificación flotante con tipos
```

---

## Reglas FSD aplicadas

### 1. Import rule on layers

Cada capa solo importa de capas **estrictamente inferiores**:

```
app → pages → widgets → features → entities → shared
```

```ts
// ✅ Correcto: widget importa de entity
import { UserAvatar } from '@/entities/user'

// ❌ Incorrecto: entity no puede importar de feature
import { useCreateUserForm } from '@/features/create-user'
```

### 2. Public API rule on slices

Todo acceso externo pasa por `index.ts`. Nunca se importa desde rutas internas.

```ts
// ✅ Correcto — usar la Public API
import { useUserStore, UserAvatar } from '@/entities/user'

// ❌ Incorrecto — acceso a ruta interna
import { useUserStore } from '@/entities/user/model/store'
```

### 3. Zero coupling entre slices del mismo layer

```ts
// ❌ Prohibido — features no se importan entre sí
// features/create-user/model/index.ts
import { useEditUserForm } from '@/features/edit-user' // VIOLACIÓN
```

### 4. App y Shared sin slices

- `shared/` → segmentos directos: `config/`, `lib/`, `routes/`, `ui/`
- `app/` → segmentos directos: `routes/`, `styles/`, `providers/`

### 5. Segmentos estándar

| Segmento | Contenido |
|---|---|
| `ui/` | Componentes Vue |
| `model/` | Estado reactivo, tipos, validación |
| `api/` | Llamadas HTTP (preparado para conectar) |
| `lib/` | Utilidades genéricas |
| `config/` | Constantes y configuración |

---

## Flujo de datos

```
UsersPage (page)
  ├── useUserStore()       ← entity   — estado global CRUD
  ├── useFilterUsers()     ← feature  — filtros reactivos
  ├── useCreateUserForm()  ← feature  — form + validación
  ├── useEditUserForm()    ← feature  — form + validación + carga
  ├── useDeleteUser()      ← feature  — confirmación
  ├── FilterBar            ← feature/ui
  ├── UserTable            ← widget   — tabla + UserAvatar + UserRoleBadge
  ├── UserFormModal        ← widget   — modal reutilizado crear/editar
  └── DeleteConfirmModal   ← widget
```

## Vue Router

Las rutas están definidas en `app/routes/index.ts` con **lazy loading** por página.
Las constantes de ruta (`ROUTE_NAMES`, `ROUTE_PATHS`) viven en `shared/routes`
y son consumidas tanto por el router como por los widgets de navegación.

```ts
// shared/routes/index.ts
export const ROUTE_PATHS = {
  USERS: '/users',
  ROLES: '/roles',
  STATS: '/stats',
}
```

```ts
// app/routes/index.ts
const UsersPage = () => import('@/pages/users/ui/UsersPage.vue') // lazy
```
