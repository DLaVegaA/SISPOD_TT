export interface LogEntry {
  id: string
  patientName: string
  patientId: string
  authorName: string
  authorRole: string
  date: string 
  appointmentType: string
  description: string
  status: string
  tags: string[]
}