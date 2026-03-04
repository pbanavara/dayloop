'use client'

import { useEffect, useState } from 'react'

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

interface TimezoneSelectProps {
  value: string
  onChange: (tz: string) => void
}

export default function TimezoneSelect({ value, onChange }: TimezoneSelectProps) {
  const [detected, setDetected] = useState<string | null>(null)

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setDetected(tz)
    if (!value && tz) {
      onChange(tz)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
      >
        {detected && !COMMON_TIMEZONES.includes(detected) && (
          <option value={detected}>{detected} (detected)</option>
        )}
        {COMMON_TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
            {tz === detected ? ' (your timezone)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
