import { NextRequest, NextResponse } from 'next/server'
import { validateAndConsumeToken } from '@/lib/tokens'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

// Public GET endpoint — the token IS the credential
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  if (!token) {
    return NextResponse.redirect(
      new URL('/action-confirm?status=error&reason=missing_token', appUrl)
    )
  }

  const result = await validateAndConsumeToken(token)
  if (!result) {
    return NextResponse.redirect(
      new URL('/action-confirm?status=error&reason=invalid_or_expired', appUrl)
    )
  }

  const { task_id, action } = result
  const supabase = getSupabaseAdminClient()

  if (action === 'complete') {
    await supabase
      .from('tasks')
      .update({ status: 'done', completed_at: new Date().toISOString() })
      .eq('id', task_id)
  } else if (action === 'skip') {
    await supabase
      .from('tasks')
      .update({ status: 'skipped' })
      .eq('id', task_id)
  } else if (action === 'carry_forward') {
    // Get original task
    const { data: task } = await supabase
      .from('tasks')
      .select('user_id, title')
      .eq('id', task_id)
      .single()

    if (task) {
      // Mark original as skipped
      await supabase
        .from('tasks')
        .update({ status: 'skipped' })
        .eq('id', task_id)

      // Create new task for tomorrow
      const tomorrow = new Intl.DateTimeFormat('en-CA').format(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      )
      await supabase.from('tasks').insert({
        user_id: task.user_id,
        title: task.title,
        plan_date: tomorrow,
      })
    }
  }

  return NextResponse.redirect(
    new URL(`/action-confirm?status=success&action=${action}`, appUrl)
  )
}
