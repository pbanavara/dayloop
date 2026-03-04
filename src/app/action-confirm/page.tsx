import { Suspense } from 'react'
import ActionConfirmContent from './ActionConfirmContent'

export default function ActionConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <ActionConfirmContent />
    </Suspense>
  )
}
