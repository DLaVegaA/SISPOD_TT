import { reactive, ref } from 'vue'
import { isValidEmail } from '@/shared/lib'
import type { CreateUserDto } from '@/entities/user'

export type CreateUserErrors = Partial<Record<keyof CreateUserDto, string>>

/* // Estado de formulario y validacion para crear usuarios
export function useCreateUserForm() {
  const form = reactive<CreateUserDto>({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    status: 'active',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    fechaNacimiento: '',
    curp: '',
    genero: '',
    noCedula: '',
    calle: '',
    numExt: '',
    numInt: '',
    colonia: '',
    municipio: '',
    estadoDireccion: '',
    codigoPostal: '',
  })

  const errors = reactive<CreateUserErrors>({})
  const showPwd = ref(false)

  function reset(): void {
    form.name = ''
    form.email = ''
    form.password = ''
    form.role = 'patient'
    form.status = 'active'
    form.apellidoPaterno = ''
    form.apellidoMaterno = ''
    form.telefono = ''
    form.fechaNacimiento = ''
    form.curp = ''
    form.genero = ''
    form.noCedula = ''
    form.calle = ''
    form.numExt = ''
    form.numInt = ''
    form.colonia = ''
    form.municipio = ''
    form.estadoDireccion = ''
    form.codigoPostal = ''
    showPwd.value = false
    clearErrors()
  }

  function clearErrors(): void {
    ;(Object.keys(errors) as Array<keyof CreateUserErrors>).forEach((k) => delete errors[k])
  }

  function validate(): boolean {
    clearErrors()
    const isPatient = form.role === 'patient'
    const isDentist = form.role === 'dentist'
    const requiresExtendedData = isPatient || isDentist

    if (!form.name.trim()) errors.name = 'El nombre es requerido'
    if (!form.email.trim()) errors.email = 'El correo es requerido'
    else if (!isValidEmail(form.email)) errors.email = 'Correo inválido'

    if (!isPatient) {
      if (!form.password) errors.password = 'La contraseña es requerida'
      else if (form.password.length < 8) errors.password = 'Mínimo 8 caracteres'
    }

    if (!form.role) errors.role = 'Selecciona un rol'

    if (requiresExtendedData) {
      if (!form.apellidoPaterno.trim()) errors.apellidoPaterno = 'El apellido paterno es requerido'
      if (!form.apellidoMaterno.trim()) errors.apellidoMaterno = 'El apellido materno es requerido'
      if (!form.telefono.trim()) errors.telefono = 'El teléfono es requerido'
      else if (!/^\d{10}$/.test(form.telefono))
        errors.telefono = 'El teléfono debe tener 10 dígitos'
      if (!form.fechaNacimiento.trim())
        errors.fechaNacimiento = 'La fecha de nacimiento es requerida'
      if (!form.curp.trim()) errors.curp = 'La CURP es requerida'
      else if (form.curp.trim().length !== 18) errors.curp = 'La CURP debe tener 18 caracteres'
      if (!form.genero.trim()) errors.genero = 'El género es requerido'
    }

    if (isDentist && !form.noCedula.trim()) {
      errors.noCedula = 'La cédula profesional es requerida'
    }

    if (isPatient) {
      if (!form.calle.trim()) errors.calle = 'La calle es requerida'
      if (!form.numExt.trim()) errors.numExt = 'El número exterior es requerido'
      if (!form.colonia.trim()) errors.colonia = 'La colonia es requerida'
      if (!form.municipio.trim()) errors.municipio = 'El municipio es requerido'
      if (!form.estadoDireccion.trim()) errors.estadoDireccion = 'El estado es requerido'
      if (!form.codigoPostal.trim()) errors.codigoPostal = 'El código postal es requerido'
      else if (!/^\d{5}$/.test(form.codigoPostal)) {
        errors.codigoPostal = 'El código postal debe tener 5 dígitos'
      }
    }

    return Object.keys(errors).length === 0
  }

  return { form, errors, showPwd, reset, clearErrors, validate }
} */

// Estado de formulario y validacion para crear usuarios
export function useCreateUserForm() {
  const form = reactive<CreateUserDto>({
    name: '',
    email: '',
    password: '',
    role: 'patient',
    status: 'active',
    apellidoPaterno: '',
    apellidoMaterno: '',
    telefono: '',
    fechaNacimiento: '',
    curp: '',
    genero: '',
    noCedula: '',
    calle: '',
    numExt: '',
    numInt: '',
    colonia: '',
    municipio: '',
    estadoDireccion: '',
    codigoPostal: '',
  })

  const errors = reactive<CreateUserErrors>({})
  const showPwd = ref(false)

  function reset(): void {
    form.name = ''
    form.email = ''
    form.password = ''
    form.role = 'patient'
    form.status = 'active'
    form.apellidoPaterno = ''
    form.apellidoMaterno = ''
    form.telefono = ''
    form.fechaNacimiento = ''
    form.curp = ''
    form.genero = ''
    form.noCedula = ''
    form.calle = ''
    form.numExt = ''
    form.numInt = ''
    form.colonia = ''
    form.municipio = ''
    form.estadoDireccion = ''
    form.codigoPostal = ''
    showPwd.value = false
    clearErrors()
  }

  function clearErrors(): void {
    ;(Object.keys(errors) as Array<keyof CreateUserErrors>).forEach((k) => delete errors[k])
  }

  function validate(): boolean {
    clearErrors()
    const isPatient = form.role === 'patient'
    const isDentist = form.role === 'dentist'
    const requiresExtendedData = isPatient || isDentist

    if (!form.name.trim()) errors.name = 'El nombre es requerido'
    if (!form.email.trim()) errors.email = 'El correo es requerido'
    else if (!isValidEmail(form.email)) errors.email = 'Correo inválido'

    if (!isPatient) {
      if (!form.password) errors.password = 'La contraseña es requerida'
      else if (form.password.length < 8) errors.password = 'Mínimo 8 caracteres'
    }

    if (!form.role) errors.role = 'Selecciona un rol'

    if (requiresExtendedData) {
      if (!form.apellidoPaterno.trim()) errors.apellidoPaterno = 'El apellido paterno es requerido'
      
      // Apellido materno ya no es obligatorio, por lo que quitamos su validación de "requerido"

      // El teléfono y el género NO se validan para los pacientes en el pre-registro
      if (!isPatient) {
        if (!form.telefono.trim()) errors.telefono = 'El teléfono es requerido'
        else if (!/^\d{10}$/.test(form.telefono))
          errors.telefono = 'El teléfono debe tener 10 dígitos'
          
        if (!form.genero.trim()) errors.genero = 'El género es requerido'
      }

      if (!form.fechaNacimiento.trim())
        errors.fechaNacimiento = 'La fecha de nacimiento es requerida'
        
      if (!form.curp.trim()) errors.curp = 'La CURP es requerida'
      else if (form.curp.trim().length !== 18) errors.curp = 'La CURP debe tener 18 caracteres'
    }

    if (isDentist && !form.noCedula.trim()) {
      errors.noCedula = 'La cédula profesional es requerida'
    }

    // ELIMINAMOS todo el bloque final que validaba la calle, municipio, etc.
    // para que no bloquee el envío del pre-registro del paciente.

    return Object.keys(errors).length === 0
  }

  return { form, errors, showPwd, reset, clearErrors, validate }
}
