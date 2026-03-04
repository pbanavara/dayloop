export type TaskStatus = 'planned' | 'done' | 'skipped'
export type TokenAction = 'complete' | 'skip' | 'carry_forward'

export interface Profile {
  id: string
  email: string
  timezone: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  plan_date: string // YYYY-MM-DD
  status: TaskStatus
  created_at: string
  completed_at: string | null
}

export interface ActionToken {
  token: string
  task_id: string
  action: TokenAction
  used_at: string | null
  expires_at: string
}
