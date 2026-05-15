import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { getTasks, createTask, toggleTask, deleteTask } from '../api/tasks'
import { getGoals } from '../api/goals'
import { getTodayHabits, getStreak } from '../api/habits'

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

  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  useEffect(() => {
    ;(async () => {
      try {
        const [t, g, h, s] = await Promise.all([
          getTasks(),
          getGoals(),
          getTodayHabits(),
          getStreak(),
        ])
        setTasks(t)
        setGoals(g)
        setHabits(h)
        setStreak(s.streak)
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

  const todoTasks = tasks.filter((t) => !t.is_done)
  const doneTasks = tasks.filter((t) => t.is_done)
  const habitsDone = habits.filter((h) => h.is_done).length

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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            label="Tasks Today"
            value={`${doneTasks.length}/${tasks.length}`}
            sub={
              tasks.length === 0
                ? 'Add your first task'
                : doneTasks.length === tasks.length
                ? '🎉 All done!'
                : `${todoTasks.length} remaining`
            }
            icon="ti-checkbox"
            color="blue"
            lit={doneTasks.length === tasks.length && tasks.length > 0}
            delay={0.1}
          />
          <StatCard
            label="Daily Habits"
            value={`${habitsDone}/${habits.length}`}
            sub={
              habits.length === 0
                ? 'Create habits'
                : habitsDone === habits.length
                ? '🔥 All complete!'
                : `${habits.length - habitsDone} left`
            }
            icon="ti-flame"
            color="orange"
            lit={habitsDone === habits.length && habits.length > 0}
            delay={0.2}
          />
          <StatCard
            label="Streak"
            value={streak}
            sub={
              streak === 0
                ? 'Start today!'
                : streak >= 7
                ? `${streak} days on fire! 🔥`
                : `${streak} days strong`
            }
            icon="ti-trophy"
            color="violet"
            lit={streak >= 3}
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks Section */}
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

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Habits Preview */}
            <div>
              <SectionHeader title="Daily Habits" to="/habits" linkLabel="Manage" icon="ti-flame" />
              {habits.length === 0 ? (
                <EmptyState icon="ti-flame" text="No habits yet" subtext="Create your first habit!" />
              ) : (
                <div className="mt-3 space-y-2">
                  {habits.slice(0, 5).map((habit, index) => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
                        habit.is_done
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <i
                        className={`ti ${habit.icon} text-sm ${
                          habit.is_done ? 'text-emerald-600' : 'text-gray-400'
                        }`}
                      />
                      <span
                        className={`flex-1 text-sm ${
                          habit.is_done ? 'text-emerald-700 line-through' : 'text-gray-700'
                        }`}
                      >
                        {habit.name}
                      </span>
                      {habit.is_done && <i className="ti ti-check text-xs text-emerald-600" />}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Goals Preview */}
            <div>
              <SectionHeader title="Active Goals" to="/goals" linkLabel="Manage" icon="ti-target" />
              {goals.length === 0 ? (
                <EmptyState icon="ti-target" text="No goals yet" subtext="Set your first goal!" />
              ) : (
                <div className="mt-3 space-y-3">
                  {goals.slice(0, 3).map((goal, index) => (
                    <GoalCard key={goal.id} goal={goal} index={index} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
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
