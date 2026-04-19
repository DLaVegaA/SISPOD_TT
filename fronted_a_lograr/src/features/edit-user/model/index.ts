// features/edit-user/model/index.ts
// Estado de formulario y validación para editar un usuario.

import { reactive } from 'vue'
import { isValidEmail } from '@/shared/lib'
import type { User, UpdateUserDto } from '@/entities/user'
import type { RoleId } from '@/shared/config'

export interface EditUserForm {
  name:   string
  email:  string
  role:   RoleId
  status: 'active' | 'inactive'
}

export type EditUserErrors = Partial<Record<keyof EditUserForm, string>>

export function useEditUserForm() {
  const form = reactive<EditUserForm>({
    name:   '',
    email:  '',
    role:   'patient',
    status: 'active',
  })

  const errors = reactive<EditUserErrors>({})

  function load(user: User): void {
    form.name   = user.name
    form.email  = user.email
    form.role   = user.role
    form.status = user.status
    clearErrors()
  }

  function clearErrors(): void {
    (Object.keys(errors) as Array<keyof EditUserErrors>).forEach(k => delete errors[k])
  }

  function validate(): boolean {
    clearErrors()
    if (!form.name.trim())              errors.name  = 'El nombre es requerido'
    if (!form.email.trim())             errors.email = 'El correo es requerido'
    else if (!isValidEmail(form.email)) errors.email = 'Correo inválido'
    if (!form.role)                     errors.role  = 'Selecciona un rol'
    return Object.keys(errors).length === 0
  }

  function toDto(): UpdateUserDto {
    return { name: form.name, email: form.email, role: form.role, status: form.status }
  }

  return { form, errors, load, validate, toDto, clearErrors }
}
