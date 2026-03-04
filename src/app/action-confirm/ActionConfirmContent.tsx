'use client'

import { useSearchParams } from 'next/navigation'

const actionMessages: Record<string, { icon: string; title: string; subtitle: string }> = {
  complete: {
    icon: '✓',
    title: 'Task marked done!',
    subtitle: 'Great work. Keep it up.',
  },
  skip: {
    icon: '—',
    title: 'Task skipped',
    subtitle: "That's okay. Focus on what matters.",
  },
  carry_forward: {
    icon: '→',
    title: 'Carried forward',
    subtitle: "It's on tomorrow's list.",
  },
}

const errorMessages: Record<string, string> = {
  missing_token: 'No action token provided.',
  invalid_or_expired: 'This link has already been used or has expired.',
  default: 'Something went wrong.',
}

export default function ActionConfirmContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const action = searchParams.get('action') ?? ''
  const reason = searchParams.get('reason') ?? 'default'

  if (status === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link issue</h1>
          <p className="text-sm text-gray-500">
            {errorMessages[reason] ?? errorMessages.default}
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-block text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Go to dashboard
          </a>
        </div>
      </main>
    )
  }

  const msg = actionMessages[action] ?? actionMessages.complete

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl text-emerald-600 font-bold">{msg.icon}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{msg.title}</h1>
        <p className="text-sm text-gray-500">{msg.subtitle}</p>
        <div className="mt-8 flex gap-3 justify-center">
          <a
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-4 py-2 transition-colors"
          >
            View all tasks
          </a>
          <a
            href="/plan"
            className="text-sm text-white bg-gray-900 rounded-lg px-4 py-2 hover:bg-gray-700 transition-colors"
          >
            Plan tomorrow
          </a>
        </div>
      </div>
    </main>
  )
}
