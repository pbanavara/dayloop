'use client'

import { useState } from 'react'
import TaskCard from './TaskCard'
import type { Task } from '@/lib/types'

interface TaskListProps {
  initialTasks: Task[]
}

export default function TaskList({ initialTasks }: TaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [loading, setLoading] = useState<string | null>(null)

  async function handleStatusChange(id: string, status: Task['status']) {
    setLoading(id)
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      if (res.ok) {
        const updated: Task = await res.json()
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
      }
    } finally {
      setLoading(null)
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p className="text-sm">No tasks planned for today.</p>
      </div>
    )
  }

  const done = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {done}/{tasks.length} done
        </span>
        <div className="h-1.5 flex-1 mx-4 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${tasks.length > 0 ? (done / tasks.length) * 100 : 0}%` }}
          />
        </div>
      </div>
      {tasks.map((task) => (
        <div key={task.id} className={loading === task.id ? 'opacity-50' : ''}>
          <TaskCard task={task} onStatusChange={handleStatusChange} />
        </div>
      ))}
    </div>
  )
}
