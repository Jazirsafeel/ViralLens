'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error'

export interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: number) => void
}

export function ToastContainer({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

function Toast({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const isSuccess = toast.type === 'success'

  return (
    <div
      className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${isSuccess ? 'var(--green-border)' : 'var(--red-border)'}`,
        color: isSuccess ? 'var(--green-text)' : 'var(--red-text)',
        boxShadow: 'var(--shadow-lg)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        minWidth: 200,
      }}
    >
      {isSuccess ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {toast.message}
    </div>
  )
}

let toastId = 0
type AddToast = (message: string, type?: ToastType) => void

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const addToast: AddToast = (message, type = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
  }
  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))
  return { toasts, addToast, removeToast }
}
