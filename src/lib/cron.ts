import { getSupabaseAdminClient } from './supabase/admin'
import type { Profile } from './types'

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.from('profiles').select('id, email, timezone')
  if (error) throw new Error(`Failed to fetch profiles: ${error.message}`)
  return (data ?? []) as Profile[]
}

/**
 * Returns today's date (YYYY-MM-DD) in the given IANA timezone.
 */
export function getTodayForTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

/**
 * Adds days to a YYYY-MM-DD date string using pure calendar arithmetic —
 * no 24h offsets, DST-safe.
 */
export function shiftDate(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day + days))
  return d.toISOString().slice(0, 10)
}

/**
 * Returns yesterday's date (YYYY-MM-DD) in the given IANA timezone.
 */
export function getYesterdayForTimezone(timezone: string): string {
  return shiftDate(getTodayForTimezone(timezone), -1)
}

/**
 * Returns tomorrow's date (YYYY-MM-DD) in the given IANA timezone.
 */
export function getTomorrowForTimezone(timezone: string): string {
  return shiftDate(getTodayForTimezone(timezone), 1)
}

/**
 * Formats a YYYY-MM-DD date string for display in a given timezone.
 * e.g. "Tuesday, March 3"
 */
export function formatDateForDisplay(dateStr: string, timezone: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    // Force UTC midnight so the display day matches the date string exactly
  }).format(Date.UTC(year, month - 1, day, 12, 0, 0))
}
