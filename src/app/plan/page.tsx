import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { getTodayForTimezone, getYesterdayForTimezone, getTomorrowForTimezone } from '@/lib/cron'
import PlanForm from './PlanForm'
import TimezoneSync from '@/components/TimezoneSync'

export default async function PlanPage() {
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
  const yesterday = getYesterdayForTimezone(timezone)
  const tomorrow = getTomorrowForTimezone(timezone)

  console.log(`[plan] user=${user.email} timezone=${timezone} today=${today} yesterday=${yesterday} tomorrow=${tomorrow}`)

  const { data: yesterdayTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('plan_date', yesterday)
    .order('created_at', { ascending: true })

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <a href="/" className="text-sm text-gray-400 hover:text-gray-600">DayLoop</a>
          <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Plan tomorrow</h1>
          <p className="text-sm text-gray-500">
            Planning for <strong>{tomorrow}</strong>
            <span className="text-gray-400 ml-1">({timezone})</span>
          </p>
        </div>

        {yesterdayTasks && yesterdayTasks.length > 0 && (
          <div className="mb-8 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Yesterday ({yesterday})
            </h2>
            <div className="flex gap-4 mb-3">
              <span className="text-sm text-emerald-600 font-medium">
                ✓ {yesterdayTasks.filter((t) => t.status === 'done').length} done
              </span>
              {yesterdayTasks.filter((t) => t.status !== 'done').length > 0 && (
                <span className="text-sm text-red-500 font-medium">
                  ✗ {yesterdayTasks.filter((t) => t.status !== 'done').length} incomplete
                </span>
              )}
            </div>
            <ul className="space-y-1">
              {yesterdayTasks.map((task) => (
                <li key={task.id} className="text-sm text-gray-500 flex items-center gap-2">
                  <span className={task.status === 'done' ? 'text-emerald-400' : 'text-red-300'}>
                    {task.status === 'done' ? '✓' : '✗'}
                  </span>
                  <span className={task.status === 'done' ? 'line-through text-gray-300' : ''}>
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <TimezoneSync profileTimezone={timezone} />
        <PlanForm planDate={tomorrow} />
      </div>
    </main>
  )
}
