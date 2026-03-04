import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { parseTasksFromText } from '@/lib/claude'
import { z } from 'zod'

const bodySchema = z.object({
  transcript: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const tasks = await parseTasksFromText(parsed.data.transcript)
    return NextResponse.json({ tasks })
  } catch (err) {
    console.error('Failed to parse tasks:', err)
    return NextResponse.json({ error: 'Failed to parse tasks' }, { status: 500 })
  }
}
