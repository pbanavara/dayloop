'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TimezoneSyncProps {
  profileTimezone: string
}

export default function TimezoneSync({ profileTimezone }: TimezoneSyncProps) {
  const router = useRouter()

  useEffect(() => {
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!browserTz || browserTz === profileTimezone) return

    console.log(`[TimezoneSync] mismatch: profile=${profileTimezone} browser=${browserTz} — updating`)

    fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: browserTz }),
    }).then((res) => {
      if (res.ok) router.refresh()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
