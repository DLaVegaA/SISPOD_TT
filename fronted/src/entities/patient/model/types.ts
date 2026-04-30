export type PatientStatus = 'Confirmada' | 'Pendiente' | 'Cancelada' | 'Sin citas'

export interface PatientSummary {
  id: number
  name: string
  age: string
  gender: string
  lastAppointment: string
  lastTreatment: string
  nextAppointment: string
  status: PatientStatus
  phone: string
}
