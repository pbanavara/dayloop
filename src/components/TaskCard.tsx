'use client'

import type { Task } from '@/lib/types'

interface TaskCardProps {
  task: Task
  onStatusChange?: (id: string, status: Task['status']) => void
}

const statusConfig = {
  planned: { label: '☐', className: 'text-gray-400' },
  done: { label: '✓', className: 'text-emerald-500' },
  skipped: { label: '—', className: 'text-gray-300' },
}

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const config = statusConfig[task.status]

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-white p-4 transition-all ${
        task.status === 'done' ? 'border-emerald-100 bg-emerald-50' : 'border-gray-200'
      }`}
    >
      <button
        onClick={() => {
          if (!onStatusChange) return
          const next = task.status === 'planned' ? 'done' : 'planned'
          onStatusChange(task.id, next)
        }}
        className={`text-xl font-bold ${config.className} hover:opacity-70 transition-opacity w-6 text-center`}
        aria-label={task.status === 'done' ? 'Mark as planned' : 'Mark as done'}
      >
        {config.label}
      </button>
      <span
        className={`flex-1 text-sm ${
          task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'
        }`}
      >
        {task.title}
      </span>
      {onStatusChange && task.status === 'planned' && (
        <button
          onClick={() => onStatusChange(task.id, 'skipped')}
          className="text-xs text-gray-300 hover:text-gray-500 transition-colors"
          aria-label="Skip task"
        >
          skip
        </button>
      )}
    </div>
  )
}
