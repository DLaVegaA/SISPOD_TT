// shared/lib/index.ts
// Librerías genéricas sin lógica de negocio.

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function generateId(): number {
  return Date.now()
}
