import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayForTimezone, formatDateForDisplay } from '@/lib/cron'
import TaskList from '@/components/TaskList'
import TriggerButtons from '@/components/TriggerButtons'
import TimezoneSync from '@/components/TimezoneSync'

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', user.id)
    .single()

  const timezone = profile?.timezone ?? 'America/Los_Angeles'
  const today = getTodayForTimezone(timezone)
  const formattedDate = formatDateForDisplay(today, timezone)

  console.log(`[dashboard] user=${user.email} timezone=${timezone} today=${today}`)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_date', today)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <a href="/" className="text-sm text-gray-400 hover:text-gray-600">DayLoop</a>
            <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Today</h1>
            <p className="text-sm text-gray-500">{formattedDate}</p>
            <p className="text-xs text-gray-400 mt-0.5">{timezone}</p>
          </div>
          <a
            href="/plan"
            className="mt-8 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            Plan tomorrow →
          </a>
        </div>

        <TimezoneSync profileTimezone={timezone} />
        <TaskList initialTasks={tasks ?? []} />
        <TriggerButtons />
      </div>
    </main>
  )
}
