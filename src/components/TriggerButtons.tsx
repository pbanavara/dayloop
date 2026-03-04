'use client'

import { useState } from 'react'

type EmailType = 'morning' | 'evening'
type Status = 'idle' | 'loading' | 'success' | 'error'

interface TriggerState {
  status: Status
  message: string
}

const initial: TriggerState = { status: 'idle', message: '' }

export default function TriggerButtons() {
  const [morning, setMorning] = useState<TriggerState>(initial)
  const [evening, setEvening] = useState<TriggerState>(initial)

  async function trigger(type: EmailType) {
    const set = type === 'morning' ? setMorning : setEvening
    set({ status: 'loading', message: '' })

    try {
      const res = await fetch(`/api/trigger/${type}`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        set({ status: 'error', message: data.error ?? 'Failed' })
      } else if (!data.sent) {
        set({ status: 'error', message: data.message ?? 'No tasks to send' })
      } else {
        set({ status: 'success', message: `Sent! Resend ID: ${data.resend_id}` })
      }
    } catch {
      set({ status: 'error', message: 'Network error' })
    }
  }

  return (
    <div className="mt-10 border-t border-gray-100 pt-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Manual email triggers
      </p>
      <div className="flex flex-col gap-2">
        <TriggerRow
          label="Send morning email"
          description="Today's tasks with [Done] buttons"
          state={morning}
          onClick={() => trigger('morning')}
        />
        <TriggerRow
          label="Send evening reminder"
          description="Yesterday's recap + planning link"
          state={evening}
          onClick={() => trigger('evening')}
        />
      </div>
    </div>
  )
}

function TriggerRow({
  label,
  description,
  state,
  onClick,
}: {
  label: string
  description: string
  state: TriggerState
  onClick: () => void
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
        {state.status === 'success' && (
          <p className="text-xs text-emerald-600 mt-0.5">{state.message}</p>
        )}
        {state.status === 'error' && (
          <p className="text-xs text-red-500 mt-0.5">{state.message}</p>
        )}
      </div>
      <button
        onClick={onClick}
        disabled={state.status === 'loading'}
        className={`ml-4 shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
          state.status === 'success'
            ? 'bg-emerald-100 text-emerald-700'
            : state.status === 'error'
            ? 'bg-red-100 text-red-600'
            : 'bg-gray-900 text-white hover:bg-gray-700'
        }`}
      >
        {state.status === 'loading'
          ? 'Sending...'
          : state.status === 'success'
          ? '✓ Sent'
          : state.status === 'error'
          ? 'Retry'
          : 'Send'}
      </button>
    </div>
  )
}
