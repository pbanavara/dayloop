import { NextRequest, NextResponse } from 'next/server'
import { getAllProfiles, getYesterdayForTimezone } from '@/lib/cron'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { generateMultiActionTokens } from '@/lib/tokens'
import { getResendClient } from '@/lib/resend'
import { render } from '@react-email/components'
import EveningEmail from '@/../emails/EveningEmail'
import type { Task } from '@/lib/types'

export const maxDuration = 60

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  const tag = '[cron/evening]'
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
      const yesterday = getYesterdayForTimezone(user.timezone)
      console.log(`${tag} processing user=${user.email} date=${yesterday}`)

      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_date', yesterday)
        .order('created_at', { ascending: true })

      if (tasksError) {
        console.error(`${tag} failed to fetch tasks for user=${user.email}:`, tasksError.message)
        throw tasksError
      }

      const allTasks: Task[] = tasks ?? []
      const doneTasks = allTasks.filter((t) => t.status === 'done')
      const incompleteTasks = allTasks.filter((t) => t.status !== 'done')
      console.log(`${tag} user=${user.email} done=${doneTasks.length} incomplete=${incompleteTasks.length}`)

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
        to: user.email,
        subject,
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
