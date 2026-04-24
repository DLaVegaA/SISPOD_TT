import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getProfileRequest, loginRequest, logoutRequest } from '../api/sessionApi'
import type { LoginCredentials, SessionStatus, SessionUser } from './types'
import { normalizeRole } from '@/shared/routes'

const SESSION_USER_KEY = 'session_user'
const SESSION_TOKEN_KEY = 'session_access_token'
const SESSION_ACTIVE_KEY = 'session_active'

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function readStoredToken(): string | null {
  const storage = getStorage()

  if (!storage) {
    return null
  }

  const token = storage.getItem(SESSION_TOKEN_KEY)
  return token && token.length > 0 ? token : null
}

function readStoredActiveFlag(): boolean {
  const storage = getStorage()

  if (!storage) {
    return false
  }

  return storage.getItem(SESSION_ACTIVE_KEY) === '1'
}

function readStoredUser(): SessionUser | null {
  const storage = getStorage()

  if (!storage) {
    return null
  }

  const raw = storage.getItem(SESSION_USER_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)

    if (!isRecord(parsed)) {
      return null
    }

    return normalizeUser(parsed)
  } catch {
    return null
  }
}

function persistSession(nextUser: SessionUser | null, nextToken: string | null): void {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.setItem(SESSION_ACTIVE_KEY, '1')

  if (nextUser) {
    storage.setItem(SESSION_USER_KEY, JSON.stringify(nextUser))
  } else {
    storage.removeItem(SESSION_USER_KEY)
  }

  if (nextToken) {
    storage.setItem(SESSION_TOKEN_KEY, nextToken)
  } else {
    storage.removeItem(SESSION_TOKEN_KEY)
  }
}

function clearPersistedSession(): void {
  const storage = getStorage()

  if (!storage) {
    return
  }

  storage.removeItem(SESSION_ACTIVE_KEY)
  storage.removeItem(SESSION_USER_KEY)
  storage.removeItem(SESSION_TOKEN_KEY)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function getId(value: unknown): number | string | undefined {
  return typeof value === 'number' || typeof value === 'string' ? value : undefined
}

function getNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const asNumber = Number(value)
    return Number.isFinite(asNumber) ? asNumber : undefined
  }

  return undefined
}

function resolveRole(value: Record<string, unknown>): string | undefined {
  const roleObject = isRecord(value.role) ? value.role : null
  const roleCandidate =
    getString(value.rol) ??
    getString(value.role) ??
    getString(value.nombre_rol) ??
    (roleObject ? getString(roleObject.nombre_rol) : undefined) ??
    getNumber(value.id_rol) ??
    (roleObject ? getNumber(roleObject.id_rol) : undefined)

  return normalizeRole(roleCandidate) ?? undefined
}

function normalizeUser(value: unknown): SessionUser | null {
  if (!isRecord(value)) {
    return null
  }

  const id = getId(value.id) ?? getId(value.id_usuario)
  const idUsuario = getId(value.id_usuario) ?? getId(value.id)
  const idRol = getNumber(value.id_rol)
  const correo = getString(value.correo)
  const email = getString(value.email)
  const name = getString(value.name) ?? getString(value.nombre)
  const role = resolveRole(value)

  if (!id && !idUsuario && !correo && !email && !name && !role) {
    return null
  }

  return {
    id,
    id_usuario: idUsuario,
    id_rol: idRol,
    correo,
    email,
    name,
    nombre: name,
    rol: role,
    role,
  }
}

function extractSessionUser(payload: unknown): SessionUser | null {
  if (!isRecord(payload)) {
    return null
  }

  const nestedData = isRecord(payload.data) ? payload.data : null

  const nestedUser = normalizeUser(payload.user)
  if (nestedUser) {
    return nestedUser
  }

  const nestedUsuario = normalizeUser(payload.usuario)
  if (nestedUsuario) {
    return nestedUsuario
  }

  if (nestedData) {
    const dataUser = normalizeUser(nestedData.user)
    if (dataUser) {
      return dataUser
    }

    const dataUsuario = normalizeUser(nestedData.usuario)
    if (dataUsuario) {
      return dataUsuario
    }

    const dataPayload = normalizeUser(nestedData)
    if (dataPayload) {
      return dataPayload
    }
  }

  return normalizeUser(payload)
}

function extractAuthFlag(payload: unknown): boolean | null {
  if (!isRecord(payload)) {
    return null
  }

  const nestedData = isRecord(payload.data) ? payload.data : null

  if (typeof payload.authenticated === 'boolean') {
    return payload.authenticated
  }

  if (typeof payload.isAuthenticated === 'boolean') {
    return payload.isAuthenticated
  }

  if (nestedData && typeof nestedData.authenticated === 'boolean') {
    return nestedData.authenticated
  }

  if (nestedData && typeof nestedData.isAuthenticated === 'boolean') {
    return nestedData.isAuthenticated
  }

  return null
}

function extractSessionToken(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null
  }

  const directToken = getString(payload.token)
  if (directToken) {
    return directToken
  }

  const accessToken = getString(payload.accessToken) ?? getString(payload.access_token)
  if (accessToken) {
    return accessToken
  }

  const nestedData = isRecord(payload.data) ? payload.data : null
  if (!nestedData) {
    return null
  }

  return (
    getString(nestedData.token) ??
    getString(nestedData.accessToken) ??
    getString(nestedData.access_token) ??
    null
  )
}

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null)
  const token = ref<string | null>(null)
  const status = ref<SessionStatus>('unknown')
  const isLoading = ref(false)

  const isAuthenticated = computed(() => status.value === 'authenticated')
  const isReady = computed(() => status.value !== 'unknown' && status.value !== 'checking')
  const role = computed(() => user.value?.rol ?? user.value?.role ?? null)

  function setAuthenticatedUser(
    nextUser: SessionUser | null = null,
    nextToken: string | null = null,
  ): void {
    user.value = nextUser
    token.value = nextToken
    status.value = 'authenticated'
    persistSession(user.value, token.value)
  }

  async function hydrateProfile(nextToken: string | null = token.value): Promise<boolean> {
    const profilePayload = await getProfileRequest()
    const profileUser = extractSessionUser(profilePayload)

    if (!profileUser) {
      return false
    }

    setAuthenticatedUser(profileUser, nextToken)
    return true
  }

  function clearSession(): void {
    user.value = null
    token.value = null
    status.value = 'anonymous'
    clearPersistedSession()
  }

  async function checkSession(): Promise<boolean> {
    status.value = 'checking'

    const hasActiveSession = readStoredActiveFlag()
    const storedUser = readStoredUser()
    const storedToken = readStoredToken()

    if (hasActiveSession || storedUser || storedToken) {
      setAuthenticatedUser(storedUser, storedToken)

      const missingIdentity = !user.value?.id
      const missingRole = !role.value

      if (missingIdentity || missingRole) {
        try {
          const hydrated = await hydrateProfile(storedToken)

          if (!hydrated) {
            clearSession()
            return false
          }
        } catch {
          clearSession()
          return false
        }
      }

      return true
    }

    clearSession()
    return false
  }

  async function login(credentials: LoginCredentials): Promise<void> {
    isLoading.value = true

    try {
      const payload = await loginRequest(credentials)
      const extractedToken = extractSessionToken(payload)
      const authFlag = extractAuthFlag(payload)
      const extractedUser = extractSessionUser(payload)

      try {
        const hydrated = await hydrateProfile(extractedToken)
        if (hydrated) {
          return
        }
      } catch {
        // Si no se puede hidratar, se usa lo disponible en el payload de login.
      }

      if (extractedUser || extractedToken || authFlag) {
        setAuthenticatedUser(extractedUser, extractedToken)
      } else {
        clearSession()
      }
    } finally {
      isLoading.value = false
    }
  }

  async function bootstrap(): Promise<void> {
    if (status.value !== 'unknown') {
      return
    }

    await checkSession()
  }

  async function logout(): Promise<void> {
    isLoading.value = true

    try {
      await logoutRequest()
    } finally {
      clearSession()
      isLoading.value = false
    }
  }

  return {
    user,
    token,
    role,
    status,
    isLoading,
    isReady,
    isAuthenticated,
    login,
    logout,
    bootstrap,
    checkSession,
    clearSession,
  }
})
