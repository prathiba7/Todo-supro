import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import { getTasks, createTask, toggleTask, deleteTask } from '../api/tasks'
import { getGoals } from '../api/goals'
import { getToday, getStreak } from '../api/hard75'

const QUOTES = [
  "We are what we repeatedly do. Excellence is not an act, but a habit.",
  "Hard days build champions. Easy days build ordinary people.",
  "Discipline weighs ounces. Regret weighs tons.",
  "Don't stop when you're tired. Stop when you're done.",
  "Your future self is watching. Make them proud.",
]

const HABITS = [
  { field:'workout1_done',         icon:'ti-run',     label:'Workout #1'      },
  { field:'workout2_outdoor_done', icon:'ti-trees',   label:'Outdoor workout' },
  { field:'water_done',            icon:'ti-droplet', label:'1 gallon water'  },
  { field:'reading_done',          icon:'ti-book',    label:'Read 10 pages'   },
  { field:'photo_done',            icon:'ti-camera',  label:'Progress photo'  },
]

function getGreeting(name) {
  const h = new Date().getHours()
  const t = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return `${t}, ${name?.split(' ')[0] || 'champion'}`
}

export default function Dashboard() {
  const { user }  = useAuth()
  const [tasks,   setTasks]   = useState([])
  const [goals,   setGoals]   = useState([])
  const [hard75,  setHard75]  = useState(null)
  const [streak,  setStreak]  = useState(0)
  const [newTask, setNewTask] = useState('')
  const [adding,  setAdding]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const quote = QUOTES[new Date().getDate() % QUOTES.length]

  // Load all dashboard data in parallel on mount
  useEffect(() => {
    ;(async () => {
      try {
        const [t, g, h, s] = await Promise.all([
          getTasks(), getGoals(), getToday(), getStreak(),
        ])
        setTasks(t); setGoals(g); setHard75(h); setStreak(s.streak)
      } catch (err) {
        setError('Could not load. Is the server running?')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Optimistic add — show task immediately, rollback if API fails
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTask.trim()) return
    setAdding(true)
    const temp = { id:'temp', title:newTask.trim(), is_done:false, category:'personal' }
    setTasks((p) => [temp, ...p])
    setNewTask('')
    try {
      const saved = await createTask({ title: temp.title })
      setTasks((p) => p.map((t) => t.id === 'temp' ? saved : t))
    } catch {
      setTasks((p) => p.filter((t) => t.id !== 'temp'))
      setNewTask(temp.title)
    } finally { setAdding(false) }
  }

  // Optimistic toggle — flip immediately, sync from server
  const handleToggle = async (id) => {
    setTasks((p) => p.map((t) => t.id === id ? {...t, is_done:!t.is_done} : t))
    try {
      const updated = await toggleTask(id)
      setTasks((p) => p.map((t) => t.id === id ? updated : t))
    } catch {
      setTasks((p) => p.map((t) => t.id === id ? {...t, is_done:!t.is_done} : t))
    }
  }

  const handleDelete = async (id) => {
    setTasks((p) => p.filter((t) => t.id !== id))
    try { await deleteTask(id) } catch { /* reload will resync */ }
  }

  const todoTasks  = tasks.filter((t) => !t.is_done)
  const doneTasks  = tasks.filter((t) =>  t.is_done)
  const hard75Done = hard75 ? HABITS.filter(({ field }) => hard75[field]).length : 0

  if (loading) return <Layout><div className="flex h-screen items-center justify-center"><span className="text-slate-500 text-sm">Loading...</span></div></Layout>
  if (error)   return <Layout><div className="flex h-screen items-center justify-center"><div className="bg-red-950 border border-red-800 rounded-xl px-6 py-4 text-sm text-red-400">{error}</div></div></Layout>

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">{getGreeting(user?.name)}</h2>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
          <p className="text-slate-700 text-xs italic mt-3">"{quote}"</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Tasks today"   value={`${doneTasks.length}/${tasks.length}`}
            sub={tasks.length===0?'Add your first task':doneTasks.length===tasks.length?'All done!':todoTasks.length+' remaining'}
            lit={doneTasks.length===tasks.length&&tasks.length>0} />
          <StatCard label="75 Hard habits" value={`${hard75Done}/5`}
            sub={hard75Done===5?'All habits complete!':`${5-hard75Done} left`}
            lit={hard75Done===5} />
          <StatCard label="Day streak" value={streak}
            sub={streak===0?'Start today!':streak>=7?`${streak} days on fire!`:`${streak} days strong`}
            lit={streak>=3} />
        </div>

        {/* 2-column layout */}
        <div className="grid grid-cols-5 gap-6">

          {/* Tasks (left, 3/5 width) */}
          <div className="col-span-3 space-y-4">
            <SectionHeader title="Today's tasks" to="/tasks" linkLabel="All tasks" />

            <form onSubmit={handleAdd} className="flex gap-2">
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <button type="submit" disabled={adding||!newTask.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all disabled:opacity-40">
                <i className="ti ti-plus" aria-hidden="true" />
              </button>
            </form>

            {tasks.length===0&&<EmptyState text="No tasks yet. Type above and press Enter!" />}

            <div className="space-y-2">
              {todoTasks.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />)}
            </div>

            {doneTasks.length>0&&(
              <div>
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest mb-2">
                  Completed · {doneTasks.length}
                </p>
                <div className="space-y-2">
                  {doneTasks.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />)}
                </div>
              </div>
            )}
          </div>

          {/* Right column (2/5 width) */}
          <div className="col-span-2 space-y-6">

            {/* 75 Hard habits */}
            <div>
              <SectionHeader title="75 Hard — today" to="/75hard" linkLabel="Full tracker" />
              <div className="space-y-1.5 mt-3">
                {HABITS.map(({ field, icon, label }) => {
                  const done = hard75?.[field] ?? false
                  return (
                    <div key={field} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${done?'bg-emerald-950/40 border-emerald-900/50':'bg-slate-900 border-slate-800'}`}>
                      <i className={`ti ${icon} text-sm flex-shrink-0 ${done?'text-emerald-400':'text-slate-600'}`} aria-hidden="true" />
                      <span className={`text-sm flex-1 ${done?'line-through text-emerald-600':'text-slate-400'}`}>{label}</span>
                      {done&&<i className="ti ti-check text-xs text-emerald-500" aria-hidden="true" />}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Goals */}
            <div>
              <SectionHeader title="Goals" to="/goals" linkLabel="Manage" />
              {goals.length===0
                ? <EmptyState text="No goals yet. Add one!" />
                : <div className="space-y-3 mt-3">{goals.slice(0,3).map((g)=><GoalCard key={g.id} goal={g} />)}</div>
              }
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}


function StatCard({ label, value, sub, lit }) {
  return (
    <div className={`rounded-xl p-4 border transition-all ${
      lit ? 'bg-amber-950/25 border-amber-900/50' : 'bg-slate-900 border-slate-800'
    }`}>
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold ${lit ? 'text-amber-400' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-slate-600 mt-1">{sub}</p>
    </div>
  )
}

function SectionHeader({ title, to, linkLabel }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</h3>
      {to && (
        <Link to={to} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete }) {
  return (
    <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
      task.is_done
        ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Circle checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          task.is_done
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-600 hover:border-amber-500'
        }`}
        aria-label={task.is_done ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.is_done && <i className="ti ti-check text-xs text-white" aria-hidden="true" />}
      </button>

      {/* Title */}
      <span className={`flex-1 text-sm ${task.is_done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
        {task.title}
      </span>

      {/* Time */}
      {task.scheduled_time && (
        <span className="text-xs text-slate-600 font-mono">{task.scheduled_time.slice(0,5)}</span>
      )}

      {/* Category badge */}
      {task.category && task.category !== 'personal' && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
          {task.category}
        </span>
      )}

      {/* Delete (appears on row hover) */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
        aria-label="Delete task"
      >
        <i className="ti ti-trash text-sm" aria-hidden="true" />
      </button>
    </div>
  )
}

function GoalCard({ goal }) {
  const pct = Math.min(100, Math.max(0, goal.progress ?? 0))
  const daysLeft = goal.target_date
    ? Math.ceil((new Date(goal.target_date) - new Date()) / 86_400_000)
    : null
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2 gap-2">
        <p className="text-sm font-medium text-white leading-tight">{goal.title}</p>
        <span className="text-xs font-bold text-amber-400 flex-shrink-0">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width:`${pct}%` }} />
      </div>
      {daysLeft !== null && (
        <p className="text-xs text-slate-600 mt-2">
          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today!' : 'Overdue'}
        </p>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl py-6 text-center">
      <p className="text-sm text-slate-600">{text}</p>
    </div>
  )
}