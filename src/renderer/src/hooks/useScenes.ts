import { useCallback, useEffect, useState } from 'react'

export interface Scene {
  id: string
  name: string
  color: string
  brightness: number
}

const STORAGE_KEY = 'elk-saved-scenes'
const MAX_SCENES = 6

export function useScenes() {
  const [scenes, setScenes] = useState<Scene[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setScenes(JSON.parse(raw) as Scene[])
    } catch {
      setScenes([])
    }
  }, [])

  const persist = useCallback((next: Scene[]) => {
    setScenes(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const saveScene = useCallback(
    (name: string, color: string, brightness: number) => {
      const scene: Scene = {
        id: crypto.randomUUID(),
        name: name.trim() || `Сцена ${scenes.length + 1}`,
        color,
        brightness
      }
      const next = [scene, ...scenes].slice(0, MAX_SCENES)
      persist(next)
    },
    [persist, scenes]
  )

  const deleteScene = useCallback(
    (id: string) => {
      persist(scenes.filter((s) => s.id !== id))
    },
    [persist, scenes]
  )

  return { scenes, saveScene, deleteScene }
}
