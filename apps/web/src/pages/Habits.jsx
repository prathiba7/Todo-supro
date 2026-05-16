  import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Layout from '../components/Layout'
import {
  getTodayHabits,
  getHabitsByDate,
  toggleHabit,
  toggleHabitForDate,
  getStreak,
  getHabitHistory,
  createHabit,
  deleteHabit,
  getHabits
} from '../api/habits'

const ICON_OPTIONS = [
  { value: 'ti-run', label: 'Run' },
  { value: 'ti-dumbbell', label: 'Workout' },
  { value: 'ti-book', label: 'Read' },
  { value: 'ti-droplet', label: 'Water' },
  { value: 'ti-apple', label: 'Healthy Eating' },
  { value: 'ti-bed', label: 'Sleep' },
  { value: 'ti-yoga', label: 'Yoga' },
  { value: 'ti-bike', label: 'Bike' },
  { value: 'ti-walk', label: 'Walk' },
  { value: 'ti-meditation', label: 'Meditate' },
  { value: 'ti-pencil', label: 'Write' },
  { value: 'ti-code', label: 'Code' },
  { value: 'ti-camera', label: 'Photo' },
  { value: 'ti-music', label: 'Music' },
  { value: 'ti-heart', label: 'Self-care' },
]

const COLOR_OPTIONS = [
  { value: 'violet', class: 'bg-violet-500', lightClass: 'bg-violet-100', textClass: 'text-violet-600' },
  { value: 'blue', class: 'bg-blue-500', lightClass: 'bg-blue-100', textClass: 'text-blue-600' },
  { value: 'emerald', class: 'bg-emerald-500', lightClass: 'bg-emerald-100', textClass: 'text-emerald-600' },
  { value: 'pink', class: 'bg-pink-500', lightClass: 'bg-pink-100', textClass: 'text-pink-600' },
  { value: 'orange', class: 'bg-orange-500', lightClass: 'bg-orange-100', textClass: 'text-orange-600' },
  { value: 'red', class: 'bg-red-500', lightClass: 'bg-red-100', textClass: 'text-red-600' },
  { value: 'purple', class: 'bg-purple-500', lightClass: 'bg-purple-100', textClass: 'text-purple-600' },
  { value: 'cyan', class: 'bg-cyan-500', lightClass: 'bg-cyan-100', textClass: 'text-cyan-600' },
]

const MOTIVATIONAL_QUOTES = [
  "Small daily improvements lead to stunning results.",
  "Discipline is choosing between what you want now and what you want most.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The secret of getting ahead is getting started.",
  "You don't have to be great to start, but you have to start to be great.",
]

// Confetti component
function Confetti() {
  const confettiCount = 50
  const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: confettiCount }).map((_, i) => {
        const randomColor = colors[Math.floor(Math.random() * colors.length)]
        const randomX = Math.random() * 100
        const randomDelay = Math.random() * 0.5
        const randomDuration = 2 + Math.random() * 2
        const randomRotation = Math.random() * 360
        
        return (
          <motion.div
            key={i}
            initial={{
              top: '-10%',
              left: `${randomX}%`,
              rotate: randomRotation,
              opacity: 1
            }}
            animate={{
              top: '110%',
              rotate: randomRotation + 720,
              opacity: 0
            }}
            transition={{
              duration: randomDuration,
              delay: randomDelay,
              ease: 'easeIn'
            }}
            style={{
              position: 'absolute',
              width: '10px',
              height: '10px',
              backgroundColor: randomColor,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            }}
          />
        )
      })}
    </div>
  )
}

function buildHeatmap(history, days = 75, currentHabitsCount = 0) {
  // Get today's date in local timezone, normalized to midnight
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Get today as YYYY-MM-DD string in local timezone
  const todayStr = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')

  const dateMap = {}
  history.forEach((log) => {
    const date = log.log_date.split('T')[0]
    if (!dateMap[date]) dateMap[date] = { completed: 0, habitIds: new Set() }
    dateMap[date].habitIds.add(log.habit_id)
    if (log.is_done) dateMap[date].completed++
  })

  // Build array from TODAY backwards (Day 1 = today, Day 75 = 74 days ago)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - i) // Go backwards from today
    
    // Get date string in local timezone
    const iso = d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
    
    const data = dateMap[iso]
    const isFuture = iso > todayStr
    
    const dayTotal = data?.habitIds.size || 0
    const dayCompleted = data?.completed || 0
    const percentage = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0

    const status = isFuture
      ? 'future'
      : !data || dayTotal === 0
      ? 'missed'
      : dayCompleted === dayTotal && dayTotal > 0
      ? 'complete'
      : dayCompleted > 0
      ? 'partial'
      : 'missed'

    return {
      iso,
      isToday: iso === todayStr,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      status,
      day: i + 1, // Day 1 = today, Day 2 = yesterday, etc.
      completed: dayCompleted,
      total: dayTotal,
      percentage,
    }
  })
}

export default function Habits() {
  const [habits, setHabits] = useState([])
  const [streak, setStreak] = useState(0)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toggling, setToggling] = useState(new Set())
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const previousAllDoneRef = useRef(false)
  
  // Date selection state
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [isToday, setIsToday] = useState(true)
  
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    icon: 'ti-check',
    color: 'violet',
    repeat_days: 75,
  })

  useEffect(() => {
    load()
  }, [selectedDate])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    setIsToday(selectedDate === today)
  }, [selectedDate])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const habitsPromise = selectedDate === today
        ? getTodayHabits()
        : getHabitsByDate(selectedDate)
      
      const [h, s, hist] = await Promise.all([
        habitsPromise,
        getStreak(),
        getHabitHistory(75),
      ])
      setHabits(h)
      setStreak(s.streak)
      setHistory(hist)
    } catch (err) {
      setError('Failed to load habits. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (habitId) => {
    if (toggling.has(habitId)) return
    setToggling((p) => new Set([...p, habitId]))

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, is_done: !h.is_done } : h))
    )

    try {
      // Use date-specific toggle if not today
      if (isToday) {
        await toggleHabit(habitId)
      } else {
        await toggleHabitForDate(habitId, selectedDate)
      }
      
      // Reload streak and history to update heatmap
      const [s, hist] = await Promise.all([
        getStreak(),
        getHabitHistory(75)
      ])
      setStreak(s.streak)
      setHistory(hist)
    } catch (err) {
      // Revert on error
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, is_done: !h.is_done } : h))
      )
      console.error(err)
    } finally {
      setToggling((p) => {
        const n = new Set(p)
        n.delete(habitId)
        return n
      })
    }
  }

  const goToPreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const date = new Date(selectedDate)
    const today = new Date().toISOString().split('T')[0]
    date.setDate(date.getDate() + 1)
    const newDate = date.toISOString().split('T')[0]
    if (newDate <= today) {
      setSelectedDate(newDate)
    }
  }

  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }

  // Check if all habits are completed and trigger celebration
  useEffect(() => {
    const doneCount = habits.filter((h) => h.is_done).length
    const allDone = habits.length > 0 && doneCount === habits.length
    
    // Only trigger celebration when transitioning from not-all-done to all-done
    if (allDone && !previousAllDoneRef.current && !loading) {
      setShowCelebration(true)
      setShowConfetti(true)
      
      // Hide confetti after 4 seconds
      setTimeout(() => setShowConfetti(false), 4000)
    }
    
    previousAllDoneRef.current = allDone
  }, [habits, loading])

  const handleAddHabit = async (e) => {
    e.preventDefault()
    if (!newHabit.name.trim()) return

    try {
      await createHabit(newHabit)
      setShowAddModal(false)
      setNewHabit({
        name: '',
        description: '',
        icon: 'ti-check',
        color: 'violet',
        repeat_days: 75,
      })
      load()
    } catch (err) {
      console.error(err)
      alert('Failed to create habit')
    }
  }

  const handleDeleteHabit = async (habitId) => {
    if (!confirm('Are you sure you want to delete this habit?')) return

    try {
      await deleteHabit(habitId)
      load()
    } catch (err) {
      console.error(err)
      alert('Failed to delete habit')
    }
  }

  const doneCount = habits.filter((h) => h.is_done).length
  const allDone = habits.length > 0 && doneCount === habits.length
  // Use max repeat_days from all habits, or default to 75
  const maxDays = habits.length > 0 ? Math.max(...habits.map(h => h.repeat_days || 75)) : 75
  const heatmap = buildHeatmap(history, maxDays, habits.length)
  const completeDays = heatmap.filter((d) => d.status === 'complete').length
  const quote = MOTIVATIONAL_QUOTES[new Date().getDate() % MOTIVATIONAL_QUOTES.length]
  const todayProgress = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0

  const getColorClasses = (color) => {
    const colorObj = COLOR_OPTIONS.find((c) => c.value === color) || COLOR_OPTIONS[0]
    return colorObj
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-lg">
                  <i className="ti ti-flame text-2xl text-white" />
                </span>
                Daily Habits
              </h1>
              <p className="mt-1 text-gray-600">
                {streak > 0 ? `🔥 ${streak}-day streak` : 'Start your journey today'}
                {' · '}
                {completeDays} of {maxDays} days complete
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="btn btn-primary"
            >
              <i className="ti ti-plus text-lg" />
              Add Habit
            </motion.button>
          </div>

          {/* Date Navigator */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPreviousDay}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <i className="ti ti-chevron-left text-xl text-gray-700" />
              </motion.button>

              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="input text-center font-semibold"
                  />
                  {!isToday && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={goToToday}
                      className="btn btn-secondary text-sm"
                    >
                      <i className="ti ti-calendar-today text-lg" />
                      Today
                    </motion.button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isToday ? (
                    <span className="text-emerald-600 font-medium">📅 Viewing Today</span>
                  ) : (
                    <span className="text-orange-600 font-medium">📆 Viewing Past Day</span>
                  )}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextDay}
                disabled={isToday}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                  isToday
                    ? 'bg-gray-50 cursor-not-allowed opacity-50'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <i className="ti ti-chevron-right text-xl text-gray-700" />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-red-50 border-red-200 p-4"
          >
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={load} className="mt-2 text-red-700 underline text-sm">
              Retry
            </button>
          </motion.div>
        )}

        {!loading && habits.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-12 text-center"
          >
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-purple-100">
              <i className="ti ti-plus text-4xl text-violet-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No habits yet</h3>
            <p className="text-gray-600 mb-6">Create your first habit to start tracking your progress</p>
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <i className="ti ti-plus" />
              Create Your First Habit
            </button>
          </motion.div>
        )}

        {!loading && habits.length > 0 && (
          <>
            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Today
                  </p>
                  <p className={`text-3xl font-bold ${allDone ? 'text-emerald-600' : 'text-gray-900'}`}>
                    {doneCount}
                    <span className="text-xl text-gray-400">/{habits.length}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{todayProgress}% complete</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Streak
                  </p>
                  <p className={`text-3xl font-bold ${streak >= 7 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {streak}
                    <span className="text-xl text-gray-400"> days</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Complete
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {completeDays}
                    <span className="text-xl text-gray-400">/{maxDays}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                    Progress
                  </p>
                  <p className="text-3xl font-bold text-violet-600">
                    {Math.round((completeDays / maxDays) * 100)}
                    <span className="text-xl text-gray-400">%</span>
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="progress-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(doneCount / habits.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="progress-fill"
                  />
                </div>
                {allDone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200"
                  >
                    <p className="text-center text-lg font-bold text-emerald-600 flex items-center justify-center gap-2">
                      <span className="text-2xl">🎉</span>
                      All habits completed today!
                      <span className="text-2xl">🎉</span>
                    </p>
                    <p className="text-center text-sm text-emerald-600 mt-1">
                      You're absolutely crushing it! Keep up the amazing work! 💪
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Habits List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <AnimatePresence>
                {habits.map((habit, index) => {
                  const colorClasses = getColorClasses(habit.color)
                  const isPending = toggling.has(habit.id)

                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group"
                    >
                      <div
                        className={`card p-5 transition-all duration-300 ${
                          habit.is_done
                            ? `${colorClasses.lightClass} border-${habit.color}-200`
                            : 'hover:shadow-lg'
                        } ${isPending ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Checkbox */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleToggle(habit.id)}
                            disabled={isPending}
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                              habit.is_done
                                ? `${colorClasses.class} shadow-lg`
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {habit.is_done ? (
                              <i className="ti ti-check text-2xl text-white" />
                            ) : (
                              <i className={`ti ${habit.icon} text-2xl text-gray-500`} />
                            )}
                          </motion.button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`text-lg font-semibold transition-all ${
                                habit.is_done
                                  ? `${colorClasses.textClass} line-through`
                                  : 'text-gray-900'
                              }`}
                            >
                              {habit.name}
                            </h3>
                            {habit.description && (
                              <p
                                className={`text-sm mt-0.5 ${
                                  habit.is_done ? 'text-gray-500' : 'text-gray-600'
                                }`}
                              >
                                {habit.description}
                              </p>
                            )}
                          </div>

                          {/* Delete Button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteHabit(habit.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <i className="ti ti-trash text-lg" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>

            {/* Heatmap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Your Journey</h3>
                <div className="flex items-center gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-500" />
                    Complete
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-amber-400" />
                    Partial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-gray-200" />
                    Missed
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div
                  className="grid gap-1.5 min-w-[500px]"
                  style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}
                >
                  {heatmap.map((cell) => (
                    <motion.div
                      key={cell.iso}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: cell.day * 0.005 }}
                      whileHover={{ scale: 1.2, zIndex: 10 }}
                      title={`Day ${cell.day} · ${cell.label} · ${cell.status}${
                        cell.total > 0 ? ` · ${cell.percentage}% (${cell.completed}/${cell.total})` : ''
                      }`}
                      className={`relative aspect-square rounded-lg transition-all cursor-default flex items-center justify-center ${
                        cell.isToday ? 'ring-2 ring-violet-500 ring-offset-2' : ''
                      } ${
                        cell.status === 'complete'
                          ? 'bg-emerald-500 shadow-md'
                          : cell.status === 'partial'
                          ? 'bg-amber-400 shadow-sm'
                          : cell.status === 'future'
                          ? 'bg-gray-100 border border-gray-200'
                          : 'bg-gray-200'
                      }`}
                    >
                      {cell.total > 0 && cell.status !== 'future' && (
                        <span className={`text-[8px] font-bold ${
                          cell.status === 'complete' ? 'text-white' :
                          cell.status === 'partial' ? 'text-white' :
                          'text-gray-500'
                        }`}>
                          {cell.percentage}%
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-center text-sm text-gray-600">
                {completeDays} / {maxDays} days complete ·{' '}
                {maxDays - completeDays} to go
              </p>
            </motion.div>

            {/* Quote */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <p className="text-sm italic text-gray-600">"{quote}"</p>
            </motion.div>
          </>
        )}
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-lg p-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Create New Habit</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <i className="ti ti-x text-xl text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleAddHabit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder="e.g., Morning workout"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newHabit.description}
                    onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    placeholder="e.g., 30 minutes of cardio"
                    className="input resize-none"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {ICON_OPTIONS.map((icon) => (
                      <button
                        key={icon.value}
                        type="button"
                        onClick={() => setNewHabit({ ...newHabit, icon: icon.value })}
                        className={`flex h-12 items-center justify-center rounded-lg border-2 transition-all ${
                          newHabit.icon === icon.value
                            ? 'border-violet-500 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <i className={`ti ${icon.value} text-xl`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <div className="flex gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewHabit({ ...newHabit, color: color.value })}
                        className={`h-10 w-10 rounded-lg ${color.class} transition-all ${
                          newHabit.color === color.value
                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                            : 'hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Challenge Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newHabit.repeat_days}
                    onChange={(e) =>
                      setNewHabit({ ...newHabit, repeat_days: parseInt(e.target.value) || 75 })
                    }
                    min="1"
                    max="365"
                    className="input"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    <i className="ti ti-plus" />
                    Create Habit
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
            >
              {/* Close button */}
              <button
                onClick={() => setShowCelebration(false)}
                className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <i className="ti ti-x text-xl text-gray-600" />
              </button>

              {/* Content */}
              <div className="text-center">
                {/* Trophy Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-2xl"
                >
                  <i className="ti ti-trophy text-5xl text-white" />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-gray-900 mb-3"
                >
                  Congratulations! 🎉
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-600 mb-6"
                >
                  You've completed all your habits for today!
                </motion.p>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-6 mb-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-3xl font-bold text-violet-600">{habits.length}</p>
                      <p className="text-sm text-gray-600">Habits Done</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-orange-600">{streak}</p>
                      <p className="text-sm text-gray-600">Day Streak</p>
                    </div>
                  </div>
                </motion.div>

                {/* Motivational message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm italic text-gray-500 mb-6"
                >
                  "Success is the sum of small efforts repeated day in and day out."
                </motion.p>

                {/* Action button */}
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCelebration(false)}
                  className="btn btn-primary w-full text-lg py-3"
                >
                  <i className="ti ti-check text-xl" />
                  Awesome!
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Animation */}
      {showConfetti && <Confetti />}
    </Layout>
  )
}
