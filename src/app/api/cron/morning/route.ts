import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, getTodayForTimezone } from '@/lib/cron'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateActionTokens } from '@/lib/tokens'
import { getResendClient } from '@/lib/resend'
import { render } from '@react-email/components'
import MorningEmail from '@/../emails/MorningEmail'
import type { Task } from '@/lib/types'

export const maxDuration = 60

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  const tag = '[cron/morning]'
  console.log(`${tag} triggered at ${new Date().toISOString()}`)

  if (!verifyCronSecret(request)) {
    console.warn(`${tag} unauthorized request`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await getAllProfiles()
  console.log(`${tag} total users: ${users.length}`)

  const supabase = getSupabaseAdminClient()
  const resend = getResendClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  const results = await Promise.allSettled(
    users.map(async (user) => {
      const today = getTodayForTimezone(user.timezone)
      console.log(`${tag} processing user=${user.email} date=${today}`)

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', today)
        .eq('status', 'planned')
        .order('created_at', { ascending: true })

      if (tasksError) {
        console.error(`${tag} failed to fetch tasks for user=${user.email}:`, tasksError.message)
        throw tasksError
      }

      const plannedTasks: Task[] = tasks ?? []
      console.log(`${tag} user=${user.email} planned tasks: ${plannedTasks.length}`)

      if (plannedTasks.length === 0) {
        console.log(`${tag} skipping user=${user.email} — no planned tasks`)
        return
      }

      const tokenMap = await generateActionTokens(plannedTasks, 'complete')
      console.log(`${tag} generated ${Object.keys(tokenMap).length} tokens for user=${user.email}`)

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
        to: user.email,
        subject: `Your ${plannedTasks.length} task${plannedTasks.length === 1 ? '' : 's'} for today`,
        html,
      })

      if (sendError) {
        console.error(`${tag} email send failed for user=${user.email}:`, sendError)
        throw sendError
      }

      console.log(`${tag} email sent to user=${user.email} resend_id=${sendData?.id}`)
    })
  )

  const errors = results.filter((r) => r.status === 'rejected')
  const successes = results.filter((r) => r.status === 'fulfilled')

  if (errors.length > 0) {
    console.error(`${tag} completed with ${errors.length} error(s):`, errors.map((e) => (e as PromiseRejectedResult).reason))
  }

  console.log(`${tag} done — success=${successes.length} errors=${errors.length}`)

  return NextResponse.json({
    processed: users.length,
    success: successes.length,
    errors: errors.length,
  })
}
