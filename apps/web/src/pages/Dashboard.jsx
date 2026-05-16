import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { getTasks, createTask, toggleTask, deleteTask } from '../api/tasks'
import { getGoals } from '../api/goals'
import { getTodayHabits, getStreak, toggleHabit, getHabitHistory, createHabit } from '../api/habits'

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

const QUOTES = [
  "We are what we repeatedly do. Excellence is not an act, but a habit.",
  "Hard days build champions. Easy days build ordinary people.",
  "Discipline weighs ounces. Regret weighs tons.",
  "Don't stop when you're tired. Stop when you're done.",
  "Your future self is watching. Make them proud.",
]

function getGreeting(name) {
  const h = new Date().getHours()
  const t = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${t}, ${name?.split(' ')[0] || 'champion'}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [goals, setGoals] = useState([])
  const [habits, setHabits] = useState([])
  const [streak, setStreak] = useState(0)
  const [newTask, setNewTask] = useState('')
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [togglingHabit, setTogglingHabit] = useState(new Set())
  const [habitHistory, setHabitHistory] = useState([])
  const [showCelebration, setShowCelebration] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const previousAllDoneRef = useRef(false)
  const [showAddHabitModal, setShowAddHabitModal] = useState(false)
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    icon: 'ti-check',
    color: 'violet',
    repeat_days: 75,
  })

  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  // Check if all habits are completed and trigger celebration
  useEffect(() => {
    const habitsDone = habits.filter((h) => h.is_done).length
    const allDone = habits.length > 0 && habitsDone === habits.length
    
    // Only trigger celebration when transitioning from not-all-done to all-done
    if (allDone && !previousAllDoneRef.current && !loading) {
      setShowCelebration(true)
      setShowConfetti(true)
      
      // Hide confetti after 4 seconds
      setTimeout(() => setShowConfetti(false), 4000)
    }
    
    previousAllDoneRef.current = allDone
  }, [habits, loading])

  useEffect(() => {
    ;(async () => {
      try {
        const [t, g, h, s, hist] = await Promise.all([
          getTasks(),
          getGoals(),
          getTodayHabits(),
          getStreak(),
          getHabitHistory(7), // Last 7 days for mini heatmap
        ])
        setTasks(t)
        setGoals(g)
        setHabits(h)
        setStreak(s.streak)
        setHabitHistory(hist)
      } catch (err) {
        setError('Could not load. Is the server running?')
        console.error(err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    setAdding(true)
    const temp = { id: 'temp', title: newTask.trim(), is_done: false, category: 'personal' }
    setTasks((p) => [temp, ...p])
    setNewTask('')
    try {
      const saved = await createTask({ title: temp.title })
      setTasks((p) => p.map((t) => (t.id === 'temp' ? saved : t)))
    } catch {
      setTasks((p) => p.filter((t) => t.id !== 'temp'))
      setNewTask(temp.title)
    } finally {
      setAdding(false)
    }
  }

  const handleToggle = async (id) => {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, is_done: !t.is_done } : t)))
    try {
      const updated = await toggleTask(id)
      setTasks((p) => p.map((t) => (t.id === id ? updated : t)))
    } catch {
      setTasks((p) => p.map((t) => (t.id === id ? { ...t, is_done: !t.is_done } : t)))
    }
  }

  const handleDelete = async (id) => {
    setTasks((p) => p.filter((t) => t.id !== id))
    try {
      await deleteTask(id)
    } catch {}
  }

  const load = async () => {
    try {
      const [t, g, h, s, hist] = await Promise.all([
        getTasks(),
        getGoals(),
        getTodayHabits(),
        getStreak(),
        getHabitHistory(7),
      ])
      setTasks(t)
      setGoals(g)
      setHabits(h)
      setStreak(s.streak)
      setHabitHistory(hist)
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleHabit = async (habitId) => {
    if (togglingHabit.has(habitId)) return
    setTogglingHabit((p) => new Set([...p, habitId]))

    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, is_done: !h.is_done } : h))
    )

    try {
      await toggleHabit(habitId)
      // Reload streak after toggling
      const s = await getStreak()
      setStreak(s.streak)
    } catch (err) {
      // Revert on error
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, is_done: !h.is_done } : h))
      )
      console.error(err)
    } finally {
      setTogglingHabit((p) => {
        const n = new Set(p)
        n.delete(habitId)
        return n
      })
    }
  }

  const handleAddHabit = async (e) => {
    e.preventDefault()
    if (!newHabit.name.trim()) return

    try {
      await createHabit(newHabit)
      setShowAddHabitModal(false)
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

  const todoTasks = tasks.filter((t) => !t.is_done)
  const doneTasks = tasks.filter((t) => t.is_done)
  const habitsDone = habits.filter((h) => h.is_done).length
  
  // Calculate habit completion for last 7 days
  const getLast7DaysCompletion = () => {
    const today = new Date()
    const last7Days = []
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayLogs = habitHistory.filter(log => log.log_date.startsWith(dateStr))
      const completed = dayLogs.filter(log => log.is_done).length
      const total = new Set(dayLogs.map(log => log.habit_id)).size
      
      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      })
    }
    
    return last7Days
  }
  
  const last7Days = getLast7DaysCompletion()

  if (loading)
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="spinner" />
        </div>
      </Layout>
    )

  if (error)
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card bg-red-50 border-red-200 px-6 py-4"
          >
            <p className="text-red-600">{error}</p>
          </motion.div>
        </div>
      </Layout>
    )

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 bg-gradient-to-br from-violet-500 to-purple-600 text-white overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold mb-2"
            >
              {getGreeting(user?.name)}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/80 mb-4"
            >
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 italic max-w-2xl"
            >
              "{quote}"
            </motion.p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Habits Preview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <i className="ti ti-flame text-xl" />
                  Daily Habits
                </h3>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddHabitModal(true)}
                    className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors flex items-center gap-1"
                  >
                    <i className="ti ti-plus text-lg" />
                    Add
                  </motion.button>
                  <Link to="/habits" className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
                    Manage →
                  </Link>
                </div>
              </div>
              {habits.length === 0 ? (
                <div className="text-center py-8">
                  <i className="ti ti-flame text-4xl text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 mb-3">No habits yet</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddHabitModal(true)}
                    className="btn btn-primary text-sm"
                  >
                    <i className="ti ti-plus" />
                    Create your first habit
                  </motion.button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {habits.slice(0, 5).map((habit, index) => {
                    const isPending = togglingHabit.has(habit.id)
                    return (
                      <motion.button
                        key={habit.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleHabit(habit.id)}
                        disabled={isPending}
                        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                          habit.is_done
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-gray-200 bg-white hover:border-violet-300 hover:shadow-sm'
                        } ${isPending ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                      >
                        <i
                          className={`ti ${habit.icon} text-sm ${
                            habit.is_done ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        />
                        <span
                          className={`flex-1 text-sm text-left ${
                            habit.is_done ? 'text-emerald-700 line-through' : 'text-gray-700'
                          }`}
                        >
                          {habit.name}
                        </span>
                        {habit.is_done && <i className="ti ti-check text-xs text-emerald-600" />}
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 space-y-4"
            >
              <SectionHeader title="Today's Tasks" to="/tasks" linkLabel="View all" icon="ti-checkbox" />

              <form onSubmit={handleAdd} className="flex gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="input flex-1"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={adding || !newTask.trim()}
                  className="btn btn-primary"
                >
                  <i className="ti ti-plus text-lg" />
                </motion.button>
              </form>

            {tasks.length === 0 && (
              <EmptyState
                icon="ti-checkbox"
                text="No tasks yet"
                subtext="Add your first task above to get started!"
              />
            )}

              <AnimatePresence>
                <div className="space-y-2">
                  {todoTasks.map((task, index) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      index={index}
                    />
                  ))}
                </div>
              </AnimatePresence>

              {doneTasks.length > 0 && (
                <div className="pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Completed · {doneTasks.length}
                  </p>
                  <div className="space-y-2">
                    {doneTasks.map((task, index) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>


        </div>
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {showAddHabitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={() => setShowAddHabitModal(false)}
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
                  onClick={() => setShowAddHabitModal(false)}
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
                    onClick={() => setShowAddHabitModal(false)}
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

function StatCard({ label, value, sub, icon, color, lit, delay }) {
  const colors = {
    blue: { bg: 'from-blue-500 to-cyan-500', light: 'bg-blue-50 border-blue-200', text: 'text-blue-600' },
    orange: { bg: 'from-orange-500 to-pink-500', light: 'bg-orange-50 border-orange-200', text: 'text-orange-600' },
    violet: { bg: 'from-violet-500 to-purple-500', light: 'bg-violet-50 border-violet-200', text: 'text-violet-600' },
  }
  const c = colors[color] || colors.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`card p-5 ${lit ? c.light : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.bg} shadow-lg`}>
          <i className={`ti ${icon} text-xl text-white`} />
        </div>
      </div>
      <p className={`text-3xl font-bold mb-1 ${lit ? c.text : 'text-gray-900'}`}>{value}</p>
      <p className="text-sm text-gray-600">{sub}</p>
    </motion.div>
  )
}

function SectionHeader({ title, to, linkLabel, icon }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
        {icon && <i className={`ti ${icon} text-xl`} />}
        {title}
      </h3>
      {to && (
        <Link to={to} className="text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.03 }}
      className={`group card p-4 flex items-center gap-3 ${
        task.is_done ? 'opacity-60' : 'card-hover'
      }`}
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onToggle(task.id)}
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          task.is_done
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-gray-300 hover:border-violet-500'
        }`}
      >
        {task.is_done && <i className="ti ti-check text-xs text-white" />}
      </motion.button>

      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm ${
            task.is_done ? 'text-gray-400 line-through' : 'text-gray-900'
          }`}
        >
          {task.title}
        </span>
        {(task.scheduled_time || task.category !== 'personal') && (
          <div className="flex items-center gap-2 mt-1">
            {task.scheduled_time && (
              <span className="text-xs text-gray-500 font-mono">{task.scheduled_time.slice(0, 5)}</span>
            )}
            {task.category !== 'personal' && (
              <span className="badge badge-primary">{task.category}</span>
            )}
          </div>
        )}
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
      >
        <i className="ti ti-trash text-lg" />
      </motion.button>
    </motion.div>
  )
}

function GoalCard({ goal, index }) {
  const pct = Math.min(100, Math.max(0, goal.progress ?? 0))
  const daysLeft = goal.target_date
    ? Math.ceil((new Date(goal.target_date) - new Date()) / 86_400_000)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card p-4"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-medium text-gray-900 flex-1">{goal.title}</p>
        <span className="text-sm font-bold text-violet-600">{pct}%</span>
      </div>
      <div className="progress-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="progress-fill"
        />
      </div>
      {daysLeft !== null && (
        <p className="mt-2 text-xs text-gray-500">
          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today!' : 'Overdue'}
        </p>
      )}
    </motion.div>
  )
}

function EmptyState({ icon, text, subtext }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-8 text-center"
    >
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
        <i className={`ti ${icon} text-3xl text-gray-400`} />
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1">{text}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </motion.div>
  )
}

// Made with Bob
