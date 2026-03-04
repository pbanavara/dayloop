'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionInstance {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface UseVoiceInputOptions {
  onResult: (transcript: string) => void
  onError?: (error: string) => void
}

export function useVoiceInput({ onResult, onError }: UseVoiceInputOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const transcriptRef = useRef('')

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as unknown as Record<string, unknown>)['SpeechRecognition'] as
        | (new () => SpeechRecognitionInstance)
        | undefined ||
      (window as unknown as Record<string, unknown>)['webkitSpeechRecognition'] as
        | (new () => SpeechRecognitionInstance)
        | undefined

    if (SpeechRecognitionAPI) {
      setIsSupported(true)
      const recognition = new SpeechRecognitionAPI()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let fullTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript
        }
        transcriptRef.current = fullTranscript
        setTranscript(fullTranscript)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        onError?.(event.error)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (transcriptRef.current) {
          onResult(transcriptRef.current)
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      recognitionRef.current?.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return
    transcriptRef.current = ''
    setTranscript('')
    recognitionRef.current.start()
    setIsListening(true)
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isListening, isSupported, transcript, startListening, stopListening }
}
