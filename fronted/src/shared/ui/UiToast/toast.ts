import { reactive } from 'vue'

type ToastType = 'success' | 'error' | 'info'

export const toastState = reactive({
  visible: false,
  message: '',
  type: 'success' as ToastType,
})

let _timer: ReturnType<typeof setTimeout> | null = null

export function showToast(message: string, type: ToastType = 'success', duration = 3000) {
  toastState.message = message
  toastState.type = type
  toastState.visible = true
  if (_timer) clearTimeout(_timer)
  _timer = setTimeout(() => {
    toastState.visible = false
    _timer = null
  }, duration)
}

export function hideToast() {
  toastState.visible = false
  if (_timer) {
    clearTimeout(_timer)
    _timer = null
  }
}
