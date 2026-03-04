import { getSupabaseAdminClient } from './supabase/admin'
import type { Task, TokenAction } from './types'

export async function generateActionTokens(
  tasks: Task[],
  action: TokenAction
): Promise<Record<string, string>> {
  const supabase = getSupabaseAdminClient()

  const inserts = tasks.map((task) => ({
    task_id: task.id,
    action,
  }))

  const { data, error } = await supabase
    .from('action_tokens')
    .insert(inserts)
    .select('token, task_id')

  if (error) throw new Error(`Failed to generate tokens: ${error.message}`)

  // Return map of task_id -> token
  const tokenMap: Record<string, string> = {}
  for (const row of data ?? []) {
    tokenMap[row.task_id] = row.token
  }
  return tokenMap
}

export async function generateMultiActionTokens(
  tasks: Task[],
  actions: TokenAction[]
): Promise<Record<string, Record<TokenAction, string>>> {
  const supabase = getSupabaseAdminClient()

  const inserts = tasks.flatMap((task) =>
    actions.map((action) => ({ task_id: task.id, action }))
  )

  const { data, error } = await supabase
    .from('action_tokens')
    .insert(inserts)
    .select('token, task_id, action')

  if (error) throw new Error(`Failed to generate tokens: ${error.message}`)

  const tokenMap: Record<string, Record<TokenAction, string>> = {}
  for (const row of data ?? []) {
    if (!tokenMap[row.task_id]) tokenMap[row.task_id] = {} as Record<TokenAction, string>
    tokenMap[row.task_id][row.action as TokenAction] = row.token
  }
  return tokenMap
}

export async function validateAndConsumeToken(
  token: string
): Promise<{ task_id: string; action: TokenAction } | null> {
  const supabase = getSupabaseAdminClient()

  // Atomically mark the token as used and return its data
  const { data, error } = await supabase
    .from('action_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .select('task_id, action')
    .single()

  if (error || !data) return null

  return { task_id: data.task_id, action: data.action as TokenAction }
}
