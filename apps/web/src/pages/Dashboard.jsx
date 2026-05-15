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

  if (loading) return <Layout><div className="flex min-h-[60vh] items-center justify-center px-4"><span className="text-sm text-slate-500">Loading...</span></div></Layout>
  if (error)   return <Layout><div className="flex min-h-[60vh] items-center justify-center px-4"><div className="rounded-xl border border-red-800 bg-red-950 px-6 py-4 text-sm text-red-400">{error}</div></div></Layout>

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{getGreeting(user?.name)}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
          <p className="mt-3 max-w-2xl text-xs italic leading-relaxed text-slate-700 sm:text-sm">"{quote}"</p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 xl:grid-cols-3">
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="space-y-4 xl:col-span-3">
            <SectionHeader title="Today's tasks" to="/tasks" linkLabel="All tasks" />

            <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 transition-all focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button type="submit" disabled={adding||!newTask.trim()}
                className="flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-amber-400 disabled:opacity-40 sm:w-auto">
                <i className="ti ti-plus" aria-hidden="true" />
                <span className="ml-2 sm:hidden">Add task</span>
              </button>
            </form>

            {tasks.length===0&&<EmptyState text="No tasks yet. Type above and press Enter!" />}

            <div className="space-y-2">
              {todoTasks.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />)}
            </div>

            {doneTasks.length>0&&(
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-600">
                  Completed · {doneTasks.length}
                </p>
                <div className="space-y-2">
                  {doneTasks.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />)}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 xl:col-span-2">
            <div>
              <SectionHeader title="75 Hard — today" to="/75hard" linkLabel="Full tracker" />
              <div className="mt-3 space-y-1.5">
                {HABITS.map(({ field, icon, label }) => {
                  const done = hard75?.[field] ?? false
                  return (
                    <div key={field} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${done?'border-emerald-900/50 bg-emerald-950/40':'border-slate-800 bg-slate-900'}`}>
                      <i className={`ti ${icon} flex-shrink-0 text-sm ${done?'text-emerald-400':'text-slate-600'}`} aria-hidden="true" />
                      <span className={`min-w-0 flex-1 text-sm ${done?'text-emerald-600 line-through':'text-slate-400'}`}>{label}</span>
                      {done&&<i className="ti ti-check flex-shrink-0 text-xs text-emerald-500" aria-hidden="true" />}
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <SectionHeader title="Goals" to="/goals" linkLabel="Manage" />
              {goals.length===0
                ? <EmptyState text="No goals yet. Add one!" />
                : <div className="mt-3 space-y-3">{goals.slice(0,3).map((g)=><GoalCard key={g.id} goal={g} />)}</div>
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
    <div className={`rounded-xl border p-4 transition-all ${
      lit ? 'border-amber-900/50 bg-amber-950/25' : 'border-slate-800 bg-slate-900'
    }`}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-2xl font-bold sm:text-3xl ${lit ? 'text-amber-400' : 'text-white'}`}>{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{sub}</p>
    </div>
  )
}

function SectionHeader({ title, to, linkLabel }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</h3>
      {to && (
        <Link to={to} className="text-xs text-amber-400 transition-colors hover:text-amber-300">
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete }) {
  return (
    <div className={`group flex flex-wrap items-start gap-3 rounded-xl border px-3 py-3 transition-all sm:flex-nowrap sm:items-center ${
      task.is_done
        ? 'border-slate-800/40 bg-slate-900/40 opacity-60'
        : 'border-slate-800 bg-slate-900 hover:border-slate-700'
    }`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all sm:mt-0 ${
          task.is_done
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-slate-600 hover:border-amber-500'
        }`}
        aria-label={task.is_done ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.is_done && <i className="ti ti-check text-xs text-white" aria-hidden="true" />}
      </button>

      <div className="min-w-0 flex-1">
        <span className={`block break-words text-sm leading-relaxed ${task.is_done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
          {task.title}
        </span>

        <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
          {task.scheduled_time && (
            <span className="text-xs font-mono text-slate-600">{task.scheduled_time.slice(0,5)}</span>
          )}
          {task.category && task.category !== 'personal' && (
            <span className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-500">
              {task.category}
            </span>
          )}
        </div>
      </div>

      {task.scheduled_time && (
        <span className="hidden flex-shrink-0 text-xs font-mono text-slate-600 sm:inline">{task.scheduled_time.slice(0,5)}</span>
      )}

      {task.category && task.category !== 'personal' && (
        <span className="hidden rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-500 sm:inline">
          {task.category}
        </span>
      )}

      <button
        onClick={() => onDelete(task.id)}
        className="ml-auto text-slate-600 transition-all hover:text-red-400 sm:ml-0 sm:opacity-0 sm:group-hover:opacity-100"
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
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight text-white break-words">{goal.title}</p>
        <span className="flex-shrink-0 text-xs font-bold text-amber-400">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width:`${pct}%` }} />
      </div>
      {daysLeft !== null && (
        <p className="mt-2 text-xs text-slate-600">
          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today!' : 'Overdue'}
        </p>
      )}
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900 py-6 text-center">
      <p className="px-4 text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  )
}