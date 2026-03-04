'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import VoiceInput from '@/components/VoiceInput'

interface PlanFormProps {
  planDate: string
}

export default function PlanForm({ planDate }: PlanFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [text, setText] = useState('')

  // If tz_fix=1 is set (Supabase stripped tz from redirect URL), save the
  // browser's detected timezone to the profile now that we have a session.
  useEffect(() => {
    if (searchParams.get('tz_fix') !== '1') return
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz) return
    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: tz }),
    }).then(() => {
      // Remove tz_fix param and reload so dates recalculate with correct tz
      router.replace('/plan')
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [tasks, setTasks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleVoiceTranscript(transcript: string) {
    setText(transcript)
    setParsing(true)
    setError('')
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      if (res.ok) {
        const { tasks: parsed } = await res.json()
        setTasks(parsed.map((t: { title: string }) => t.title))
      }
    } catch {
      setError('Failed to parse voice input')
    } finally {
      setParsing(false)
    }
  }

  function parseTextToTasks(raw: string): string[] {
    return raw
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
  }

  async function handleSave() {
    const finalTasks = tasks.length > 0 ? tasks : parseTextToTasks(text)
    if (finalTasks.length === 0) {
      setError('Add at least one task')
      return
    }

    setLoading(true)
    setError('')

    const body = finalTasks.map((title) => ({ title, plan_date: planDate }))

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setLoading(false)

    if (res.ok) {
      setSaved(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } else {
      setError('Failed to save tasks')
    }
  }

  if (saved) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">✓</div>
        <p className="text-lg font-semibold text-gray-900">Tasks saved!</p>
        <p className="text-sm text-gray-400 mt-1">You&apos;ll get a reminder tomorrow morning.</p>
      </div>
    )
  }

  const displayTasks = tasks.length > 0 ? tasks : parseTextToTasks(text)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Add tasks</span>
        <VoiceInput onTranscript={handleVoiceTranscript} />
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setTasks([]) // clear parsed tasks when user types
        }}
        placeholder="Call dentist&#10;Review Q3 report&#10;Prep standup slides"
        rows={6}
        className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none resize-none"
      />

      {parsing && (
        <p className="mt-2 text-xs text-gray-400">Parsing with AI...</p>
      )}

      {displayTasks.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <p className="text-xs text-gray-400 mb-2">Tasks to save:</p>
          {displayTasks.map((title, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm bg-gray-50 rounded-md px-3 py-2"
            >
              <span className="text-gray-300">☐</span>
              <span className="text-gray-700">{title}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSave}
        disabled={loading || parsing || (!text.trim() && tasks.length === 0)}
        className="mt-4 w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
      >
        {loading ? 'Saving...' : `Save ${displayTasks.length > 0 ? displayTasks.length : ''} task${displayTasks.length === 1 ? '' : 's'}`}
      </button>
    </div>
  )
}
