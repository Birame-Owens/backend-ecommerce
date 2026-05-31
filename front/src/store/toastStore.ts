import { create } from 'zustand'

interface Toast { id: number; msg: string; icon?: string }

interface ToastState {
  toasts: Toast[]
  show: (msg: string, icon?: string) => void
}

let nextId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: (msg, icon) => {
    const id = ++nextId
    set((s) => ({ toasts: [...s.toasts, { id, msg, icon }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000)
  },
}))
