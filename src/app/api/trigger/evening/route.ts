import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateMultiActionTokens } from '@/lib/tokens'
import { getResendClient } from '@/lib/resend'
import { getYesterdayForTimezone } from '@/lib/cron'
import { render } from '@react-email/components'
import EveningEmail from '@/../emails/EveningEmail'
import type { Task } from '@/lib/types'

const tag = '[trigger/evening]'

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
  const yesterday = getYesterdayForTimezone(timezone)
  console.log(`${tag} fetching tasks for date=${yesterday} timezone=${timezone}`)

  const { data: tasks, error: tasksError } = await admin
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_date', yesterday)
    .order('created_at', { ascending: true })

  if (tasksError) {
    console.error(`${tag} failed to fetch tasks:`, tasksError.message)
    return NextResponse.json({ error: tasksError.message }, { status: 500 })
  }

  const allTasks: Task[] = tasks ?? []
  const doneTasks = allTasks.filter((t) => t.status === 'done')
  const incompleteTasks = allTasks.filter((t) => t.status !== 'done')
  console.log(`${tag} done=${doneTasks.length} incomplete=${incompleteTasks.length}`)

  const tokenMap =
    incompleteTasks.length > 0
      ? await generateMultiActionTokens(incompleteTasks, ['carry_forward', 'skip'])
      : {}

  if (incompleteTasks.length > 0) {
    console.log(`${tag} generated tokens for ${Object.keys(tokenMap).length} incomplete tasks`)
  }

  const incompleteWithTokens = incompleteTasks.map((task) => ({
    ...task,
    carryUrl: tokenMap[task.id]
      ? `${appUrl}/api/action?token=${tokenMap[task.id].carry_forward}`
      : undefined,
    dropUrl: tokenMap[task.id]
      ? `${appUrl}/api/action?token=${tokenMap[task.id].skip}`
      : undefined,
  }))

  const html = await render(
    EveningEmail({
      doneTasks,
      incompleteTasks: incompleteWithTokens,
      planUrl: `${appUrl}/plan`,
      date: yesterday,
    })
  )

  const doneCount = doneTasks.length
  const totalCount = allTasks.length
  const subject =
    totalCount === 0
      ? 'Plan tomorrow — 2 min'
      : `${doneCount}/${totalCount} done yesterday — plan tomorrow`

  const { data: sendData, error: sendError } = await resend.emails.send({
    from: 'DayLoop <hello@upsellpilot.com>',
    to: email,
    subject,
    html,
  })

  if (sendError) {
    console.error(`${tag} email send failed:`, sendError)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  console.log(`${tag} email sent to=${email} resend_id=${sendData?.id}`)
  return NextResponse.json({ message: 'Evening email sent', resend_id: sendData?.id, sent: true })
}
