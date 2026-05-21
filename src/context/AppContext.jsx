import { createContext, useContext, useState, useEffect } from 'react'
import { loadProgress, saveProgress } from '../services/storage'

const AppContext = createContext(null)

const DEFAULT_PROGRESS = {
  topicsLearned: [],
  hoursStudied: 0,
  quizScores: [],
  streak: 0,
  lastStudied: null,
  savedNotes: [],
  flashcards: [],
  chatHistory: [],
  goals: [],
  completedGoals: [],
}

export function AppProvider({ children }) {
  const [progress, setProgress] = useState(DEFAULT_PROGRESS)
  const [notifications, setNotifications] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const saved = loadProgress()
    if (saved) setProgress(p => ({ ...DEFAULT_PROGRESS, ...saved }))
  }, [])

  const updateProgress = (updates) => {
    setProgress(prev => {
      const next = { ...prev, ...updates }
      saveProgress(next)
      return next
    })
  }

  const addTopic = (topic) => {
    setProgress(prev => {
      if (prev.topicsLearned.includes(topic)) return prev
      const next = {
        ...prev,
        topicsLearned: [...prev.topicsLearned, topic],
        hoursStudied: prev.hoursStudied + 0.5,
        lastStudied: new Date().toISOString(),
      }
      saveProgress(next)
      return next
    })
  }

  const addQuizScore = (topic, score, total) => {
    setProgress(prev => {
      const next = {
        ...prev,
        quizScores: [...prev.quizScores, { topic, score, total, date: new Date().toISOString() }]
      }
      saveProgress(next)
      return next
    })
  }

  const saveNote = (note) => {
    setProgress(prev => {
      const next = { ...prev, savedNotes: [{ ...note, id: Date.now(), savedAt: new Date().toISOString() }, ...prev.savedNotes] }
      saveProgress(next)
      return next
    })
  }

  const addFlashcards = (cards) => {
    setProgress(prev => {
      const next = { ...prev, flashcards: [...cards, ...prev.flashcards] }
      saveProgress(next)
      return next
    })
  }

  const addChatMessage = (msg) => {
    setProgress(prev => {
      const next = { ...prev, chatHistory: [...prev.chatHistory, msg] }
      saveProgress(next)
      return next
    })
  }

  const addNotification = (msg, type = 'info') => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, msg, type }])
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000)
  }

  const quizAccuracy = progress.quizScores.length
    ? Math.round(progress.quizScores.reduce((a, s) => a + (s.score / s.total) * 100, 0) / progress.quizScores.length)
    : 0

  return (
    <AppContext.Provider value={{
      progress, updateProgress, addTopic, addQuizScore, saveNote,
      addFlashcards, addChatMessage, quizAccuracy,
      notifications, addNotification,
      sidebarOpen, setSidebarOpen
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
