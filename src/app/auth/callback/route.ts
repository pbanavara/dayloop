import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/plan'
  const timezoneFromUrl = searchParams.get('timezone')

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      if (timezoneFromUrl) {
        // Timezone was preserved in the redirect URL — save it directly
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email!,
          timezone: timezoneFromUrl,
        })
        console.log(`[auth/callback] profile saved tz=${timezoneFromUrl}`)
      } else {
        // Timezone not in URL (Supabase stripped it) — ensure profile exists with
        // a placeholder; the client will call /api/profile to fix the timezone
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (!existing) {
          await supabase.from('profiles').insert({
            id: data.user.id,
            email: data.user.email!,
            timezone: 'America/Los_Angeles', // will be overwritten by client
          })
          console.log(`[auth/callback] profile created with default tz (no tz param)`)
        }
      }
    }
  }

  // Pass tz_fix=1 so the landing page knows to re-save timezone from browser
  const redirectUrl = new URL(next, request.url)
  if (!timezoneFromUrl) {
    redirectUrl.searchParams.set('tz_fix', '1')
  }
  return NextResponse.redirect(redirectUrl)
}
