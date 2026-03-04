'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import TimezoneSelect from '@/components/TimezoneSelect'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

function HomeForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/plan'

  const [email, setEmail] = useState('')
  const [timezone, setTimezone] = useState('America/New_York')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?timezone=${encodeURIComponent(timezone)}&next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-6">📬</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h1>
          <p className="text-gray-500 text-sm">
            We sent a magic link to <strong>{email}</strong>. Click it to start planning.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DayLoop</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Plan tomorrow each evening. Get a morning email with one-click done buttons.
            No app. Just email.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Your timezone
              </label>
              <TimezoneSelect value={timezone} onChange={setTimezone} />
              <p className="mt-1 text-xs text-gray-400">
                We&apos;ll send emails at 9 AM and 9:30 PM in your timezone.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Get started →'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { icon: '📅', label: 'Plan tonight' },
                { icon: '☀️', label: 'Get reminded' },
                { icon: '✓', label: 'Stay on track' },
              ].map(({ icon, label }) => (
                <div key={label}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeForm />
    </Suspense>
  )
}
