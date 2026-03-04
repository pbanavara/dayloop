import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateActionTokens } from '@/lib/tokens'
import { getResendClient } from '@/lib/resend'
import { getTodayForTimezone } from '@/lib/cron'
import { render } from '@react-email/components'
import MorningEmail from '@/../emails/MorningEmail'
import type { Task } from '@/lib/types'

const tag = '[trigger/morning]'

export async function POST() {
  console.log(`${tag} manual trigger at ${new Date().toISOString()}`)

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.warn(`${tag} unauthorized — no session`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log(`${tag} triggered by user=${user.email}`)

  const admin = getSupabaseAdminClient()
  const resend = getResendClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const { data: profile } = await admin
    .from('profiles')
    .select('timezone, email')
    .eq('id', user.id)
    .single()

  const timezone = profile?.timezone ?? 'America/New_York'
  const email = profile?.email ?? user.email!
  const today = getTodayForTimezone(timezone)
  console.log(`${tag} fetching tasks for date=${today} timezone=${timezone}`)

  const { data: tasks, error: tasksError } = await admin
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_date', today)
    .eq('status', 'planned')
    .order('created_at', { ascending: true })

  if (tasksError) {
    console.error(`${tag} failed to fetch tasks:`, tasksError.message)
    return NextResponse.json({ error: tasksError.message }, { status: 500 })
  }

  const plannedTasks: Task[] = tasks ?? []
  console.log(`${tag} planned tasks found: ${plannedTasks.length}`)

  if (plannedTasks.length === 0) {
    console.log(`${tag} no planned tasks — skipping email`)
    return NextResponse.json({ message: 'No planned tasks for today', sent: false })
  }

  const tokenMap = await generateActionTokens(plannedTasks, 'complete')
  console.log(`${tag} generated ${Object.keys(tokenMap).length} tokens`)

  const tasksWithTokens = plannedTasks.map((task) => ({
    ...task,
    actionUrl: `${appUrl}/api/action?token=${tokenMap[task.id]}`,
  }))

  const html = await render(
    MorningEmail({
      tasks: tasksWithTokens,
      dashboardUrl: `${appUrl}/dashboard`,
      date: today,
    })
  )

  const { data: sendData, error: sendError } = await resend.emails.send({
    from: 'DayLoop <hello@upsellpilot.com>',
    to: email,
    subject: `Your ${plannedTasks.length} task${plannedTasks.length === 1 ? '' : 's'} for today`,
    html,
  })

  if (sendError) {
    console.error(`${tag} email send failed:`, sendError)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  console.log(`${tag} email sent to=${email} resend_id=${sendData?.id}`)
  return NextResponse.json({ message: 'Morning email sent', resend_id: sendData?.id, sent: true })
}
