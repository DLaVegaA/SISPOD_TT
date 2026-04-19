// features/create-user/model/index.ts
// Estado de formulario y validación para crear un usuario.

import { reactive, ref } from 'vue'
import { isValidEmail } from '@/shared/lib'
import type { CreateUserDto } from '@/entities/user'

export type CreateUserErrors = Partial<Record<keyof CreateUserDto, string>>

export function useCreateUserForm() {
  const form = reactive<CreateUserDto>({
    name:     '',
    email:    '',
    password: '',
    role:     'patient',
    status:   'active',
  })

  const errors  = reactive<CreateUserErrors>({})
  const showPwd = ref(false)

  function reset(): void {
    form.name     = ''
    form.email    = ''
    form.password = ''
    form.role     = 'patient'
    form.status   = 'active'
    showPwd.value = false
    clearErrors()
  }

  function clearErrors(): void {
    (Object.keys(errors) as Array<keyof CreateUserErrors>).forEach(k => delete errors[k])
  }

  function validate(): boolean {
    clearErrors()
    if (!form.name.trim())              errors.name     = 'El nombre es requerido'
    if (!form.email.trim())             errors.email    = 'El correo es requerido'
    else if (!isValidEmail(form.email)) errors.email    = 'Correo inválido'
    if (!form.password)                 errors.password = 'La contraseña es requerida'
    else if (form.password.length < 8)  errors.password = 'Mínimo 8 caracteres'
    if (!form.role)                     errors.role     = 'Selecciona un rol'
    return Object.keys(errors).length === 0
  }

  return { form, errors, showPwd, reset, validate, clearErrors }
}
