import { computed, ref } from 'vue'
import { calcStars, getLevel, TOTAL_LEVELS, type LevelProgress } from '@/game/match3'

const KEY = 'match3_progress'

function load(): LevelProgress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const p = JSON.parse(raw) as LevelProgress
      if (p && typeof p === 'object' && p.stars) {
        return {
          stars: p.stars ?? {},
          currentLevel: Math.max(1, Math.min(TOTAL_LEVELS, p.currentLevel || 1)),
        }
      }
    }
  } catch {
    /* ignore */
  }
  return { stars: {}, currentLevel: 1 }
}

const progress = ref<LevelProgress>(load())

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress.value))
  } catch {
    /* ignore */
  }
}

export function useMatch3Level() {
  const stars = computed(() => progress.value.stars)
  const currentLevel = computed(() => progress.value.currentLevel)
  const total = TOTAL_LEVELS

  const totalStars = computed(() =>
    Object.values(progress.value.stars).reduce((a, b) => a + (b || 0), 0),
  )

  const maxUnlocked = computed(() => {
    let max = 1
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
      if (i === 1 || progress.value.stars[String(i - 1)]) max = i
      else break
    }
    return max
  })

  function isUnlocked(id: number) {
    if (id <= 1) return true
    return !!progress.value.stars[String(id - 1)]
  }

  function setCurrentLevel(id: number) {
    const clamped = Math.max(1, Math.min(TOTAL_LEVELS, id))
    if (!isUnlocked(clamped)) return
    progress.value = { ...progress.value, currentLevel: clamped }
    persist()
  }

  function saveWin(id: number, movesLeft: number, movesTotal: number) {
    const star = calcStars(movesLeft, movesTotal)
    const key = String(id)
    const prev = progress.value.stars[key] ?? 0
    const nextStars = { ...progress.value.stars }
    if (star > prev) nextStars[key] = star
    else if (!prev) nextStars[key] = star

    let nextCurrent = progress.value.currentLevel
    if (id >= nextCurrent && id < TOTAL_LEVELS) {
      nextCurrent = id + 1
    }
    progress.value = { stars: nextStars, currentLevel: nextCurrent }
    persist()
    return star
  }

  function starOf(id: number) {
    return progress.value.stars[String(id)] ?? 0
  }

  return {
    stars,
    currentLevel,
    total,
    totalStars,
    maxUnlocked,
    isUnlocked,
    setCurrentLevel,
    saveWin,
    starOf,
    getLevel,
  }
}
