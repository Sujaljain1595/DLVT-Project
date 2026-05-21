const KEY = 'dlvt_progress'

export const saveProgress = (data) => {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}

export const loadProgress = () => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export const clearProgress = () => localStorage.removeItem(KEY)
