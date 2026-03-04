'use client'

import { useVoiceInput } from '@/hooks/useVoiceInput'

interface VoiceInputProps {
  onTranscript: (text: string) => void
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const { isListening, isSupported, transcript, startListening, stopListening } =
    useVoiceInput({ onResult: onTranscript })

  if (!isSupported) return null

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        <span className="text-base">{isListening ? '⏹' : '🎤'}</span>
        {isListening ? 'Stop' : 'Voice input'}
      </button>
      {isListening && transcript && (
        <span className="text-sm text-gray-500 italic truncate max-w-xs">
          {transcript}
        </span>
      )}
    </div>
  )
}
